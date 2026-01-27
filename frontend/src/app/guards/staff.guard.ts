﻿import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {PermissionService, Permission} from '../services/permission.service';

export const staffGuard: CanActivateFn = () => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  // Staff can access if they have catalog read/write OR enrollment read/write permissions
  if (permissionService.hasAnyPermission(
    Permission.CatalogRead,
    Permission.CatalogWrite,
    Permission.EnrollmentRead,
    Permission.EnrollmentWrite,
    Permission.UserRead,
    Permission.SuperAdmin
  )) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
