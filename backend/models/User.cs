using backend.models.@base;

namespace backend.models;

public class User : SoftDeletableEntity<Guid>
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
    public DateTimeOffset? EmailVerifiedAtUtc { get; set; }

    public DateTimeOffset? LastLoginAtUtc { get; set; }
    public int FailedLoginCount { get; set; }
    public DateTimeOffset? LockOutUntilUtc { get; set; }

    public ICollection<UserRole> Roles { get; set; } = new List<UserRole>();
    
    public Student? Student { get; set; }
    public Staff? Staff { get; set; }
}