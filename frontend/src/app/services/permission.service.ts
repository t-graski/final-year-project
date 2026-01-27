import {Injectable, inject, computed} from '@angular/core';
import {UserService} from './user.service';

/**
 * Permission flags matching the backend Permission enum
 */
export enum Permission {
  None = 0,

  // Catalog permissions
  CatalogRead = 1 << 10,
  CatalogWrite = 1 << 11,
  CatalogDelete = 1 << 12,

  // Enrollment permissions
  EnrollmentRead = 1 << 13,
  EnrollmentWrite = 1 << 14,
  EnrollmentApprove = 1 << 15,
  EnrollmentDelete = 1 << 16,

  // Audit permissions
  AuditRead = 1 << 17,

  // User management permissions
  UserRead = 1 << 18,
  UserWrite = 1 << 19,
  UserDelete = 1 << 20,
  UserManageRoles = 1 << 21,

  // System permissions
  SystemBootstrap = 1 << 22,

  SuperAdmin = 1 << 31
}

@Injectable({providedIn: 'root'})
export class PermissionService {
  private readonly userService = inject(UserService);

  hasPermission(permission: Permission): boolean {
    const user = this.userService.getCurrentUser();
    if (!user || !user.permissions) {
      return false;
    }

    // SuperAdmin has all permissions
    if (this.isSuperAdmin()) {
      return true;
    }

    return (user.permissions & permission) === permission;
  }

  hasAnyPermission(...permissions: Permission[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  hasAllPermissions(...permissions: Permission[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  isSuperAdmin(): boolean {
    const user = this.userService.getCurrentUser();
    if (!user || user.permissions === undefined || user.permissions === null) {
      return false;
    }

    // Check SuperAdmin bit directly to avoid circular dependency with hasPermission()
    return (user.permissions & Permission.SuperAdmin) === Permission.SuperAdmin;
  }

  getUserPermissions(): number {
    const user = this.userService.getCurrentUser();
    return user?.permissions ?? 0;
  }

  $canReadCatalog = computed(() => this.hasPermission(Permission.CatalogRead));
  $canWriteCatalog = computed(() => this.hasPermission(Permission.CatalogWrite));
  $canDeleteCatalog = computed(() => this.hasPermission(Permission.CatalogDelete));

  $canReadEnrollment = computed(() => this.hasPermission(Permission.EnrollmentRead));
  $canWriteEnrollment = computed(() => this.hasPermission(Permission.EnrollmentWrite));
  $canApproveEnrollment = computed(() => this.hasPermission(Permission.EnrollmentApprove));
  $canDeleteEnrollment = computed(() => this.hasPermission(Permission.EnrollmentDelete));

  $canReadAudit = computed(() => this.hasPermission(Permission.AuditRead));

  $canReadUser = computed(() => this.hasPermission(Permission.UserRead));
  $canWriteUser = computed(() => this.hasPermission(Permission.UserWrite));
  $canDeleteUser = computed(() => this.hasPermission(Permission.UserDelete));
  $canManageRoles = computed(() => this.hasPermission(Permission.UserManageRoles));

  $canAccessAdminDashboard = computed(() =>
    this.hasAnyPermission(
      Permission.UserRead,
      Permission.UserWrite,
      Permission.CatalogRead,
      Permission.CatalogWrite,
      Permission.EnrollmentRead,
      Permission.EnrollmentWrite,
      Permission.AuditRead,
      Permission.SuperAdmin
    )
  );
}
