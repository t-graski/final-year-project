using backend.models.enums;

namespace backend.dtos;

public record StudentListItemDto(
    Guid StudentId,
    Guid UserId,
    string Email,
    string FirstName,
    string LastName,
    string StudentNumber
);

public record CourseEnrollmentRowDto(
    StudentListItemDto Student,
    Guid CourseEnrollmentId,
    CourseEnrollmentStatus Status,
    int AcademicYear,
    int YearOfStudy,
    short Semester,
    DateTimeOffset StartDateUtc,
    DateTimeOffset? EndDateUtc
);

public record ModuleEnrollmentRowDto(
    StudentListItemDto Student,
    Guid ModuleEnrollmentId,
    ModuleEnrollmentStatus Status,
    int AcademicYear,
    int YearOfStudy,
    short Semester,
    DateTimeOffset EnrolledAtUtc,
    DateTimeOffset? CompletedAtUtc
);

public record StudentCourseHistoryRowDto(
    Guid EnrollmentId,
    Guid CourseId,
    string CourseCode,
    string Title,
    CourseEnrollmentStatus Status,
    int AcademicYear,
    int YearOfStudy,
    short Semester,
    DateTimeOffset StartDateUtc,
    DateTimeOffset? EndDateUtc
);

public record StudentModuleHistoryRowDto(
    Guid EnrollmentId,
    Guid ModuleId,
    string ModuleCode,
    string Title,
    ModuleEnrollmentStatus Status,
    int AcademicYear,
    int YearOfStudy,
    short Semester,
    DateTimeOffset EnrolledAtUtc,
    DateTimeOffset? CompletedAtUtc
);

public record StudentEnrollmentHistoryDto(
    Guid StudentId,
    Guid UserId,
    string Email,
    string FirstName,
    string LastName,
    string StudentNumber,
    IReadOnlyList<StudentCourseHistoryRowDto> Courses,
    IReadOnlyList<StudentModuleHistoryRowDto> Modules
);