namespace backend.dtos;

public record AuditEventDto(
    Guid Id,
    DateTimeOffset OccurredAtUtc,
    Guid? ActorUserId,
    string Action,
    string EntityType,
    string EntityId,
    string? Summary,
    string? ChangesJson,
    string? MetadataJson
);