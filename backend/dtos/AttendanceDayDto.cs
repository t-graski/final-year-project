namespace backend.dtos;

public record AttendanceDayDto(
    DateOnly Date,
    DateTimeOffset FirstSeenAtUtc,
    DateTimeOffset LastSeenAtUtc,
    int LoginCount,
    string? Note
);

public record MyAttendanceSummaryDto(
    Guid StudentId,
    int DaysPresent,
    int DaysAbsent,
    int TotalDays,
    DateOnly From,
    DateOnly To
);

public record MyAttendanceDto(
    MyAttendanceSummaryDto Summary,
    IReadOnlyList<AttendanceDayDto> Days
);

public record AdminStudentAttendanceSummaryDto(
    Guid StudentId,
    Guid UserId,
    string StudentNumber,
    string FirstName,
    string LastName,
    int DaysPresent,
    int TotalDays,
    double AttendanceRate
);

public record AdminStudentAttendanceDetailDto(
    Guid StudentId,
    Guid UserId,
    string StudentNumber,
    string FirstName,
    string LastName,
    DateOnly From,
    DateOnly To,
    int DaysPresent,
    int DaysAbsent,
    int TotalDays,
    IReadOnlyList<AttendanceDayDto> Days
);

public record UpsertAttendanceDto(
    DateOnly Date,
    bool Present,
    string? Note
);

public record UpdateAttendanceDto(
    DateTimeOffset? FirstSeenAtUtc,
    DateTimeOffset? LastSeenAtUtc,
    int? LoginCount,
    string? Note
);

public record AttendanceRangeQueryDto(
    DateOnly From,
    DateOnly To
);

public record AdminAttendanceSearchQueryDto(
    DateOnly From,
    DateOnly To,
    string? Search,
    int Page = 1,
    int PageSize = 20
);