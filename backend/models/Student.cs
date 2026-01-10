using backend.models.@base;

namespace backend.models;

public class Student : SoftDeletableEntity<Guid>
{
    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public string StudentNumber { get; set; } = string.Empty;

    public string Status { get; set; } = "active";
    public int? StartYear { get; set; }
    public int? StartMonth { get; set; }

    public ICollection<StudentCourseEnrollment> CourseEnrollments { get; set; } = [];
    public ICollection<StudentModuleEnrollment> ModuleEnrollments { get; set; } = [];
}