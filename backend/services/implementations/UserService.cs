using backend.auth;
using backend.data;
using backend.dtos;
using backend.errors;
using backend.models;
using backend.services.interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens.Experimental;

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
}