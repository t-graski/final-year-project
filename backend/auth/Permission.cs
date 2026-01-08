namespace backend.auth;

[Flags]
public enum Permission : long
{
    None = 0,

    ViewUsers = 1L << 0,
    ManageUsers = 1L << 1,

    ViewStudents = 1L << 2,
    ManageStudents = 1L << 3,

    ViewCourses = 1L << 4,
    ManageCourses = 1L << 5,

    ViewAttendance = 1L << 6,
    ManageAttendance = 1L << 7,

    SuperAdmin = 1L << 60
}