import { Pipe, PipeTransform, inject } from '@angular/core';
import { PermissionService, Permission } from '../../services/permission.service';

/**
 * Pipe to check permissions in templates
 *
 * Usage:
 * - Single permission: Permission.UserWrite | hasPermission
 * - Multiple permissions (any): [Permission.UserWrite, Permission.UserDelete] | hasPermission
 * - All permissions required: [Permission.UserWrite, Permission.UserDelete] | hasPermission:'all'
 */
@Pipe({
  name: 'hasPermission',
  standalone: true,
  pure: false // Make it impure so it reacts to permission changes
})
export class HasPermissionPipe implements PipeTransform {
  private readonly permissionService = inject(PermissionService);

  transform(permission: Permission | Permission[], mode: 'any' | 'all' = 'any'): boolean {
    if (!permission) return true;

    const permissions = Array.isArray(permission) ? permission : [permission];

    if (permissions.length === 0) return true;

    if (mode === 'all') {
      return this.permissionService.hasAllPermissions(...permissions);
    } else {
      return this.permissionService.hasAnyPermission(...permissions);
    }
  }
}
