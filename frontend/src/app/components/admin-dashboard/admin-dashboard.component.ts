import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {AdminCatalogService} from '../../api';
import {AdminUserService} from '../../api';
import {UserService} from '../../services/user.service';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {AdminUserListItemDto} from '../../api';
import {AdminCourseDto} from '../../api';
import {EnrollmentDetailsComponent} from '../enrollment-details/enrollment-details.component';
import {AdminUsersTabComponent} from './admin-users-tab/admin-users-tab.component';
import {AdminCoursesTabComponent} from './admin-courses-tab/admin-courses-tab.component';
import {AdminModulesTabComponent} from './admin-modules-tab/admin-modules-tab.component';
import {AdminEnrollCourseTabComponent} from './admin-enroll-course-tab/admin-enroll-course-tab.component';
import {AdminEnrollModuleTabComponent} from './admin-enroll-module-tab/admin-enroll-module-tab.component';
import {AdminAuditTabComponent} from './admin-audit-tab/admin-audit-tab.component';
import {AdminLoginAuditTab} from './admin-login-audit-tab/admin-login-audit-tab';
import {PermissionService} from '../../services/permission.service';

type AdminView = 'users' | 'courses' | 'modules' | 'enroll-course' | 'enroll-module' | 'audit' | 'login-audit';
type EnrollmentMode = 'user' | 'course' | 'module';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule,
    EnrollmentDetailsComponent,
    AdminUsersTabComponent,
    AdminCoursesTabComponent,
    AdminModulesTabComponent,
    AdminEnrollCourseTabComponent,
    AdminEnrollModuleTabComponent,
    AdminAuditTabComponent,
    AdminLoginAuditTab
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminCatalogService = inject(AdminCatalogService);
  private readonly adminUserService = inject(AdminUserService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  public readonly permissionService = inject(PermissionService);

  $currentView = signal<AdminView>('users');
  $isLoading = signal(false);

  $users = signal<AdminUserListItemDto[]>([]);
  $courses = signal<AdminCourseDto[]>([]);

  $showEnrollmentDetails = signal<boolean>(false);
  $enrollmentDetailsMode = signal<EnrollmentMode>('user');
  $enrollmentDetailsEntityId = signal<string>('');
  $enrollmentDetailsEntityName = signal<string>('');

  ngOnInit(): void {
    this.checkAdminAccess();

    const savedView = localStorage.getItem('adminDashboard_currentView') as AdminView;
    if (savedView) {
      this.setView(savedView);
    } else {
      this.setView('users');
    }
  }

  checkAdminAccess(): void {
    const currentUser = this.userService.getCurrentUser();
    const hasAdminRole = currentUser?.roles?.some(role =>
      role.key?.toLowerCase() === 'admin'
    ) || false;

    if (!hasAdminRole) {
      void this.router.navigateByUrl('/dashboard');
    }
  }

  setView(view: AdminView): void {
    this.$currentView.set(view);
    localStorage.setItem('adminDashboard_currentView', view);

    switch (view) {
      case 'users':
        this.loadUsers();
        break;
      case 'courses':
        this.loadCourses();
        break;
      case 'modules':
        this.loadCourses();
        break;
      case 'enroll-course':
      case 'enroll-module':
        this.loadUsers();
        this.loadCourses();
        break;
      case 'audit':
        // Audit tab loads its own data
        break;
      case 'login-audit':
        // Login audit tab loads its own data
        break;
    }
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
      error: () => {
        this.$users.set([]);
        this.$isLoading.set(false);
      }
    });
  }

  loadCourses(): void {
    this.$isLoading.set(true);
    this.adminCatalogService.apiAdminCoursesGet().subscribe({
      next: (response) => {
        const courseData = response.data;
        if (Array.isArray(courseData)) {
          this.$courses.set(courseData);
        } else {
          this.$courses.set([]);
        }
        this.$isLoading.set(false);
      },
      error: () => {
        this.$courses.set([]);
        this.$isLoading.set(false);
      }
    });
  }

  handleViewUserEnrollments(userId: string): void {
    const user = this.$users().find(u => u.id === userId);
    if (user) {
      this.$enrollmentDetailsMode.set('user');
      this.$enrollmentDetailsEntityId.set(user.student?.id || '');
      this.$enrollmentDetailsEntityName.set(`${user.firstName} ${user.lastName}`);
      this.$showEnrollmentDetails.set(true);
    }
  }

  handleViewCourseEnrollments(courseId: string): void {
    const course = this.$courses().find(c => c.id === courseId);
    if (course) {
      this.$enrollmentDetailsMode.set('course');
      this.$enrollmentDetailsEntityId.set(courseId);
      this.$enrollmentDetailsEntityName.set(course.title || '');
      this.$showEnrollmentDetails.set(true);
    }
  }

  handleViewModuleEnrollments(moduleId: string): void {
    this.$enrollmentDetailsMode.set('module');
    this.$enrollmentDetailsEntityId.set(moduleId);
    this.$enrollmentDetailsEntityName.set('Module');
    this.$showEnrollmentDetails.set(true);
  }

  closeEnrollmentDetails(): void {
    this.$showEnrollmentDetails.set(false);
  }
}
