using backend.models;
using Microsoft.EntityFrameworkCore;

namespace backend.data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<User>(e =>
        {
            e.ToTable("users");

            e.HasKey(x => x.Id);

            e.Property(x => x.Email)
                .IsRequired();

            e.HasIndex(x => x.Email)
                .IsUnique();
        });

        b.Entity<UserRole>(e =>
        {
            e.ToTable("user_roles");

            e.HasKey(x => x.Id);

            e.Property(x => x.Role)
                .HasConversion<short>()
                .IsRequired();

            e.HasOne(x => x.User)
                .WithMany(u => u.Roles)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => new { x.UserId, x.Role })
                .IsUnique();
        });
    }
}