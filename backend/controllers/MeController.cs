using backend.auth;
using backend.dtos;
using backend.responses;
using backend.services.interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.controllers;

[ApiController]
[Route("api/me")]
public class MeController(IEnrollmentService enrollments) : ControllerBase
{
    [HttpGet("dashboard")]
    [Authorize]
    public async Task<IActionResult> Dashboard()
    {
        var userId = User.GetUserIdOrThrow();
        var dto = await enrollments.GetStudentDashboardByUserIdAsync(userId);
        return Ok(ApiResponse<StudentDashboardDto>.Ok(dto));
    }
}