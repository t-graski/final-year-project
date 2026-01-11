using backend.data;
using backend.dtos;
using backend.services.interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.services.implementations;

public class AuditService(AppDbContext db) : IAuditService
{
    public async Task<IReadOnlyList<AuditEventDto>> SearchAsync(Guid? actorUserId, string? entityType, string? entityId,
        string? action, DateTimeOffset? fromUtc,
        DateTimeOffset? toUtc, int limit, int offset)
    {
        limit = Math.Clamp(limit, 1, 200);
        offset = Math.Max(0, offset);

        var q = db.AuditEvents.AsNoTracking();

        if (actorUserId.HasValue) q = q.Where(x => x.ActorUserId == actorUserId);
        if (!string.IsNullOrWhiteSpace(entityType)) q = q.Where(x => x.EntityType == entityType);
        if (!string.IsNullOrWhiteSpace(entityId)) q = q.Where(x => x.EntityId == entityId);
        if (!string.IsNullOrWhiteSpace(action)) q = q.Where(x => x.Action == action);

        if (fromUtc.HasValue) q = q.Where(x => x.OccuredAtUtc >= fromUtc.Value);
        if (toUtc.HasValue) q = q.Where(x => x.OccuredAtUtc <= toUtc.Value);

        return await q
            .OrderByDescending(x => x.OccuredAtUtc)
            .Skip(offset)
            .Take(limit)
            .Select(x => new AuditEventDto(
                x.AuditEventId,
                x.OccuredAtUtc,
                x.ActorUserId,
                x.Action,
                x.EntityType,
                x.EntityId,
                x.Summary,
                x.ChangesJson,
                x.MetadataJson
            ))
            .ToListAsync();
    }
}