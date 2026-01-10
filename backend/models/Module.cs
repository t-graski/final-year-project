using backend.models.@base;

namespace backend.models;

public class Module : SoftDeletableEntity<Guid>
{
    public Guid CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public string ModuleCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; } = string.Empty;

    public int? Credits { get; set; }
    public int? Level { get; set; }
    public int? SemesterOfStudy { get; set; }
    public string? Term { get; set; }

    public ICollection<ModuleStaff> TeachingStaff { get; set; } = new List<ModuleStaff>();

    public ICollection<StudentModuleEnrollment> StudentEnrollments { get; set; } = [];
}