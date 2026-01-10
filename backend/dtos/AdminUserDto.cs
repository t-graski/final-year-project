namespace backend.dtos;

public record AdminUserListItemDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    bool IsActive,
    long Permissions,
    IReadOnlyList<short> Roles,
    StudentMiniDto? Student,
    StaffMiniDto? Staff,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? LastLoginAtUtc
);

public record StudentMiniDto(Guid Id, string StudentNumber);

public record StaffMiniDto(Guid Id, string StaffNumber);