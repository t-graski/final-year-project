namespace backend.dtos;

public record CreateStudentDto(
    string StudentNumber,
    string FirstName,
    string LastName,
    Guid? UserId,
    int? StartYear,
    string Status
);

public record UpdateStudentDto(
    string FirstName,
    string LastName,
    int? StartYear,
    string Status
);

public record StudentDto(
    Guid Id,
    string StudentNumber,
    string FirstName,
    string LastName,
    Guid? UserId,
    int? StartYear,
    string Status
);