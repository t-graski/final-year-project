namespace backend.models;

public class AuditEvent
{
    public long AuditEventId { get; set; }
    public DateTimeOffset OccuredAt { get; set; } = DateTimeOffset.UtcNow;

    public Guid? ActorUserId { get; set; }
    public string Action { get; set; } = null!;
    public string EntityType { get; set; } = null!;
    public string EntityId { get; set; } = null!;
}