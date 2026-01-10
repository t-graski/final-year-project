using backend.auth;
using backend.dtos;
using backend.responses;
using backend.services.interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.controllers;

[ApiController]
[Route("api/admin/users")]
public class AdminUserController(IAdminUserService users) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AdminUserListItemDto>>), StatusCodes.Status200OK)]
    [Authorize]
    [RequirePermission(Permission.ManageUsers)]
    public async Task<IActionResult> List([FromQuery] string? q = null, [FromQuery] int limit = 50,
        [FromQuery] int offset = 0) =>
        Ok(ApiResponse<IReadOnlyList<AdminUserListItemDto>>.Ok(await users.ListAsync(q, limit, offset)));

    [HttpGet("{userId:guid}")]
    [Authorize]
    [RequirePermission(Permission.ManageUsers)]
    [ProducesResponseType(typeof(ApiResponse<AdminUserListItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(Guid userId)
        => Ok(ApiResponse<AdminUserListItemDto>.Ok(await users.GetAsync(userId)));

    [HttpDelete("{userId:guid}")]
    [Authorize]
    [RequirePermission((Permission.ManageUsers))]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(Guid userId)
    {
        await users.DeleteAsync(userId);
        return Ok(ApiResponse<object>.Ok(new { }));
    }
}