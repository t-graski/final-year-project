using backend.responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace backend.middleware;

public class ValidationResponseFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.ModelState.IsValid)
        {
            var errors = context.ModelState
                .Where(x => x.Value!.Errors.Count > 0)
                .Select(x => $"{x.Key}: {x.Value!.Errors[0].ErrorMessage}")
                .ToList();

            context.Result = new BadRequestObjectResult(
                ApiResponse<object>.Fail(
                    StatusCodes.Status400BadRequest,
                    "VALIDATION_ERROR",
                    string.Join(" | ", errors)
                )
            );
        }
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
    }
}