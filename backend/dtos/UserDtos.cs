using backend.models.@base;

namespace backend.dtos;

public record UserSummaryDto(
    Guid Id,
    string Email,
    bool IsActive,
    long Permissions,
    DateTimeOffset? LastLoginAt
);

public record UserDetailDto(
    Guid Id,
    string Email,
    bool IsActive,
    long Permissions,
    DateTimeOffset? CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc,
    IEnumerable<SystemRole> Roles
);

public record CreateUserDto(string Email, string Password);

public record SetUserStatusDto(bool IsActive);

public record SetUserPermissionsDto(long Permissions);

public record AssignRoleDto(SystemRole Role);