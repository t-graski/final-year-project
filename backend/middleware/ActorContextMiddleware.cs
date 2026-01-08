using backend.data;

namespace backend.middleware;

public class ActorContextMiddleware(RequestDelegate next)
{
    public async Task Invoke(HttpContext context, AppDbContext db)
    {
        if (context.Request.Headers.TryGetValue("X-Actor-USerId", out var raw) &&
            Guid.TryParse(raw.ToString(), out var actorId))
        {
            db.ActorUserId = actorId;
        }

        await next(context);
    }
}