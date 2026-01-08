using backend.models.@base;

namespace backend.auth;

public static class RolePermissions
{
    public static Permission ForRole(SystemRole role) => role switch
    {
        SystemRole.Student => Permission.ViewStudents,
        SystemRole.Staff => Permission.ViewStudents,
        SystemRole.Admin => Permission.SuperAdmin | (Permission)long.MaxValue,
        _ => Permission.None
    };
}