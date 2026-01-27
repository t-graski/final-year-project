import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {PermissionService} from '../services/permission.service';
import {UserService} from '../services/user.service';

export const adminGuard: CanActivateFn = () => {
  const permissionService = inject(PermissionService);
  const userService = inject(UserService);
  const router = inject(Router);

  const user = userService.getCurrentUser();
  const hasAdminRole = user?.roles?.some(role => role.key?.toLowerCase() === 'admin') || false;

  if (hasAdminRole || permissionService.isSuperAdmin()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};

