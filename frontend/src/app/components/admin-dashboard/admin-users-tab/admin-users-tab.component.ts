import {Component, inject, signal, output, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {AdminUserService, UserService} from '../../../api';
import {SnackbarService} from '../../../services/snackbar.service';
import {AdminUserListItemDto} from '../../../api';
import {DynamicTableComponent, TableColumn, TableAction} from '../../dynamic-table/dynamic-table.component';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-admin-users-tab',
  standalone: true,
  imports: [CommonModule, MatIconModule, DynamicTableComponent, FormsModule],
  templateUrl: './admin-users-tab.component.html',
  styleUrl: './admin-users-tab.component.scss'
})
export class AdminUsersTabComponent implements OnInit {
  private readonly adminUserService = inject(AdminUserService);
  private readonly userService = inject(UserService);
  private readonly snackbarService = inject(SnackbarService);

  $isLoading = signal(false);
  $users = signal<AdminUserListItemDto[]>([]);
  $showUserDetails = signal<string | null>(null);
  $showCreateUserModal = signal<boolean>(false);

  $newUser = signal({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    isActive: true,
    systemRole: null as number | null
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
    {icon: 'visibility', label: 'View Details', handler: (user) => this.viewUserDetails(user.id!)},
    {icon: 'school', label: 'View Enrollments', handler: (user) => this.viewUserEnrollments(user.id!)},
    {icon: 'edit', label: 'Edit User', handler: (user) => this.snackbarService.show('Edit user (pending)', 400)},
    {icon: 'lock_reset', label: 'Reset Password', handler: (user) => this.resetUserPassword(user.id!)},
    {
      icon: 'block',
      label: 'Toggle Status',
      handler: (user) => this.toggleUserStatus(user.id!, user.isActive ?? false)
    },
    {
      divider: true, icon: '', label: '', handler: () => {
      }
    },
    {icon: 'admin_panel_settings', label: 'Assign Role', handler: (user) => this.assignRole(user.id!, 1)},
    {icon: 'person', label: 'Impersonate User', handler: (user) => this.impersonateUser(user.id!)},
    {
      divider: true, icon: '', label: '', handler: () => {
      }
    },
    {icon: 'delete', label: 'Delete User', danger: true, handler: (user) => this.deleteUser(user.id!)}
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

  getRoleName(roles: number[] | null | undefined): string {
    if (!roles || roles.length === 0) return 'No role';
    const roleNames: string[] = [];
    if (roles.includes(1)) roleNames.push('Student');
    if (roles.includes(2)) roleNames.push('Staff');
    if (roles.includes(3)) roleNames.push('Admin');
    return roleNames.length > 0 ? roleNames.join(', ') : 'Unknown';
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

  assignRole(userId: string, roleId: number): void {
    // TODO: fix in backend
    // this.userService.apiUsersIdRolesPost(userId, {role: roleId}).subscribe({
    //   next: (response: any) => {
    //     this.snackbarService.showFromApiResponse(response);
    //     this.loadUsers();
    //   },
    //   error: (err: any) => {
    //     const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
    //     const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to assign role';
    //     this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
    //   }
    // });
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
      role: user.systemRole as any ?? undefined
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
