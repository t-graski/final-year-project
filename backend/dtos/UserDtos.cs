using backend.models.@base;

namespace backend.dtos;

public record CreateUserDto(string Email, string PasswordHash);
public record UserDto(Guid Id, string Email, bool IsActive);

public record AssignRoleDto(SystemRole Role);