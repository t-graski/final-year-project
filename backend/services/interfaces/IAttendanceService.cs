using backend.dtos;

namespace backend.services.interfaces;

public interface IAttendanceService
{
    Task MarkStudentAttendanceOnLoginAsync(Guid userId, DateTimeOffset nowUtc);

    Task<MyAttendanceDto> GetMyAttendanceAsync(Guid meUserId, DateOnly from, DateOnly to);

    Task<PagedDto<AdminStudentAttendanceSummaryDto>> SearchStudentsAsync(AdminAttendanceSearchQueryDto q);
    Task<AdminStudentAttendanceDetailDto> GetStudentAttendanceAsync(Guid studentId, DateOnly from, DateOnly to);

    Task<AttendanceDayDto> UpsertStudentDayAsync(Guid studentId, UpsertAttendanceDto dto, Guid actorUserId);
    Task DeleteStudentDayAsync(Guid studentId, DateOnly date);
}