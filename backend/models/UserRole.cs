using backend.models.@base;

namespace backend.models;

public class UserRole : SoftDeletableEntity<Guid>
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public SystemRole Role { get; set; }
}