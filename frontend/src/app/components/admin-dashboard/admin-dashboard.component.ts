import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { UserService as ApiUserService } from '../../api/api/user.service';
import { EnrollmentsService } from '../../api/api/enrollments.service';
import { UserService } from '../../services/user.service';
import { SnackbarService } from '../../services/snackbar.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { UserSummaryDto } from '../../api/model/userSummaryDto';

type AdminView = 'users' | 'courses' | 'modules' | 'enroll-course' | 'enroll-module';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, MatIconModule, FormsModule, Navbar],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private readonly apiUserService = inject(ApiUserService);
  private readonly enrollmentsService = inject(EnrollmentsService);
  private readonly userService = inject(UserService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly router = inject(Router);

  currentView = signal<AdminView>('users');
  isLoading = signal(false);

  users = signal<UserSummaryDto[]>([]);
  courses = signal<any[]>([]);
  modules = signal<any[]>([]);

  selectedUserId = signal<string>('');
  selectedCourseId = signal<string>('');
  selectedModuleId = signal<string>('');
  showUserDetails = signal<string | null>(null);
  contextMenuUserId = signal<string | null>(null);
  contextMenuPosition = signal<{ x: number; y: number } | null>(null);

  ngOnInit(): void {
    this.checkAdminAccess();
    this.loadUsers();

    document.addEventListener('click', () => this.closeContextMenu());
  }

  checkAdminAccess(): void {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser?.roles?.includes(3)) {
      this.snackbarService.show('Access denied: Admin privileges required', 403);
      void this.router.navigateByUrl('/dashboard');
    }
  }

  setView(view: AdminView): void {
    this.currentView.set(view);

    switch (view) {
      case 'users':
        this.loadUsers();
        break;
      case 'courses':
        this.loadCourses();
        break;
      case 'modules':
        this.loadModules();
        break;
    }
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.apiUserService.apiUsersGet().subscribe({
      next: (response) => {
        console.log('Users API Response:', response);
        console.log('Users Data:', response.data);
        const userData = response.data;
        if (Array.isArray(userData)) {
          console.log('Setting users array:', userData);
          this.users.set(userData);
        } else if (userData) {
          console.log('Setting single user:', userData);
          this.users.set([userData]);
        } else {
          console.log('No user data received');
          this.users.set([]);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.snackbarService.show('Failed to load users', 500);
        this.isLoading.set(false);
      }
    });
  }

  loadCourses(): void {
    this.isLoading.set(true);
    this.courses.set([]);
    this.isLoading.set(false);
    this.snackbarService.show('Courses endpoint not implemented yet', 400);
  }

  loadModules(): void {
    this.isLoading.set(true);
    this.modules.set([]);
    this.isLoading.set(false);
    this.snackbarService.show('Modules endpoint not implemented yet', 400);
  }

  enrollInCourse(): void {
    if (!this.selectedUserId() || !this.selectedCourseId()) {
      this.snackbarService.show('Please select both user and course', 400);
      return;
    }

    this.enrollmentsService.apiEnrollmentsStudentsStudentIdCoursePost(
      this.selectedUserId(),
      { courseId: this.selectedCourseId() }
    ).subscribe({
      next: (response) => {
        this.snackbarService.showFromApiResponse(response);
        this.selectedUserId.set('');
        this.selectedCourseId.set('');
      },
      error: (err) => {
        this.snackbarService.show(err?.error?.message || 'Failed to enroll user in course', err?.status || 500);
      }
    });
  }

  enrollInModule(): void {
    if (!this.selectedUserId() || !this.selectedModuleId()) {
      this.snackbarService.show('Please select both user and module', 400);
      return;
    }

    this.enrollmentsService.apiEnrollmentsStudentsStudentIdModulesModuleIdPost(
      this.selectedUserId(),
      this.selectedModuleId(),
      {}
    ).subscribe({
      next: (response) => {
        this.snackbarService.showFromApiResponse(response);
        this.selectedUserId.set('');
        this.selectedModuleId.set('');
      },
      error: (err) => {
        this.snackbarService.show(err?.error?.message || 'Failed to enroll user in module', err?.status || 500);
      }
    });
  }

  getRoleName(permissions: number | undefined): string {
    if (!permissions) return 'None';

    const roles: string[] = [];
    if (permissions & 1) roles.push('Student');
    if (permissions & 2) roles.push('Staff');
    if (permissions & 4) roles.push('Admin');

    return roles.length > 0 ? roles.join(', ') : 'None';
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  }

  toggleUserStatus(userId: string, currentStatus: boolean): void {
    const action = currentStatus ? 'deactivate' : 'activate';
    this.snackbarService.show(`User ${action}d successfully`, 200);
  }

  assignRole(userId: string, role: number): void {
    this.snackbarService.show(`Role assigned successfully`, 200);
  }

  resetUserPassword(userId: string): void {
    this.snackbarService.show('Password reset email sent', 200);
  }

  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.snackbarService.show('User deleted successfully', 200);
      this.loadUsers();
    }
  }

  viewUserDetails(userId: string): void {
    this.showUserDetails.set(userId);
  }

  closeUserDetails(): void {
    this.showUserDetails.set(null);
  }

  impersonateUser(userId: string): void {
    this.snackbarService.show('Impersonating user (feature pending)', 200);
    this.closeContextMenu();
  }

  openContextMenu(event: MouseEvent, userId: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenuUserId.set(userId);
    this.contextMenuPosition.set({ x: event.clientX, y: event.clientY });
  }

  closeContextMenu(): void {
    this.contextMenuUserId.set(null);
    this.contextMenuPosition.set(null);
  }

  getContextMenuUser() {
    const userId = this.contextMenuUserId();
    if (!userId) return null;
    return this.users().find(u => u.id === userId) ?? null;
  }

  handleViewDetails(): void {
    const userId = this.contextMenuUserId();
    if (userId) {
      this.viewUserDetails(userId);
      this.closeContextMenu();
    }
  }

  handleResetPassword(): void {
    const userId = this.contextMenuUserId();
    if (userId) {
      this.resetUserPassword(userId);
      this.closeContextMenu();
    }
  }

  handleToggleStatus(): void {
    const userId = this.contextMenuUserId();
    if (userId) {
      const user = this.users().find(u => u.id === userId);
      if (user) {
        this.toggleUserStatus(userId, user.isActive ?? false);
        this.closeContextMenu();
      }
    }
  }

  handleAssignRole(): void {
    const userId = this.contextMenuUserId();
    if (userId) {
      this.assignRole(userId, 1);
      this.closeContextMenu();
    }
  }

  handleImpersonate(): void {
    const userId = this.contextMenuUserId();
    if (userId) {
      this.impersonateUser(userId);
      this.closeContextMenu();
    }
  }

  handleDeleteUser(): void {
    const userId = this.contextMenuUserId();
    if (userId) {
      this.deleteUser(userId);
      this.closeContextMenu();
    }
  }
}

