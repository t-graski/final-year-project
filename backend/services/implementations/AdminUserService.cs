using backend.data;
using backend.dtos;
using backend.errors;
using backend.services.interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.services.implementations;

public sealed class AdminUserService(AppDbContext db) : IAdminUserService
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
                u.Staff != null && !u.Staff.IsDeleted ? new StaffMiniDto(u.Staff.Id, u.Staff.StaffNumber) : null,
                u.CreatedAtUtc,
                u.LastLoginAtUtc
            ))
            .ToListAsync();
    }

    public async Task<AdminUserListItemDto> GetAsync(Guid userId)
    {
        var dto = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId && !u.IsDeleted)
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
                u.Staff != null && !u.Staff.IsDeleted ? new StaffMiniDto(u.Staff.Id, u.Staff.StaffNumber) : null,
                u.CreatedAtUtc,
                u.LastLoginAtUtc
            ))
            .FirstOrDefaultAsync();

        if (dto is null)
            throw new AppException(404, "USER_NOT_FOUND", "User does not exist.");

        return dto;
    }

    public async Task DeleteAsync(Guid userId)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return;

        // No cascade: DB will throw if referenced. We let it throw and map it to 409.
        db.Users.Remove(user);
        await db.SaveChangesAsync();
    }
}