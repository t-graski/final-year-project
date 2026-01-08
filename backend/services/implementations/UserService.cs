using backend.auth;
using backend.data;
using backend.dtos;
using backend.errors;
using backend.models;
using backend.models.@base;
using backend.services.interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.services.implementations;

public class UserService(AppDbContext db, ITokenService tokens) : IUserService
{
    public async Task<AuthResultDto> RegisterAsync(RegisterDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        var exists = await db.Users.AnyAsync(u => u.Email == email);
        if (exists)
        {
            throw new AppException(409, "EMAIL_EXISTS", "Email already exists.");
        }

        var hash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        var user = new User
        {
            Email = email,
            PasswordHash = hash,
            IsActive = true,
            Permissions = (long)Permission.None
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        var token = tokens.CreateAccessToken(user);
        return new AuthResultDto(user.Id, user.Email, user.Permissions, token);
    }

    public async Task<AuthResultDto> LoginAsync(LoginDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null)
        {
            throw new AppException(401, "INVALID_CREDENTIALS", "Invalid email or password.");
        }

        if (!user.IsActive)
        {
            throw new AppException(403, "USER_DISABLED", "User is disabled.");
        }

        if (user.LockOutUntilUtc.HasValue && user.LockOutUntilUtc.Value > DateTimeOffset.UtcNow)
        {
            throw new AppException(403, "LOCKED_OUT", "User is temporarily locked out.");
        }

        var ok = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);

        if (!ok)
        {
            user.FailedLoginCount += 1;

            if (user.FailedLoginCount >= 5)
            {
                user.LockOutUntilUtc = DateTimeOffset.UtcNow.AddMinutes(10);
                user.FailedLoginCount = 0;
            }

            await db.SaveChangesAsync();
            throw new AppException(401, "INVALID_CREDENTIALS", "Invalid email or password");
        }

        user.FailedLoginCount = 0;
        user.LockOutUntilUtc = null;
        user.LastLoginAtUtc = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();

        var token = tokens.CreateAccessToken(user);
        return new AuthResultDto(user.Id, user.Email, user.Permissions, token);
    }

    public async Task<UserDetailDto> GetMeAsync(Guid meId)
        => await GetByIdAsync(meId);

    public async Task<PagedDto<UserSummaryDto>> GetUsersAsync(int page, int pageSize)
    {
        page = page <= 0 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 25 : pageSize;

        var query = db.Users.AsNoTracking();
        var total = await query.LongCountAsync();

        var items = await query
            .OrderBy(u => u.Email)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserSummaryDto(
                u.Id,
                u.Email,
                u.IsActive,
                u.Permissions,
                u.LastLoginAtUtc
            ))
            .ToListAsync();

        return new PagedDto<UserSummaryDto>(items, page, pageSize, total);
    }

    public async Task<UserDetailDto> GetByIdAsync(Guid userId)
    {
        var user = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.IsActive,
                u.Permissions,
                u.CreatedAtUtc,
                u.UpdatedAtUtc,
                Roles = u.Roles.Where(r => !r.IsDeleted).Select(r => r.Role).ToList()
            })
            .FirstOrDefaultAsync();

        if (user is null)
        {
            throw new AppException(404, "USER_NOT_FOUND", "User does not exist.");
        }

        return new UserDetailDto(
            user.Id,
            user.Email,
            user.IsActive,
            user.Permissions,
            user.CreatedAtUtc,
            user.UpdatedAtUtc,
            user.Roles
        );
    }

    public Task<UserDetailDto> CreateAsync(CreateUserDto dto)
    {
        throw new NotImplementedException();
    }

    public async Task SetStatusAsync(Guid userId, bool isActive)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
        {
            throw new AppException(404, "USER_NOT_FOUND", "User does not exist.");
        }

        user.IsActive = isActive;
        await db.SaveChangesAsync();
    }

    public async Task SetPermissionsAsync(Guid userId, long permissions)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
        {
            throw new AppException(404, "USER_NOT_FOUND", "User does not exist.");
        }

        user.Permissions = permissions;
        await db.SaveChangesAsync();
    }

    public Task AssignRoleAsync(Guid userId, SystemRole role)
    {
        throw new NotImplementedException();
    }

    public Task RemoveRoleAsync(Guid userId, SystemRole role)
    {
        throw new NotImplementedException();
    }
}