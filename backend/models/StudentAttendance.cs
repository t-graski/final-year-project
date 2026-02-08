using backend.models.@base;

namespace backend.models;

public class StudentAttendance : AuditableEntity<Guid>
{
    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null;

    public DateOnly Date { get; set; }

    public DateTimeOffset FirstSeenAtUtc { get; set; }
    public DateTimeOffset LastSeenAtUtc { get; set; }
    public int LoginCount { get; set; }
    public string? Note { get; set; } = string.Empty;
}