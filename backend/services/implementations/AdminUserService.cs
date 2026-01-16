using backend.auth;
using backend.data;
using backend.dtos;
using backend.errors;
using backend.models;
using backend.models.@base;
using backend.services.interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.services.implementations;

public sealed class AdminUserService(AppDbContext db, ICurrentUser current) : IAdminUserService
{
    public async Task<IReadOnlyList<AdminUserListItemDto>> ListAsync(string? q, int limit = 50, int offset = 0)
    {
        limit = Math.Clamp(limit, 1, 200);
        offset = Math.Max(offset, 0);

        var query = db.Users.AsNoTracking().Where(u => !u.IsDeleted);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var s = q.Trim().ToLowerInvariant();
            query = query.Where(u =>
                u.Email.ToLower().Contains(s) ||
                u.FirstName.ToLower().Contains(s) ||
                u.LastName.ToLower().Contains(s));
        }

        return await query
            .OrderBy(u => u.Email)
            .Skip(offset)
            .Take(limit)
            .Select(u => new AdminUserListItemDto(
                u.Id,
                u.Email,
                u.FirstName,
                u.LastName,
                u.IsActive,
                u.Permissions,
                u.Roles.Where(r => !r.IsDeleted).Select(r => (short)r.Role).ToList(),
                u.Student != null && !u.Student.IsDeleted
                    ? new StudentMiniDto(u.Student.Id, u.Student.StudentNumber)
                    : null,
                u.Staff != null && !u.Staff.IsDeleted ? new StaffMiniDto(u.Staff.Id, u.Staff.StaffNumber) : null
            ))
            .ToListAsync();
    }

    public async Task<AdminUserDetailDto> GetAsync(Guid userId)
    {
        var dto = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId && !u.IsDeleted)
            .Select(u => new AdminUserDetailDto(
                u.Id,
                u.Email,
                u.FirstName,
                u.LastName,
                u.IsActive,
                u.Permissions,
                u.Roles.Where(r => !r.IsDeleted).Select(r => (short)r.Role).ToList(),
                u.Student != null && !u.Student.IsDeleted
                    ? new StudentMiniDto(u.Student.Id, u.Student.StudentNumber)
                    : null,
                u.Staff != null && !u.Staff.IsDeleted ? new StaffMiniDto(u.Staff.Id, u.Staff.StaffNumber) : null,
                u.CreatedAtUtc,
                u.LastLoginAtUtc
            ))
            .FirstOrDefaultAsync();

        if (dto is null)
            throw new AppException(404, "USER_NOT_FOUND", "User does not exist.");

        return dto;
    }

    public async Task<AdminUserDetailDto> CreateAsync(AdminCreateUserDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        var exists = await db.Users.AnyAsync(u => u.Email == email);

        if (exists)
        {
            throw new AppException(409, "EMAIL_EXISTS", "Email already exists.");
        }

        if (dto.Role.HasValue && !Enum.IsDefined(dto.Role.Value))
        {
            throw new AppException(400, "INVALID_ROLE", "Invalid system role specified.");
        }

        var user = new User
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            IsActive = dto.IsActive,
            Permissions = 0
        };

        db.Users.Add(user);

        if (dto.Role.HasValue)
        {
            var userRole = new UserRole
            {
                UserId = user.Id,
                Role = dto.Role.Value
            };

            db.UserRoles.Add(userRole);
        }

        switch (dto.Role)
        {
            case SystemRole.Student:
                var student = new Student
                {
                    UserId = user.Id,
                    StudentNumber = await GenerateStudentNumber()
                };

                db.Students.Add(student);
                break;
            case SystemRole.Staff:
            case SystemRole.Admin:
                var staff = new Staff
                {
                    UserId = user.Id,
                    StaffNumber = await GenerateStaffNumber(),
                    Department = "Unassigned"
                };

                db.Staff.Add(staff);
                break;
        }

        await db.SaveChangesAsync();
        return await GetAsync(user.Id);
    }

    public async Task<AdminUserDetailDto> UpdateAsync(Guid userId, AdminUpdateUserDto dto)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

        if (user is null)
        {
            throw new AppException(404, "USER_NOT_FOUND", "User does not exist.");
        }

        user.FirstName = dto.FirstName.Trim();
        user.LastName = dto.LastName.Trim();

        await db.SaveChangesAsync();
        return await GetAsync(userId);
    }

    public async Task SetActiveAsync(Guid userId, bool isActive)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

        if (user is null)
        {
            throw new AppException(404, "USER_NOT_FOUND", "User does not exist.");
        }

        user.IsActive = isActive;
        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid userId)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return;

        user.IsDeleted = true;

        await db.SaveChangesAsync();
    }

    public async Task RecomputePermissionsAsync(Guid userId)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

        if (user is null)
        {
            throw new AppException(404, "USER_NOT_FOUND", "User does not exist.");
        }

        user.Permissions = (long)UserService.ComputePermissionsFromRoles(user);
        await db.SaveChangesAsync();
    }

    private async Task<string> GenerateStudentNumber()
    {
        var lastStudent = await db.Students
            .OrderByDescending(s => s.StudentNumber)
            .FirstOrDefaultAsync();

        if (lastStudent == null)
        {
            return "w1000001";
        }

        var lastNumber = int.Parse(lastStudent.StudentNumber[1..]);
        return $"w{lastNumber}";
    }

    private async Task<string> GenerateStaffNumber()
    {
        var lastStaff = await db.Staff
            .OrderByDescending(s => s.StaffNumber)
            .FirstOrDefaultAsync();

        if (lastStaff == null)
        {
            return "s1001";
        }

        var lastNumber = int.Parse(lastStaff.StaffNumber[1..]);
        return $"s{lastNumber}";
    }
}