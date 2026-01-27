import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';

export const adminGuard: CanActivateFn = () => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  if (permissionService.$canAccessAdminDashboard()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};

