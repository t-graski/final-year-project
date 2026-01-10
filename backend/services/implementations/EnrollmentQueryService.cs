using backend.data;
using backend.dtos;
using backend.errors;
using backend.services.interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.services.implementations;

public class EnrollmentQueryService(AppDbContext db) : IEnrollmentQueryService
{
    public async Task<IReadOnlyList<CourseEnrollmentRowDto>> GetStudentsByCourseAsync(Guid courseId)
    {
        var courseExists = await db.Courses.AnyAsync(c => c.Id == courseId && !c.IsDeleted);

        if (!courseExists)
        {
            throw new AppException(404, "COURSE_NOT_FOUND", "Course does not exist.");
        }

        return await db.StudentCourseEnrollments.AsNoTracking()
            .Where(e => e.CourseId == courseId && !e.IsDeleted)
            .OrderByDescending(e => e.AcademicYear)
            .ThenByDescending(e => e.Semester)
            .ThenBy(e => e.Student.StudentNumber)
            .Select(e => new CourseEnrollmentRowDto(
                new StudentListItemDto(
                    e.Student.Id,
                    e.Student.User.Id,
                    e.Student.User.Email,
                    e.Student.User.FirstName,
                    e.Student.User.LastName,
                    e.Student.StudentNumber
                ),
                e.Id,
                e.Status,
                e.AcademicYear,
                e.YearOfStudy,
                e.Semester,
                e.StartDateUtc,
                e.EndDateUtc
            ))
            .ToListAsync();
    }

    public async Task<IReadOnlyList<ModuleEnrollmentRowDto>> GetStudentsByModuleAsync(Guid moduleId)
    {
        var moduleExists = await db.Modules.AnyAsync(m => m.Id == moduleId && !m.IsDeleted);

        if (!moduleExists)
        {
            throw new AppException(404, "MODULE_NOT_FOUND", "Module does not exist.");
        }

        return await db.StudentModuleEnrollments.AsNoTracking()
            .Where(e => e.ModuleId == moduleId && !e.IsDeleted)
            .OrderByDescending(e => e.AcademicYear)
            .ThenByDescending(e => e.Semester)
            .ThenBy(e => e.Student.StudentNumber)
            .Select(e => new ModuleEnrollmentRowDto(
                new StudentListItemDto(
                    e.Student.Id,
                    e.Student.User.Id,
                    e.Student.User.Email,
                    e.Student.User.FirstName,
                    e.Student.User.LastName,
                    e.Student.StudentNumber
                ),
                e.Id,
                e.Status,
                e.AcademicYear,
                e.YearOfStudy,
                e.Semester,
                e.EnrolledAtUtc,
                e.CompletedAtUtc
            ))
            .ToListAsync();
    }

    public async Task<StudentEnrollmentHistoryDto> GetStudentEnrollmentHistoryAsync(Guid studentId)
    {
        var student = await db.Students.AsNoTracking()
            .Where(s => s.Id == studentId && !s.IsDeleted)
            .Select(s => new
            {
                s.Id,
                s.StudentNumber,
                User = new { s.User.Id, s.User.Email, s.User.FirstName, s.User.LastName }
            })
            .FirstOrDefaultAsync();

        if (student is null)
        {
            throw new AppException(404, "STUDENT_NOT_FOUND", "Student does not exist.");
        }

        var courses = await db.StudentCourseEnrollments.AsNoTracking()
            .Where(e => e.StudentId == studentId && !e.IsDeleted)
            .OrderByDescending(e => e.AcademicYear)
            .ThenByDescending(e => e.Semester)
            .Select(e => new StudentCourseHistoryRowDto(
                e.Id,
                e.CourseId,
                e.Course.CourseCode,
                e.Course.Title,
                e.Status,
                e.AcademicYear,
                e.YearOfStudy,
                e.Semester,
                e.StartDateUtc,
                e.EndDateUtc
            ))
            .ToListAsync();

        var modules = await db.StudentModuleEnrollments.AsNoTracking()
            .Where(e => e.StudentId == studentId && !e.IsDeleted)
            .OrderByDescending(e => e.AcademicYear)
            .ThenByDescending(e => e.Semester)
            .Select(e => new StudentModuleHistoryRowDto(
                e.Id,
                e.ModuleId,
                e.Module.ModuleCode,
                e.Module.Title,
                e.Status,
                e.AcademicYear,
                e.YearOfStudy,
                e.Semester,
                e.EnrolledAtUtc,
                e.CompletedAtUtc
            ))
            .ToListAsync();

        return new StudentEnrollmentHistoryDto(
            student.Id,
            student.User.Id,
            student.User.Email,
            student.User.FirstName,
            student.User.LastName,
            student.StudentNumber,
            courses,
            modules
        );
    }
}