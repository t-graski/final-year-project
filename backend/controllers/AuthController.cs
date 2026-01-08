using backend.dtos;
using backend.responses;
using backend.services.interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IUserService users) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
        => StatusCode(201, ApiResponse<AuthResultDto>.Ok(await users.RegisterAsync(dto), 201));

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
        => Ok(ApiResponse<AuthResultDto>.Ok(await users.LoginAsync(dto)));
}