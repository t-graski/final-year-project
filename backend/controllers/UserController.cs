using backend.auth;
using backend.dtos;
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
    public async Task<IActionResult> Me()
    {
        var meId = User.GetUserIdOrThrow();
        var dto = await users.GetMeAsync(meId);
        return Ok(ApiResponse<UserDetailDto>.Ok(dto));
    }
}