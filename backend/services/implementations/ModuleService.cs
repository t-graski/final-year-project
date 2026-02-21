using backend.auth;
using backend.data;
using backend.dtos;
using backend.errors;
using backend.helpers;
using backend.models;
using backend.models.enums;
using backend.services.interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.services.implementations;

public class ModuleService(AppDbContext db, ICurrentUser currentUser) : IModuleService
{
    public async Task<ModuleDto> GetByIdAsync(Guid moduleId)
    {
        var userId = currentUser.UserId ?? throw new AppException(401, "UNAUTHORIZED", "Authentication required.");

        var studentId = await db.Students
            .Where(s => s.UserId == userId && !s.IsDeleted)
            .Select(s => (Guid?)s.Id)
            .FirstOrDefaultAsync();

        var staffId = await db.Staff
            .Where(s => s.UserId == userId && !s.IsDeleted)
            .Select(s => (Guid?)s.Id)
            .FirstOrDefaultAsync();

        if (studentId is null && staffId is null)
        {
            throw new AppException(404, "STUDENT_OR_STAFF_PROFILE_NOT_FOUND",
                "No student or staff profile linked to this user.");
        }


        var canAccess =
            await db.StudentModuleEnrollments.AnyAsync(x =>
                x.ModuleId == moduleId && x.StudentId == studentId && !x.IsDeleted)
            || await db.ModuleStaff.AnyAsync(x => x.ModuleId == moduleId && x.StaffId == staffId && !x.IsDeleted);

        if (!canAccess)
        {
            throw new AppException(403, "FORBIDDEN", "You are not allowed to access this module.");
        }

        var module = await db.Modules
            .AsNoTracking()
            .Include(m => m.Course)
            .Include(m => m.Elements.Where(e => !e.IsDeleted))
            .Include(m => m.StudentEnrollments.Where(se => !se.IsDeleted))
            .ThenInclude(se => se.Student)
            .ThenInclude(se => se.User)
            .Include(m => m.TeachingStaff.Where(ts => !ts.IsDeleted))
            .ThenInclude(ts => ts.Staff)
            .ThenInclude(s => s.User)
            .Where(m => m.Id == moduleId && !m.IsDeleted)
            .FirstOrDefaultAsync();

        if (module is null)
        {
            throw new AppException(404, "MODULE_NOT_FOUND", "Module does not exist.");
        }

        var studentEnrollment = await db.StudentModuleEnrollments
            .AsNoTracking()
            .Where(x => x.ModuleId == moduleId && x.StudentId == studentId && !x.IsDeleted)
            .Select(x => new { x.AcademicYear, x.YearOfStudy, x.Semester })
            .FirstOrDefaultAsync();

        var academicYear = studentEnrollment?.AcademicYear ?? (module.AcademicYear ?? 0);
        var yearOfStudy = studentEnrollment?.YearOfStudy ?? (module.AcademicYear ?? 0);
        var semester = studentEnrollment?.Semester ?? (short)(module.SemesterOfStudy ?? 0);

        var students = module.StudentEnrollments
            .Select(se => se.Student)
            .Select(s => s.User)
            .Where(u => !u.IsDeleted)
            .Select(u => new ModuleMemberDto(u.Id, $"{u.FirstName} {u.LastName}", u.Email))
            .ToList();

        var staff = module.TeachingStaff
            .Select(ts => ts.Staff)
            .Select(s => s.User)
            .Where(u => !u.IsDeleted)
            .Select(u => new ModuleMemberDto(u.Id, $"{u.FirstName} {u.LastName}", u.Email))
            .ToList();

        var elements = module.Elements
            .OrderBy(e => e.SortOrder)
            .Select(e => new ModuleElementDto(
                e.Id,
                e.SortOrder,
                e.Type,
                e.IconKey,
                e.Options.RootElement.Clone(),
                e.AssessmentWeight,
                e.MarksPublished
            ))
            .ToList();

        return new ModuleDto(
            module.Id,
            module.CourseId,
            module.Course.CourseCode,
            module.Course.Title,
            module.ModuleCode,
            module.Title,
            module.Description,
            module.Credits,
            module.Level,
            academicYear,
            yearOfStudy,
            semester,
            module.IsCore,
            module.RunsFrom,
            module.RunsTo,
            module.ScheduledDay,
            module.ScheduledStartLocal,
            module.ScheduledEndLocal,
            students,
            staff,
            elements
        );
    }

    public async Task<ModuleElementDto> CreateElementAsync(Guid moduleId, CreateModuleElementDto dto)
    {
        await EnsureTeachingStaffAsync(moduleId);

        ValidateElementPayload(dto.Type, dto.AssessmentWeight);

        var nextOrder = await db.Modules
            .Where(m => m.Id == moduleId && !m.IsDeleted)
            .SelectMany(m => m.Elements)
            .Select(e => (int?)e.SortOrder)
            .MaxAsync();

        var element = new ModuleElement
        {
            ModuleId = moduleId,
            Type = dto.Type,
            SortOrder = (nextOrder ?? 0) + 1,
            IconKey = dto.IconKey,
            Options = JsonHelpers.ToDocument(dto.Options),
            AssessmentWeight = dto.Type == ModuleElementType.Assessment ? dto.AssessmentWeight : null,
            MarksPublished = false
        };

        if (dto.Type == ModuleElementType.Assessment)
        {
            await EnsureTotalAssessmentWeightWithinLimitAsync(moduleId, additionalWeight: dto.AssessmentWeight!.Value);
        }

        var module = await db.Modules
            .Where(m => m.Id == moduleId && !m.IsDeleted)
            .Include(m => m.Elements)
            .FirstOrDefaultAsync();

        if (module is not null)
        {
            module.Elements.Add(element);
            await db.SaveChangesAsync();
        }

        return ToDto(element);
    }

