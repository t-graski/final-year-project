using backend.auth;
using backend.data;
using backend.dtos;
using backend.errors;
using backend.models;
using backend.models.@base;
using backend.services.interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.services.implementations;

public class UserService(AppDbContext db, ITokenService tokens, ICurrentUser currentUser) : IUserService
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

        var user = await db.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == email);
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

    public async Task AssignRoleAsync(Guid userId, SystemRole role)
    {
        var actorId = currentUser.UserId
                      ?? throw new AppException(401, "UNAUTHORIZED", "Authentication required.");

        var actor = await db.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == actorId);

        if (actor is null)
        {
            throw new AppException(401, "ACTOR_NOT_FOUND", "Authentication user not found.");
        }

        var target = await db.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (target is null)
        {
            throw new AppException(404, "USER_NOT_FOUND", "Target user does not exist.");
        }

        var actorHighest = GetHighestActiveRole(actor);
        var targetHighest = GetHighestActiveRole(target);

        var actorHighestRank = actorHighest is null ? 0 : RoleHierarchy.Rank(actorHighest.Value);
        var targetHighestRank = targetHighest is null ? 0 : RoleHierarchy.Rank(targetHighest.Value);
        var newRoleRank = RoleHierarchy.Rank(role);

        var actorIsAdmin = actorHighest == SystemRole.Admin;

        // Rule #1: cannot modify someone higher than self
        if (targetHighestRank > actorHighestRank)
        {
            throw new AppException(403, "ROLE_TARGET_HIGHER",
                "You cannot modify a user with a higher role than yours.");
        }

        // Rule #2: cannot assign role higher than own highest role
        if (newRoleRank > actorHighestRank)
        {
            throw new AppException(403, "ROLE_ASSIGN_HIGHER_THAN_SELF",
                "You cannot assign a role higher than your own.");
        }

        // Rule #3: self can't give self a higher role
        if (actorId == userId && newRoleRank > actorHighestRank)
        {
            throw new AppException(403, "ROLE_SELF_PROMOTION", "You cannot assign yourself a higher role.");
        }

        // Rule #4: only admins can give same-level role
        if (newRoleRank == actorHighestRank && !actorIsAdmin)
        {
            throw new AppException(403, "ROLE_SAME_LEVEL_ADMIN_ONLY",
                "Only admins can assign a role at their own level.");
        }

        // Rule #5: admins can give other users admin
        if (role == SystemRole.Admin && !actorIsAdmin)
        {
            throw new AppException(403, "ROLE_ADMIN_REQUIRED", "Only admins can assign the admin role.");
        }

        var active = target.Roles.FirstOrDefault(r => r.Role == role && !r.IsDeleted);
        if (active is not null)
        {
            return;
        }

        var deleted = target.Roles.FirstOrDefault(r => r.Role == role && r.IsDeleted);

        if (deleted is not null)
        {
            deleted.IsDeleted = false;
            deleted.DeletedAtUtc = null;
            deleted.DeletedByUserId = null;
        }
        else
        {
            target.Roles.Add(new UserRole { UserId = userId, Role = role });
        }

        target.Permissions = (long)ComputePermissionsFromRoles(target);

        await db.SaveChangesAsync();
    }

    public async Task RemoveRoleAsync(Guid userId, SystemRole role)
    {
        var actorId = currentUser.UserId
                      ?? throw new AppException(401, "UNAUTHORIZED", "Authentication required.");

        var actor = await db.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == actorId);

        if (actor is null)
        {
            throw new AppException(401, "ACTOR_NOT_FOUND", "Authentication user not found.");
        }

        var target = await db.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (target is null)
        {
            throw new AppException(404, "USER_NOT_FOUND", "Target user does not exist.");
        }

        var actorHighest = GetHighestActiveRole(actor);
        var targetHighest = GetHighestActiveRole(target);

        var actorHighestRank = actorHighest is null ? 0 : RoleHierarchy.Rank(actorHighest.Value);
        var targetHighestRank = targetHighest is null ? 0 : RoleHierarchy.Rank(targetHighest.Value);
        var newRoleRank = RoleHierarchy.Rank(role);

        var actorIsAdmin = actorHighest == SystemRole.Admin;

        // Rule #1: cannot modify someone higher than self
        if (targetHighestRank > actorHighestRank)
        {
            throw new AppException(403, "ROLE_TARGET_HIGHER",
                "You cannot modify a user with a higher role than yours.");
        }

        // Rule #2: cannot assign role higher than own highest role
        if (newRoleRank > actorHighestRank)
        {
            throw new AppException(403, "ROLE_REMOVE_HIGHER_THAN_SELF",
                "You cannot remove a role higher than your own.");
        }

        // Rule #3: self can't remove self the highest role
        if (actorId == userId && role == actorHighest)
        {
            throw new AppException(403, "ROLE_SELF_LOCKOUT", "You cannot remove your own highest role.");
        }

        if (role == SystemRole.Admin && !actorIsAdmin)
        {
            throw new AppException(403, "ROLE_ADMIN_REQUIRED", "Only admins can remove the admin role.");
        }

        if (role == SystemRole.Admin)
        {
            var adminCount = await db.UserRoles
                .Where(r => !r.IsDeleted && r.Role == SystemRole.Admin)
                .Select(r => r.UserId)
                .Distinct()
                .CountAsync();

            var targetIsAdmin = target.Roles.Any(r => r is { IsDeleted: false, Role: SystemRole.Admin });

            if (targetIsAdmin && adminCount <= 1)
            {
                throw new AppException(403, "ROLE_LAST_ADMIN", "You cannot remove the last admin.");
            }
        }

        var active = target.Roles.FirstOrDefault(r => r.Role == role && !r.IsDeleted);
        if (active is null)
        {
            return;
        }

        active.IsDeleted = true;

        target.Permissions = (long)ComputePermissionsFromRoles(target);

        await db.SaveChangesAsync();
    }

    private static SystemRole? GetHighestActiveRole(User user)
    {
        var roles = user.Roles.Where(r => !r.IsDeleted).Select(r => r.Role);
        SystemRole? best = null;
        var bestRank = 0;

        foreach (var role in roles)
        {
            var rank = RoleHierarchy.Rank(role);
            if (rank > bestRank)
            {
                bestRank = rank;
                best = role;
            }
        }

        return best;
    }

    private static Permission ComputePermissionsFromRoles(User user)
    {
        var perms = Permission.None;

        foreach (var r in user.Roles.Where(x => !x.IsDeleted))
        {
            perms |= RolePermissions.ForRole(r.Role);
        }

        if (perms.HasFlag(Permission.SuperAdmin))
        {
            return (Permission)long.MaxValue;
        }

        return perms;
    }
}