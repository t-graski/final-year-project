using backend.errors;
using backend.responses;

namespace backend.middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task Invoke(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (AppException ex)
        {
            context.Response.StatusCode = ex.StatusCode;
            context.Response.ContentType = "application/json";

            var response = ApiResponse<object>.Fail(
                ex.StatusCode,
                ex.ErrorCode,
                ex.Message
            );

            await context.Response.WriteAsJsonAsync(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";

            var response = ApiResponse<object>.Fail(
                StatusCodes.Status500InternalServerError,
                "INTERNAL_ERROR",
                "An unexpected error occured"
            );

            await context.Response.WriteAsJsonAsync(response);
        }
    }
}