using backend.auth;
using backend.dtos;
using backend.models.@base;
using backend.responses;
using backend.services.interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.controllers;

[ApiController]
[Route("api/users")]
public class UserController(IUserService users) : ControllerBase
{
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserDetailDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Me()
    {
        var meId = User.GetUserIdOrThrow();
        var dto = await users.GetMeAsync(meId);
        return Ok(ApiResponse<UserDetailDto>.Ok(dto));
    }

    [HttpGet]
    [Authorize]
    [RequirePermission(Permission.ViewUsers)]
    [ProducesResponseType(typeof(ApiResponse<UserSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        var result = await users.GetUsersAsync(page, pageSize);
        return Ok(ApiResponse<PagedDto<UserSummaryDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    [RequirePermission(Permission.ViewUsers)]
    [ProducesResponseType(typeof(ApiResponse<UserDetailDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(Guid id)
    {
        var dto = await users.GetByIdAsync(id);
        return Ok(ApiResponse<UserDetailDto>.Ok(dto));
    }

    [HttpPost]
    [Authorize]
    [RequirePermission(Permission.ManageUsers)]
    [ProducesResponseType(typeof(ApiResponse<UserDetailDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(CreateUserDto dto)
    {
        var created = await users.CreateAsync(dto);
        return StatusCode(201, ApiResponse<UserDetailDto>.Ok(created, 201));
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize]
    [RequirePermission(Permission.ManageUsers)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SetStatus(Guid id, SetUserStatusDto dto)
    {
        await users.SetStatusAsync(id, dto.IsActive);
        return Ok(ApiResponse<object>.Ok(new { }));
    }

    [HttpPost("{id:guid}/roles")]
    [Authorize]
    [RequirePermission(Permission.ManageUsers)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AssignRole(Guid id, AssignRoleDto dto)
    {
        await users.AssignRoleAsync(id, dto.Role);
        return Ok(ApiResponse<object>.Ok(new { }));
    }

    [HttpPost("{id:guid}/roles/{role}")]
    [Authorize]
    [RequirePermission(Permission.ManageUsers)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RemoveRole(Guid id, string role)
    {
        if (!Enum.TryParse<SystemRole>(role, ignoreCase: true, out var parsed))
        {
            return BadRequest(ApiResponse<object>.Fail(400, "INVALID_ROLE", "Role value is invalid"));
        }

        await users.RemoveRoleAsync(id, parsed);
        return Ok(ApiResponse<object>.Ok(new { }));
    }
}