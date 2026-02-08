using backend.data;
using backend.dtos;
using backend.errors;
using backend.models;
using backend.services.interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.services.implementations;

public class AttendanceService(AppDbContext db) : IAttendanceService
{
    public async Task MarkStudentAttendanceOnLoginAsync(Guid userId, DateTimeOffset nowUtc)
    {
        var studentId = await db.Students
            .Where(s => s.UserId == userId && !s.IsDeleted)
            .Select(s => (Guid?)s.Id)
            .FirstOrDefaultAsync();

        if (studentId is null)
        {
            return;
        }

        var today = DateOnly.FromDateTime(nowUtc.UtcDateTime);

        var attendance = await db.StudentAttendances
            .FirstOrDefaultAsync(a => a.StudentId == studentId && a.Date == today);

        if (attendance is null)
        {
            db.StudentAttendances.Add(new StudentAttendance
            {
                StudentId = studentId.Value,
                Date = today,
                FirstSeenAtUtc = nowUtc,
                LastSeenAtUtc = nowUtc,
                LoginCount = 1
            });
        }
        else
        {
            attendance.LastSeenAtUtc = nowUtc;
            attendance.LoginCount += 1;
        }
    }

    public async Task<MyAttendanceDto> GetMyAttendanceAsync(Guid meUserId, DateOnly from, DateOnly to)
    {
        var student = await db.Students
            .Include(s => s.User)
            .Where(s => s.UserId == meUserId && !s.IsDeleted)
            .Select(s => new { s.Id, s.UserId })
            .FirstOrDefaultAsync();

        if (student is null)
        {
            throw new AppException(404, "STUDENT_PROFILE_NOT_FOUND", "No student profile linked to this user.");
        }

        var days = await db.StudentAttendances
            .Where(a => a.StudentId == student.Id && a.Date >= from && a.Date <= to)
            .OrderBy(a => a.Date)
            .Select(a => new AttendanceDayDto(
                a.Date,
                a.FirstSeenAtUtc,
                a.LastSeenAtUtc,
                a.LoginCount,
                a.Note
            ))
            .ToListAsync();

        var totalDays = CountDaysInclusive(from, to);
        var daysPresent = days.Count;
        var daysAbsent = totalDays - daysPresent;

        return new MyAttendanceDto(
            new MyAttendanceSummaryDto(student.Id, daysPresent, daysAbsent, totalDays, from, to),
            days
        );
    }

    public async Task<PagedDto<AdminStudentAttendanceSummaryDto>> SearchStudentsAsync(AdminAttendanceSearchQueryDto q)
    {
        var from = q.From;
        var to = q.To;
        var totalDays = CountDaysInclusive(from, to);

        var studentsQuery =
            from s in db.Students
            join u in db.Users on s.UserId equals u.Id
            where !s.IsDeleted && !u.IsDeleted
            select new { Student = s, User = u };

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var search = q.Search.Trim().ToLowerInvariant();
            studentsQuery = studentsQuery.Where(x =>
                x.Student.StudentNumber.ToLower().Contains(search) ||
                x.User.FirstName.ToLower().Contains(search) ||
                x.User.LastName.ToLower().Contains(search) ||
                x.User.Email.ToLower().Contains(search));
        }

        var attendanceInRange =
            db.StudentAttendances.Where(a => a.Date >= from && a.Date <= to);

        var query =
            from su in studentsQuery
            join a in attendanceInRange on su.Student.Id equals a.StudentId into att
            select new
            {
                su.Student.Id,
                su.Student.UserId,
                su.Student.StudentNumber,
                su.User.FirstName,
                su.User.LastName,
                DaysPresent = att.Count()
            };

        var total = await query.CountAsync();

        var page = Math.Max(1, q.Page);
        var pageSize = Math.Clamp(q.PageSize, 1, 200);

        var items = await query
            .OrderBy(x => x.LastName).ThenBy(x => x.FirstName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AdminStudentAttendanceSummaryDto(
                x.Id,
                x.UserId,
                x.StudentNumber,
                x.FirstName,
                x.LastName,
                x.DaysPresent,
                totalDays,
                totalDays == 0 ? 0 : (double)x.DaysPresent / totalDays
            ))
            .ToListAsync<AdminStudentAttendanceSummaryDto>();

        return new PagedDto<AdminStudentAttendanceSummaryDto>(items, page, pageSize, total);
    }

    public async Task<AdminStudentAttendanceDetailDto> GetStudentAttendanceAsync(Guid studentId, DateOnly from,
        DateOnly to)
    {
    }

    public async Task<AttendanceDayDto> UpsertStudentDayAsync(Guid studentId, UpsertAttendanceDto dto, Guid actorUserId)
    {
    }

    public async Task DeleteStudentDayAsync(Guid studentId, DateOnly date)
    {
    }

    private static int CountDaysInclusive(DateOnly from, DateOnly to)
    {
        if (to < from) return 0;
        return to.DayNumber - from.DayNumber + 1;
    }
}