    public async Task<ModuleElementDto> UpdateElementAsync(Guid moduleId, Guid elementId, UpdateModuleElementDto dto)
    {
        await EnsureTeachingStaffAsync(moduleId);

        var element = await db.Modules
            .Where(m => m.Id == moduleId && !m.IsDeleted)
            .SelectMany(m => m.Elements)
            .Where(e => e.Id == elementId)
            .FirstOrDefaultAsync();

        if (element is null)
        {
            throw new AppException(404, "ELEMENT_NOT_FOUND", "Module element does not exist.");
        }

        ValidateElementPayload(element.Type, dto.AssessmentWeight);

        element.IconKey = dto.IconKey;
        element.Options = JsonHelpers.ToDocument(dto.Options);

        if (element.Type == ModuleElementType.Assessment)
        {
            var oldWeight = element.AssessmentWeight ?? 0;
            var newWeight = dto.AssessmentWeight!.Value;

            await EnsureTotalAssessmentWeightWithinLimitAsync(moduleId, newWeight - oldWeight);

            element.AssessmentWeight = newWeight;
        }
        else
        {
            element.AssessmentWeight = null;
            element.MarksPublished = false;
        }

        await db.SaveChangesAsync();
        return ToDto(element);
    }

    public async Task DeleteElementAsync(Guid moduleId, Guid elementId)
    {
        await EnsureTeachingStaffAsync(moduleId);

        var element = await db.Modules
            .Where(m => m.Id == moduleId && !m.IsDeleted)
            .SelectMany(m => m.Elements)
            .Where(e => e.Id == elementId)
            .FirstOrDefaultAsync();

        if (element is null)
        {
            return;
        }

        element.IsDeleted = true;
        await db.SaveChangesAsync();

        await CompactSortOrderAsync(moduleId);
    }

    public async Task ReorderElementsAsync(Guid moduleId, ReorderModuleElementsDto dto)
    {
        await EnsureTeachingStaffAsync(moduleId);

        if (dto.ElementIdsInOrder is null || dto.ElementIdsInOrder.Count == 0)
        {
            throw new AppException(400, "INVALID_ORDER", "ElementIdsOrder cannot be empty.");
        }

        var elements = await db.Modules
            .Where(m => m.Id == moduleId && !m.IsDeleted)
            .SelectMany(m => m.Elements)
            .ToListAsync();

        var existingIds = elements.Select(e => e.Id).ToHashSet();
        var providedIds = dto.ElementIdsInOrder.ToHashSet();

        if (!existingIds.SetEquals(providedIds))
        {
            throw new AppException(400, "ORDER_MISMATCH", "Order must include all existing element IDs exactly once.");
        }

        for (var i = 0; i < dto.ElementIdsInOrder.Count; i++)
        {
            var id = dto.ElementIdsInOrder[i];
            var element = elements.First(e => e.Id == id);
            element.SortOrder = i + 1;
        }

        await db.SaveChangesAsync();
    }

    private async Task EnsureTeachingStaffAsync(Guid moduleId)
    {
        var userId = currentUser.UserId ?? throw new AppException(401, "AUTHORIZED", "Authentication required.");

        var staffId = await db.Staff
            .Where(s => s.UserId == userId && !s.IsDeleted)
            .Select(s => (Guid?)s.Id)
            .FirstOrDefaultAsync();

        if (staffId is null)
        {
            throw new AppException(404, "STAFF_PROFILE_NOT_FOUND",
                "No staff profile linked to this user.");
        }

        var isStaff =
            await db.ModuleStaff.AnyAsync(ms => ms.ModuleId == moduleId && ms.StaffId == staffId && !ms.IsDeleted);

        if (!isStaff)
        {
            throw new AppException(403, "FORBIDDEN", "Only teaching staff can modify module content.");
        }
    }

    private static void ValidateElementPayload(ModuleElementType type, double? weight)
    {
        if (type == ModuleElementType.Assessment)
        {
            if (weight is null)
            {
                throw new AppException(400, "WEIGHT_REQUIRED", "Assessment weight is required.");
            }

            if (weight is < 0 or > 100)
            {
                throw new AppException(400, "INVALID_WEIGHT", "Assessment weight must be between 0 and 100.");
            }
        }
    }

    private async Task EnsureTotalAssessmentWeightWithinLimitAsync(Guid moduleId, double additionalWeight)
    {
        if (additionalWeight <= 0)
        {
            return;
        }

        var currentTotal = await db.Modules
            .Where(m => m.Id == moduleId && !m.IsDeleted)
            .SelectMany(m => m.Elements)
            .Where(e => e.Type == ModuleElementType.Assessment)
            .Select(e => (double)e.AssessmentWeight!)
            .SumAsync();

        if (currentTotal + additionalWeight > 100)
        {
            throw new AppException(400, "WEIGHT_TOTAL_EXCEEDED", "Total assessment weight must not exceed 100.");
        }
    }

    private async Task CompactSortOrderAsync(Guid moduleId)
    {
        var elements = await db.Modules
            .Where(m => m.Id == moduleId && !m.IsDeleted)
            .SelectMany(m => m.Elements)
            .OrderBy(e => e.SortOrder)
            .ToListAsync();

        for (var i = 0; i < elements.Count; i++)
        {
            elements[i].SortOrder = i + 1;
        }

        await db.SaveChangesAsync();
    }

    private static ModuleElementDto ToDto(ModuleElement e)
        => new ModuleElementDto(
            e.Id,
            e.SortOrder,
            e.Type,
            e.IconKey,
            e.Options.RootElement.Clone(),
            e.AssessmentWeight,
            e.MarksPublished
        );
}