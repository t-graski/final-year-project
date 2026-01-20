using backend.auth;
using backend.data;
using backend.errors;
using backend.models;
using backend.models.@base;
using backend.services.interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.services.implementations;

public class BootstrapService(AppDbContext db) : IBootstrapService
{
    public async Task Boostrap()
    {
        var adminExists = await db.UserRoles.AnyAsync(r => r.Role == SystemRole.Admin);

        if (adminExists)
        {
            throw new AppException(409, "ADMIN_ALREADY_EXISTS", "An admin user already exists");
        }
        
        var hash = BCrypt.Net.BCrypt.HashPassword("Test123!?");

        var user = new User
        {
            Email = "admin@uni.com",
            FirstName = "admin",
            LastName = "admin",
            DateOfBirth = DateOnly.MinValue,
            PasswordHash = hash,
            IsActive = true,
            Permissions = (long)RolePermissions.ForRole(SystemRole.Admin)
        };

        db.Users.Add(user);

        var userRole = new UserRole
        {
            UserId = user.Id,
            Role = SystemRole.Admin
        };

        db.UserRoles.Add(userRole);

        var staff = new Staff
        {
            UserId = user.Id,
            StaffNumber = "a000001",
            Department = "unassigned"
        };

        db.Staff.Add(staff);

        await db.SaveChangesAsync();
    }
}