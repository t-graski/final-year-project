using backend.data;
using backend.dtos;
using backend.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql.TypeMapping;

namespace backend.controllers;

[ApiController]
[Route("api/users")]
public class UserController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetAll()
    {
        var users = await db.Users
            .OrderBy(u => u.Email)
            .Select(u => new UserDto(u.Id, u.Email, u.IsActive))
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create(CreateUserDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        var exists = await db.Users.AnyAsync(u => u.Email == email);
        if (exists)
        {
            return Conflict("Email already exists.");
        }

        var user = new User
        {
            Email = email,
            PasswordHash = dto.PasswordHash,
            IsActive = true
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = user.Id },
            new UserDto(user.Id, user.Email, user.IsActive));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDto>> GetById(Guid id)
    {
        var user = await db.Users
            .Where(u => u.Id == id)
            .Select(u => new UserDto(u.Id, u.Email, u.IsActive))
            .FirstOrDefaultAsync();

        return user is null ? NotFound() : Ok(user);
    }
}