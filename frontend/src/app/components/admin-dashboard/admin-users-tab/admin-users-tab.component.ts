import {Component, inject, signal, output, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {AdminUserService, UserService} from '../../../api';
import {SnackbarService} from '../../../services/snackbar.service';
import {AdminUserListItemDto, RoleDto} from '../../../api';
import {DynamicTableComponent, TableColumn, TableAction} from '../../dynamic-table/dynamic-table.component';
import {FormsModule} from '@angular/forms';
import {PermissionService} from '../../../services/permission.service';
import {RoleService} from '../../../services/role.service';
import {HasPermissionDirective} from '../../../directives/has-permission.directive';

@Component({
  selector: 'app-admin-users-tab',
  standalone: true,
  imports: [CommonModule, MatIconModule, DynamicTableComponent, FormsModule, HasPermissionDirective],
  templateUrl: './admin-users-tab.component.html',
  styleUrl: './admin-users-tab.component.scss'
})
export class AdminUsersTabComponent implements OnInit {
  private readonly adminUserService = inject(AdminUserService);
  private readonly userService = inject(UserService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly permissionService = inject(PermissionService);
  protected readonly roleService = inject(RoleService);

  $isLoading = signal(false);
  $users = signal<AdminUserListItemDto[]>([]);
  $showUserDetails = signal<string | null>(null);
  $showCreateUserModal = signal<boolean>(false);
  $showAssignRoleModal = signal<{ userId: string, currentRoles: RoleDto[] } | null>(null);

  $newUser = signal({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    isActive: true,
    systemRole: null as string | null
  });

  userColumns: TableColumn<AdminUserListItemDto>[] = [
    {key: 'id', label: 'ID', visible: false, cellClass: 'cell-id'},
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      visible: true,
      render: (user) => `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name'
    },
    {key: 'email', label: 'Email', sortable: true, visible: true},
    {
      key: 'roles',
      label: 'Roles',
      sortable: true,
      visible: true,
      render: (user) => this.getRoleName(user.roles)
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      visible: true,
      render: (user) => user.isActive ? 'Active' : 'Inactive'
    }
  ];

  userActions: TableAction<AdminUserListItemDto>[] = [
    {
      icon: 'visibility',
      label: 'View Details',
      handler: (user) => this.viewUserDetails(user.id!),
      requiredPermission: "UserRead"
    },
    {
      icon: 'school',
      label: 'View Enrollments',
      handler: (user) => this.viewUserEnrollments(user.id!),
      requiredPermission: "EnrollmentRead"
    },
    {
      icon: 'edit',
      label: 'Edit User',
      handler: (user) => this.snackbarService.show('Edit user (pending)', 400),
      requiredPermission: "UserWrite"
    },
    {
      icon: 'lock_reset',
      label: 'Reset Password',
      handler: (user) => this.resetUserPassword(user.id!),
      requiredPermission: "UserWrite"
    },
    {
      icon: 'block',
      label: 'Toggle Status',
      handler: (user) => this.toggleUserStatus(user.id!, user.isActive ?? false),
      requiredPermission: "UserWrite"
    },
    {
      divider: true, icon: '', label: '', handler: () => {
      }
    },
    {
      icon: 'admin_panel_settings',
      label: 'Assign Role',
      handler: (user) => this.openAssignRoleModal(user.id!, user.roles ?? []),
      requiredPermission: "UserManageRoles"
    },
    {
      icon: 'person',
      label: 'Impersonate User',
      handler: (user) => this.impersonateUser(user.id!),
      requiredPermission: "SuperAdmin"
    },
    {
      divider: true, icon: '', label: '', handler: () => {
      }
    },
    {
      icon: 'delete',
      label: 'Delete User',
      danger: true,
      handler: (user) => this.deleteUser(user.id!),
      requiredPermission: "UserDelete"
    }
  ];

  $viewEnrollments = output<string>();

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.$isLoading.set(true);
    this.adminUserService.apiAdminUsersGet().subscribe({
      next: (response) => {
        const userData = response.data;
        if (Array.isArray(userData)) {
          this.$users.set(userData);
        } else {
          this.$users.set([]);
        }
        this.$isLoading.set(false);
      },
      error: (err) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to load users';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
        this.$isLoading.set(false);
      }
    });
  }

  reloadUsers(): void {
    this.loadUsers();
  }

  getRoleName(roles: RoleDto[] | null | undefined): string {
    if (!roles || roles.length === 0) return 'No roles';
    const roleNames = roles
      .map(role => role.name)
      .filter(name => name != null)
      .join(', ');
    return roleNames || 'Unknown';
  }

  viewUserDetails(userId: string): void {
    this.$showUserDetails.set(userId);
  }

  closeUserDetails(): void {
    this.$showUserDetails.set(null);
  }

  viewUserEnrollments(userId: string): void {
    this.$viewEnrollments.emit(userId);
  }

  resetUserPassword(userId: string): void {
    // TODO in backend
  }

  toggleUserStatus(userId: string, currentStatus: boolean): void {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    this.updateUserStatus(userId, newStatus);
  }

  updateUserStatus(userId: string, isActive: boolean): void {
    this.adminUserService.apiAdminUsersIdActivePatch(userId, {isActive}).subscribe({
      next: (response: any) => {
        this.snackbarService.showFromApiResponse(response);
        this.loadUsers();
      },
      error: (err: any) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to update user status';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
      }
    });
  }

  openAssignRoleModal(userId: string, currentRoles: RoleDto[]): void {
    this.$showAssignRoleModal.set({userId, currentRoles});
  }

  closeAssignRoleModal(): void {
    this.$showAssignRoleModal.set(null);
  }

  isRoleAssigned(roleId: string): boolean {
    const modal = this.$showAssignRoleModal();
    if (!modal) return false;
    return modal.currentRoles.some(r => r.id === roleId);
  }

  assignRole(userId: string, roleId: string): void {
    this.userService.apiUsersIdRolesPost(userId, {roleId} as any).subscribe({
      next: (response: any) => {
        this.snackbarService.showFromApiResponse(response);
        this.closeAssignRoleModal();
        this.loadUsers();
      },
      error: (err: any) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to assign role';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
      }
    });
  }

  impersonateUser(userId: string): void {
    if (!confirm('Impersonate this user? You will be logged in as them.')) return;

    this.snackbarService.show('Impersonation feature not yet implemented', 400);
  }

  deleteUser(userId: string): void {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    this.adminUserService.apiAdminUsersUserIdDelete(userId).subscribe({
      next: (response) => {
        this.snackbarService.showFromApiResponse(response);
        this.loadUsers();
      },
      error: (err) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to delete user';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
      }
    });
  }

  openCreateUserModal(): void {
    this.$showCreateUserModal.set(true);
  }

  closeCreateUserModal(): void {
    this.$showCreateUserModal.set(false);
  }

  createUser(): void {
    const user = this.$newUser();
    if (!user.firstName || !user.lastName || !user.email || !user.password) {
      this.snackbarService.show('Please fill all fields', 400);
      return;
    }

    this.adminUserService.apiAdminUsersPost({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      isActive: user.isActive,
      roleId: user.systemRole
    }).subscribe({
      next: (response) => {
        this.snackbarService.showFromApiResponse(response);
        this.closeCreateUserModal();
        this.$newUser.set({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          isActive: true,
          systemRole: null
        });
        this.loadUsers();
      },
      error: (err) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to create user';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
      }
    });
  }
}
