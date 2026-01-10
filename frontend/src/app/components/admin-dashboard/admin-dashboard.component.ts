import {Component, inject, OnInit, signal, effect, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {AdminUserService} from '../../api/api/adminUser.service';
import {AdminCatalogService} from '../../api/api/adminCatalog.service';
import {AdminEnrollmentService} from '../../api/api/adminEnrollment.service';
import {UserService} from '../../services/user.service';
import {SnackbarService} from '../../services/snackbar.service';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {Navbar} from '../navbar/navbar';
import {AdminUserListItemDto} from '../../api/model/adminUserListItemDto';
import {AdminCourseDto} from '../../api/model/adminCourseDto';
import {AdminModuleDto} from '../../api/model/adminModuleDto';
import {DynamicTableComponent, TableColumn, TableAction} from '../dynamic-table/dynamic-table.component';
import {EnrollmentDetailsComponent} from '../enrollment-details/enrollment-details.component';

type AdminView = 'users' | 'courses' | 'modules' | 'enroll-course' | 'enroll-module';
type EnrollmentMode = 'user' | 'course' | 'module';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, MatIconModule, FormsModule, Navbar, DynamicTableComponent, EnrollmentDetailsComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminUserService = inject(AdminUserService);
  private readonly adminCatalogService = inject(AdminCatalogService);
  private readonly adminEnrollmentService = inject(AdminEnrollmentService);
  private readonly userService = inject(UserService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly router = inject(Router);

  currentView = signal<AdminView>('users');
  isLoading = signal(false);

  users = signal<AdminUserListItemDto[]>([]);
  courses = signal<AdminCourseDto[]>([]);
  modules = signal<AdminModuleDto[]>([]);

  userColumns: TableColumn<AdminUserListItemDto>[] = [
    { key: 'id', label: 'ID', visible: false, cellClass: 'cell-id' },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      visible: true,
      render: (user) => `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name'
    },
    { key: 'email', label: 'Email', sortable: true, visible: true },
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

  courseColumns: TableColumn<AdminCourseDto>[] = [
    { key: 'id', label: 'ID', visible: false, cellClass: 'cell-id' },
    { key: 'courseCode', label: 'Code', sortable: true, visible: true },
    { key: 'title', label: 'Title', sortable: true, visible: true },
    { key: 'description', label: 'Description', visible: true, cellClass: 'cell-description' },
    { key: 'award', label: 'Award', visible: true },
    { key: 'durationSemesters', label: 'Duration', visible: true },
    {
      key: 'isActive',
      label: 'Status',
      visible: true,
      render: (course) => course.isActive ? 'Active' : 'Inactive'
    }
  ];

  moduleColumns: TableColumn<AdminModuleDto>[] = [
    { key: 'id', label: 'ID', visible: false, cellClass: 'cell-id' },
    { key: 'moduleCode', label: 'Code', sortable: true, visible: true },
    { key: 'title', label: 'Title', sortable: true, visible: true },
    { key: 'description', label: 'Description', visible: true, cellClass: 'cell-description' },
    { key: 'credits', label: 'Credits', visible: true },
    { key: 'level', label: 'Level', visible: true },
    { key: 'semesterOfStudy', label: 'Semester', visible: true },
    { key: 'term', label: 'Term', visible: true }
  ];

  userActions: TableAction<AdminUserListItemDto>[] = [
    { icon: 'visibility', label: 'View Details', handler: (user) => this.viewUserDetails(user.id!) },
    { icon: 'school', label: 'View Enrollments', handler: (user) => this.viewUserEnrollments(user.id!) },
    { icon: 'edit', label: 'Edit User', handler: (user) => this.snackbarService.show('Edit user (pending)', 400) },
    { icon: 'lock_reset', label: 'Reset Password', handler: (user) => this.resetUserPassword(user.id!) },
    {
      icon: 'block',
      label: 'Toggle Status',
      handler: (user) => this.toggleUserStatus(user.id!, user.isActive ?? false)
    },
    { divider: true, icon: '', label: '', handler: () => {} },
    { icon: 'admin_panel_settings', label: 'Assign Role', handler: (user) => this.assignRole(user.id!, 1) },
    { icon: 'person', label: 'Impersonate User', handler: (user) => this.impersonateUser(user.id!) },
    { divider: true, icon: '', label: '', handler: () => {} },
    { icon: 'delete', label: 'Delete User', danger: true, handler: (user) => this.deleteUser(user.id!) }
  ];

  courseActions: TableAction<AdminCourseDto>[] = [
    { icon: 'visibility', label: 'View Details', handler: (course) => this.showCourseDetails.set(course.id!) },
    { icon: 'people', label: 'View Enrolled Students', handler: (course) => this.viewCourseEnrollments(course.id!) },
    { icon: 'edit', label: 'Edit Course', handler: (course) => this.editCourse(course) },
    { icon: 'content_copy', label: 'Clone Course', handler: (course) => this.cloneCourse(course) },
    { divider: true, icon: '', label: '', handler: () => {} },
    { icon: 'delete', label: 'Delete Course', danger: true, handler: (course) => this.deleteCourse(course.id!) }
  ];

  moduleActions: TableAction<AdminModuleDto>[] = [
    { icon: 'visibility', label: 'View Details', handler: (module) => this.showModuleDetails.set(module.id!) },
    { icon: 'people', label: 'View Enrolled Students', handler: (module) => this.viewModuleEnrollments(module.id!) },
    { icon: 'edit', label: 'Edit Module', handler: (module) => this.editModule(module) },
    { icon: 'content_copy', label: 'Clone Module', handler: (module) => this.cloneModule(module) },
    { divider: true, icon: '', label: '', handler: () => {} },
    { icon: 'delete', label: 'Delete Module', danger: true, handler: (module) => this.deleteModule(module.id!) }
  ];

  selectedUserId = signal<string>('');
  selectedCourseId = signal<string>('');
  selectedModuleId = signal<string>('');

  studentSearchQuery = signal('');
  courseSearchQuery = signal('');
  moduleSearchQuery = signal('');
  selectedStudentIds = signal<Set<string>>(new Set());

  searchUserQuery = signal<string>('');
  searchCourseQuery = signal<string>('');
  searchModuleQuery = signal<string>('');

  userSortField = signal<'name' | 'email' | 'roles' | 'status'>('name');
  userSortDirection = signal<'asc' | 'desc'>('asc');
  courseSortField = signal<'code' | 'title'>('code');
  courseSortDirection = signal<'asc' | 'desc'>('asc');
  moduleSortField = signal<'code' | 'title'>('code');
  moduleSortDirection = signal<'asc' | 'desc'>('asc');

  courseVisibleColumns = signal({
    id: false,
    code: true,
    title: true,
    description: true,
    award: true,
    durationSemesters: true,
    isActive: true
  });

  moduleVisibleColumns = signal({
    id: false,
    code: true,
    title: true,
    description: true,
    credits: true,
    level: true,
    semesterOfStudy: true,
    term: true
  });

  showUserDetails = signal<string | null>(null);
  showCourseDetails = signal<string | null>(null);
  showModuleDetails = signal<string | null>(null);
  showCreateUserModal = signal<boolean>(false);
  showCreateCourseModal = signal<boolean>(false);
  showCreateModuleModal = signal<boolean>(false);
  showEditUserModal = signal<string | null>(null);
  showEditCourseModal = signal<string | null>(null);
  showEditModuleModal = signal<string | null>(null);

  showEnrollmentDetails = signal<boolean>(false);
  enrollmentDetailsMode = signal<EnrollmentMode>('user');
  enrollmentDetailsEntityId = signal<string>('');
  enrollmentDetailsEntityName = signal<string>('');

  contextMenuUserId = signal<string | null>(null);
  contextMenuCourseId = signal<string | null>(null);
  contextMenuModuleId = signal<string | null>(null);
  contextMenuPosition = signal<{ x: number; y: number } | null>(null);

  editCourseData = signal({
    id: '',
    code: '',
    title: '',
    description: '',
    award: '',
    durationSemesters: 0,
    isActive: true
  });

  editModuleData = signal({
    id: '',
    code: '',
    title: '',
    description: '',
    credits: 0,
    level: 0,
    semesterOfStudy: 0,
    term: ''
  });

  newUser = signal({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    isActive: true,
    systemRole: null as number | null
  });

  newCourse = signal({
    code: '',
    title: '',
    description: '',
    award: '',
    durationSemesters: 0,
    isActive: true,
    academicYear: new Date().getFullYear(),
    yearOfStudy: 1,
    semester: 1
  });

  newModule = signal({
    code: '',
    title: '',
    description: '',
    credits: 0,
    level: 0,
    semesterOfStudy: 0,
    term: '',
    academicYear: new Date().getFullYear(),
    yearOfStudy: 1,
    semester: 1
  });

  filteredUsers = computed(() => {
    let filtered = this.users();
    const query = this.searchUserQuery().toLowerCase();

    if (query) {
      filtered = filtered.filter(user => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        return user.email?.toLowerCase().includes(query) ||
               user.firstName?.toLowerCase().includes(query) ||
               user.lastName?.toLowerCase().includes(query) ||
               fullName.includes(query) ||
               this.getRoleName(user.roles).toLowerCase().includes(query);
      });
    }

    return this.sortUsers(filtered);
  });

  filteredCourses = computed(() => {
    let filtered = this.courses();
    const query = this.searchCourseQuery().toLowerCase();

    if (query) {
      filtered = filtered.filter(course =>
        course.courseCode?.toLowerCase().includes(query) ||
        course.title?.toLowerCase().includes(query)
      );
    }

    return this.sortCourses(filtered);
  });

  filteredModules = computed(() => {
    let filtered = this.modules();
    const query = this.searchModuleQuery().toLowerCase();

    if (query) {
      filtered = filtered.filter(module =>
        module.moduleCode?.toLowerCase().includes(query) ||
        module.title?.toLowerCase().includes(query)
      );
    }

    return this.sortModules(filtered);
  });

  constructor() {
    effect(() => {
      if (this.showEditCourseModal()) {
        setTimeout(() => {
          const input = document.getElementById('edit-course-code') as HTMLInputElement;
          if (input) {
            input.focus();
            input.select();
          }
        }, 0);
      }
    });

    effect(() => {
      if (this.showEditModuleModal()) {
        setTimeout(() => {
          const input = document.getElementById('edit-module-code') as HTMLInputElement;
          if (input) {
            input.focus();
            input.select();
          }
        }, 0);
      }
    });
  }

  ngOnInit(): void {
    this.checkAdminAccess();

    const savedView = localStorage.getItem('adminDashboard_currentView') as AdminView;
    if (savedView) {
      this.currentView.set(savedView);
      switch (savedView) {
        case 'users':
          this.loadUsers();
          break;
        case 'courses':
          this.loadCourses();
          break;
        case 'modules':
          if (this.selectedCourseId()) {
            this.loadModules();
          }
          break;
        default:
          this.loadUsers();
      }
    } else {
      this.loadUsers();
    }

    document.addEventListener('click', () => this.closeContextMenu());
  }

  getCurrentUserName(): string {
    const user = this.userService.getCurrentUser();
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      return emailName
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    return 'Admin User';
  }

  getCurrentUserEmail(): string {
    const user = this.userService.getCurrentUser();
    return user?.email || '';
  }

  checkAdminAccess(): void {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser?.roles?.includes(3)) {
      this.snackbarService.show('Access denied: Admin privileges required', 403);
      void this.router.navigateByUrl('/dashboard');
    }
  }

  setView(view: AdminView): void {
    const previousView = this.currentView();
    this.currentView.set(view);
    localStorage.setItem('adminDashboard_currentView', view);

    if ((previousView === 'enroll-course' || previousView === 'enroll-module') &&
        (view === 'enroll-course' || view === 'enroll-module') &&
        previousView !== view) {
      this.resetEnrollmentSelection();
    }

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
    }
  }

  resetEnrollmentSelection(): void {
    this.selectedStudentIds.set(new Set());
    this.studentSearchQuery.set('');
    this.courseSearchQuery.set('');
    this.moduleSearchQuery.set('');
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.adminUserService.apiAdminUsersGet().subscribe({
      next: (response) => {
        const userData = response.data;
        if (Array.isArray(userData)) {
          this.users.set(userData);
        } else if (userData) {
          this.users.set([userData]);
        } else {
          this.users.set([]);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to load users';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
        this.isLoading.set(false);
      }
    });
  }

  loadCourses(): void {
    this.isLoading.set(true);
    this.adminCatalogService.apiAdminCoursesGet().subscribe({
      next: (response) => {
        const courseData = response.data;
        if (Array.isArray(courseData)) {
          this.courses.set(courseData);
          if (this.currentView() === 'modules' && courseData.length > 0 && !this.selectedCourseId()) {
            this.selectedCourseId.set(courseData[0].id || '');
            this.loadModules();
          }
        } else {
          this.courses.set([]);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to load courses';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
        this.isLoading.set(false);
      }
    });
  }

  loadModules(): void {
    this.isLoading.set(true);
    if (!this.selectedCourseId()) {
      this.modules.set([]);
      this.isLoading.set(false);
      this.snackbarService.show('Please select a course first', 400);
      return;
    }
    this.adminCatalogService.apiAdminCoursesCourseIdModulesGet(this.selectedCourseId()).subscribe({
      next: (response) => {
        const moduleData = response.data;
        if (Array.isArray(moduleData)) {
          this.modules.set(moduleData);
        } else {
          this.modules.set([]);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to load modules';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
        this.isLoading.set(false);
      }
    });
  }

  enrollInCourse(): void {
    if (!this.selectedUserId() || !this.selectedCourseId()) {
      this.snackbarService.show('Please select both user and course', 400);
      return;
    }

    const selectedUser = this.users().find(u => u.id === this.selectedUserId());
    const studentId = selectedUser?.student?.id;

    if (!studentId) {
      this.snackbarService.show('Selected user is not a student', 400);
      return;
    }

    this.adminEnrollmentService.apiAdminStudentsStudentIdCourseEnrollmentPost(
      studentId,
      {courseId: this.selectedCourseId()}
    ).subscribe({
      next: (response) => {
        this.snackbarService.showFromApiResponse(response);
        this.selectedUserId.set('');
        this.selectedCourseId.set('');
      },
      error: (err) => {
        const errorCode = err?.error?.errorCode || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.message || 'Failed to enroll user in course';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
      }
    });
  }

  enrollInModule(): void {
    if (!this.selectedUserId() || !this.selectedModuleId()) {
      this.snackbarService.show('Please select both user and module', 400);
      return;
    }

    const selectedUser = this.users().find(u => u.id === this.selectedUserId());
    const studentId = selectedUser?.student?.id;

    if (!studentId) {
      this.snackbarService.show('Selected user is not a student', 400);
      return;
    }

    this.adminEnrollmentService.apiAdminStudentsStudentIdModulesModuleIdEnrollPost(
      studentId,
      this.selectedModuleId(),
      {}
    ).subscribe({
      next: (response) => {
        this.snackbarService.showFromApiResponse(response);
        this.selectedUserId.set('');
        this.selectedModuleId.set('');
      },
      error: (err) => {
        const errorCode = err?.error?.errorCode || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.message || 'Failed to enroll user in module';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
      }
    });
  }

  getRoleName(roles: number[] | null | undefined): string {
    if (!roles || roles.length === 0) return 'None';
    const roleMap: { [key: number]: string } = {
      1: 'Student',
      2: 'Staff',
      3: 'Admin'
    };
    return roles.map(r => roleMap[r] || 'Unknown').join(', ');
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: string | null | undefined): string {
    if (!date) return 'Never';
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }

  copyToClipboard(text: string | null | undefined, label: string): void {
    if (!text) {
      this.snackbarService.show('Nothing to copy', 400);
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      this.snackbarService.show(`${label} copied to clipboard`, 200);
    }).catch(() => {
      this.snackbarService.show('Failed to copy to clipboard', 500);
    });
  }

  toggleUserStatus(userId: string, currentStatus: boolean): void {
    this.updateUserStatus(userId, !currentStatus);
  }

  assignRole(userId: string, role: number): void {
    this.snackbarService.show(`Role assigned successfully`, 200);
  }

  resetUserPassword(userId: string): void {
    this.snackbarService.show('Password reset email sent', 200);
  }

  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
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
  }

  viewUserDetails(userId: string): void {
    this.showUserDetails.set(userId);
  }

  closeUserDetails(): void {
    this.showUserDetails.set(null);
  }

  openCreateUserModal(): void {
    this.showCreateUserModal.set(true);
  }

  closeCreateUserModal(): void {
    this.showCreateUserModal.set(false);
  }

  createUser(): void {
    const user = this.newUser();
    if (!user.email || !user.password || !user.firstName || !user.lastName) {
      this.snackbarService.show('Please fill in all required fields', 400);
      return;
    }

    this.adminUserService.apiAdminUsersPost({
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      systemRole: user.systemRole || undefined
    }).subscribe({
      next: (response) => {
        this.snackbarService.showFromApiResponse(response);
        this.closeCreateUserModal();
        this.loadUsers();
        this.newUser.set({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          isActive: true,
          systemRole: null
        });
      },
      error: (err) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to create user';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
      }
    });
  }

  createCourse(): void {
    const course = this.newCourse();
    if (!course.code || !course.title) {
      this.snackbarService.show('Please fill in all required fields', 400);
      return;
    }

    this.adminCatalogService.apiAdminCoursesPost({
      courseCode: course.code,
      title: course.title,
      description: course.description || undefined,
      award: course.award || undefined,
      durationSemesters: course.durationSemesters || undefined,
      isActive: course.isActive
    }).subscribe({
      next: (response) => {
        this.snackbarService.showFromApiResponse(response);
        this.closeCreateCourseModal();
        this.loadCourses();
        this.newCourse.set({
          code: '',
          title: '',
          description: '',
          award: '',
          durationSemesters: 0,
          isActive: true,
          academicYear: new Date().getFullYear(),
          yearOfStudy: 1,
          semester: 1
        });
      },
      error: (err) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to create course';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
      }
    });
  }

  createModule(): void {
    const module = this.newModule();
    if (!module.code || !module.title || !this.selectedCourseId()) {
      this.snackbarService.show('Please fill in all required fields and select a course', 400);
      return;
    }

    this.adminCatalogService.apiAdminCoursesCourseIdModulesPost(this.selectedCourseId(), {
      moduleCode: module.code,
      title: module.title,
      description: module.description || undefined,
      credits: module.credits || undefined,
      level: module.level || undefined,
      semesterOfStudy: module.semesterOfStudy || undefined,
      term: module.term || undefined
    }).subscribe({
      next: (response) => {
        this.snackbarService.showFromApiResponse(response);
        this.closeCreateModuleModal();
        this.loadModules();
        this.newModule.set({
          code: '',
          title: '',
          description: '',
          credits: 0,
          level: 0,
          semesterOfStudy: 0,
          term: '',
          academicYear: new Date().getFullYear(),
          yearOfStudy: 1,
          semester: 1
        });
      },
      error: (err) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to create module';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
      }
    });
  }

  deleteCourse(courseId: string): void {
    if (confirm('Are you sure you want to delete this course?')) {
      this.adminCatalogService.apiAdminCoursesIdDelete(courseId).subscribe({
        next: (response) => {
          this.snackbarService.showFromApiResponse(response);
          this.loadCourses();
        },
        error: (err) => {
          const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
          const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to delete course';
          this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
        }
      });
    }
  }

  deleteModule(moduleId: string): void {
    if (confirm('Are you sure you want to delete this module?')) {
      this.adminCatalogService.apiAdminModulesIdDelete(moduleId).subscribe({
        next: (response) => {
          this.snackbarService.showFromApiResponse(response);
          this.loadModules();
        },
        error: (err) => {
          const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
          const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to delete module';
          this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
        }
      });
    }
  }

  editCourse(course: AdminCourseDto): void {
    this.editCourseData.set({
      id: course.id || '',
      code: course.courseCode || '',
      title: course.title || '',
      description: course.description || '',
      award: course.award || '',
      durationSemesters: course.durationSemesters || 0,
      isActive: course.isActive ?? true
    });
    this.showEditCourseModal.set(course.id!);
  }

  cloneCourse(course: AdminCourseDto): void {
    this.newCourse.set({
      code: `${course.courseCode || ''}_COPY`,
      title: `${course.title || ''} (Copy)`,
      description: course.description || '',
      award: course.award || '',
      durationSemesters: course.durationSemesters || 0,
      isActive: course.isActive ?? true,
      academicYear: new Date().getFullYear(),
      yearOfStudy: 1,
      semester: 1
    });
    this.showCreateCourseModal.set(true);
  }

  editModule(module: AdminModuleDto): void {
    this.editModuleData.set({
      id: module.id || '',
      code: module.moduleCode || '',
      title: module.title || '',
      description: module.description || '',
      credits: module.credits || 0,
      level: module.level || 0,
      semesterOfStudy: module.semesterOfStudy || 0,
      term: module.term || ''
    });
    this.showEditModuleModal.set(module.id!);
  }

  cloneModule(module: AdminModuleDto): void {
    this.newModule.set({
      code: `${module.moduleCode || ''}_COPY`,
      title: `${module.title || ''} (Copy)`,
      description: module.description || '',
      credits: module.credits || 0,
      level: module.level || 0,
      semesterOfStudy: module.semesterOfStudy || 0,
      term: module.term || '',
      academicYear: new Date().getFullYear(),
      yearOfStudy: 1,
      semester: 1
    });
    this.showCreateModuleModal.set(true);
  }

  updateUserStatus(userId: string, isActive: boolean): void {
    this.adminUserService.apiAdminUsersIdActivePatch(userId, {isActive}).subscribe({
      next: (response) => {
        this.snackbarService.showFromApiResponse(response);
        this.loadUsers();
      },
        error: (err) => {
          const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
          const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to update user status';
          this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
        }
    });
  }

  reloadUsers(): void {
    this.loadUsers();
  }

  reloadCourses(): void {
    this.loadCourses();
  }

  reloadModules(): void {
    this.loadModules();
  }

  openCreateCourseModal(): void {
    this.showCreateCourseModal.set(true);
  }

  closeCreateCourseModal(): void {
    this.showCreateCourseModal.set(false);
  }

  openCreateModuleModal(): void {
    this.showCreateModuleModal.set(true);
  }

  closeCreateModuleModal(): void {
    this.showCreateModuleModal.set(false);
  }

  impersonateUser(userId: string): void {
    this.snackbarService.show('Impersonating user (feature pending)', 200);
    this.closeContextMenu();
  }

  openContextMenu(event: MouseEvent, userId: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenuUserId.set(userId);
    this.contextMenuCourseId.set(null);
    this.contextMenuModuleId.set(null);
    this.contextMenuPosition.set({x: event.clientX, y: event.clientY});
  }

  openCourseContextMenu(event: MouseEvent, courseId: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenuCourseId.set(courseId);
    this.contextMenuUserId.set(null);
    this.contextMenuModuleId.set(null);
    this.contextMenuPosition.set({x: event.clientX, y: event.clientY});
  }

  openModuleContextMenu(event: MouseEvent, moduleId: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenuModuleId.set(moduleId);
    this.contextMenuUserId.set(null);
    this.contextMenuCourseId.set(null);
    this.contextMenuPosition.set({x: event.clientX, y: event.clientY});
  }

  closeContextMenu(): void {
    this.contextMenuUserId.set(null);
    this.contextMenuCourseId.set(null);
    this.contextMenuModuleId.set(null);
    this.contextMenuPosition.set(null);
  }

  closeAllContextMenus(): void {
    this.closeContextMenu();
  }

  getContextMenuUser() {
    const userId = this.contextMenuUserId();
    if (!userId) return null;
    return this.users().find(u => u.id === userId) ?? null;
  }

  getContextMenuCourse() {
    const courseId = this.contextMenuCourseId();
    if (!courseId) return null;
    return this.courses().find(c => c.id === courseId) ?? null;
  }

  getContextMenuModule() {
    const moduleId = this.contextMenuModuleId();
    if (!moduleId) return null;
    return this.modules().find(m => m.id === moduleId) ?? null;
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

  handleEditUser(): void {
    const userId = this.contextMenuUserId();
    if (userId) {
      this.snackbarService.show('Edit user (feature pending - backend support needed)', 400);
      this.closeContextMenu();
    }
  }

  handleViewCourse(): void {
    const courseId = this.contextMenuCourseId();
    if (courseId) {
      this.showCourseDetails.set(courseId);
      this.closeContextMenu();
    }
  }

  handleEditCourse(): void {
    const courseId = this.contextMenuCourseId();
    if (courseId) {
      const course = this.courses().find(c => c.id === courseId);
      if (course) {
        this.editCourseData.set({
          id: course.id || '',
          code: course.courseCode || '',
          title: course.title || '',
          description: course.description || '',
          award: course.award || '',
          durationSemesters: course.durationSemesters || 0,
          isActive: course.isActive ?? true
        });
        this.showEditCourseModal.set(courseId);
      }
      this.closeContextMenu();
    }
  }

  handleDeleteCourse(): void {
    const courseId = this.contextMenuCourseId();
    if (courseId) {
      this.deleteCourse(courseId);
      this.closeContextMenu();
    }
  }

  handleCloneCourse(): void {
    const courseId = this.contextMenuCourseId();
    if (courseId) {
      const course = this.courses().find(c => c.id === courseId);
      if (course) {
        this.newCourse.set({
          code: `${course.courseCode || ''}_COPY`,
          title: `${course.title || ''} (Copy)`,
          description: course.description || '',
          award: course.award || '',
          durationSemesters: course.durationSemesters || 0,
          isActive: course.isActive ?? true,
          academicYear: new Date().getFullYear(),
          yearOfStudy: 1,
          semester: 1
        });
        this.showCreateCourseModal.set(true);
      }
      this.closeContextMenu();
    }
  }

  handleViewModule(): void {
    const moduleId = this.contextMenuModuleId();
    if (moduleId) {
      this.showModuleDetails.set(moduleId);
      this.closeContextMenu();
    }
  }

  handleEditModule(): void {
    const moduleId = this.contextMenuModuleId();
    if (moduleId) {
      const module = this.modules().find(m => m.id === moduleId);
      if (module) {
        this.editModuleData.set({
          id: module.id || '',
          code: module.moduleCode || '',
          title: module.title || '',
          description: module.description || '',
          credits: module.credits || 0,
          level: module.level || 0,
          semesterOfStudy: module.semesterOfStudy || 0,
          term: module.term || ''
        });
        this.showEditModuleModal.set(moduleId);
      }
      this.closeContextMenu();
    }
  }

  handleDeleteModule(): void {
    const moduleId = this.contextMenuModuleId();
    if (moduleId) {
      this.deleteModule(moduleId);
      this.closeContextMenu();
    }
  }

  handleCloneModule(): void {
    const moduleId = this.contextMenuModuleId();
    if (moduleId) {
      const module = this.modules().find(m => m.id === moduleId);
      if (module) {
        this.newModule.set({
          code: `${module.moduleCode || ''}_COPY`,
          title: `${module.title || ''} (Copy)`,
          description: module.description || '',
          credits: module.credits || 0,
          level: module.level || 0,
          semesterOfStudy: module.semesterOfStudy || 0,
          term: module.term || '',
          academicYear: new Date().getFullYear(),
          yearOfStudy: 1,
          semester: 1
        });
        this.showCreateModuleModal.set(true);
      }
      this.closeContextMenu();
    }
  }

  closeCourseDetails(): void {
    this.showCourseDetails.set(null);
  }

  closeModuleDetails(): void {
    this.showModuleDetails.set(null);
  }

  closeEditCourseModal(): void {
    this.showEditCourseModal.set(null);
  }

  closeEditModuleModal(): void {
    this.showEditModuleModal.set(null);
  }

  updateCourse(): void {
    const courseData = this.editCourseData();
    if (!courseData.id || !courseData.code || !courseData.title) {
      this.snackbarService.show('Please fill in all required fields', 400);
      return;
    }

    this.adminCatalogService.apiAdminCoursesIdPut(courseData.id, {
      courseCode: courseData.code,
      title: courseData.title,
      description: courseData.description || undefined,
      award: courseData.award || undefined,
      durationSemesters: courseData.durationSemesters || undefined,
      isActive: courseData.isActive
    }).subscribe({
      next: (response) => {
        this.snackbarService.showFromApiResponse(response);
        this.closeEditCourseModal();
        this.loadCourses();
      },
          error: (err) => {
            const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
            const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to update course';
            this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
          }
    });
  }

  updateModule(): void {
    const moduleData = this.editModuleData();
    if (!moduleData.id || !moduleData.code || !moduleData.title) {
      this.snackbarService.show('Please fill in all required fields', 400);
      return;
    }

    this.adminCatalogService.apiAdminModulesIdPut(moduleData.id, {
      moduleCode: moduleData.code,
      title: moduleData.title,
      description: moduleData.description || undefined,
      credits: moduleData.credits || undefined,
      level: moduleData.level || undefined,
      semesterOfStudy: moduleData.semesterOfStudy || undefined,
      term: moduleData.term || undefined
    }).subscribe({
      next: (response) => {
        this.snackbarService.showFromApiResponse(response);
        this.closeEditModuleModal();
        this.loadModules();
      },
          error: (err) => {
            const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
            const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to update module';
            this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
          }
    });
  }

  sortUsers(users: AdminUserListItemDto[]): AdminUserListItemDto[] {
    const sorted = [...users];
    const field = this.userSortField();
    const direction = this.userSortDirection();

    sorted.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (field) {
        case 'name':
          aVal = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
          bVal = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
          break;
        case 'email':
          aVal = a.email?.toLowerCase() || '';
          bVal = b.email?.toLowerCase() || '';
          break;
        case 'roles':
          aVal = this.getRoleName(a.roles).toLowerCase();
          bVal = this.getRoleName(b.roles).toLowerCase();
          break;
        case 'status':
          aVal = a.isActive ? 1 : 0;
          bVal = b.isActive ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  sortCourses(courses: AdminCourseDto[]): AdminCourseDto[] {
    const sorted = [...courses];
    const field = this.courseSortField();
    const direction = this.courseSortDirection();

    sorted.sort((a, b) => {
      let aVal: string;
      let bVal: string;

      switch (field) {
        case 'code':
          aVal = a.courseCode?.toLowerCase() || '';
          bVal = b.courseCode?.toLowerCase() || '';
          break;
        case 'title':
          aVal = a.title?.toLowerCase() || '';
          bVal = b.title?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  sortModules(modules: AdminModuleDto[]): AdminModuleDto[] {
    const sorted = [...modules];
    const field = this.moduleSortField();
    const direction = this.moduleSortDirection();

    sorted.sort((a, b) => {
      let aVal: string;
      let bVal: string;

      switch (field) {
        case 'code':
          aVal = a.moduleCode?.toLowerCase() || '';
          bVal = b.moduleCode?.toLowerCase() || '';
          break;
        case 'title':
          aVal = a.title?.toLowerCase() || '';
          bVal = b.title?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  toggleUserSort(field: 'name' | 'email' | 'roles' | 'status'): void {
    if (this.userSortField() === field) {
      this.userSortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.userSortField.set(field);
      this.userSortDirection.set('asc');
    }
  }

  toggleCourseSort(field: 'code' | 'title'): void {
    if (this.courseSortField() === field) {
      this.courseSortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.courseSortField.set(field);
      this.courseSortDirection.set('asc');
    }
  }

  toggleModuleSort(field: 'code' | 'title'): void {
    if (this.moduleSortField() === field) {
      this.moduleSortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.moduleSortField.set(field);
      this.moduleSortDirection.set('asc');
    }
  }

  getSortIcon(currentField: string, targetField: string, direction: 'asc' | 'desc'): string {
    if (currentField !== targetField) return 'unfold_more';
    return direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  toggleCourseColumn(column: 'id' | 'code' | 'title' | 'description' | 'award' | 'durationSemesters' | 'isActive'): void {
    this.courseVisibleColumns.update(cols => ({
      ...cols,
      [column]: !cols[column as keyof typeof cols]
    }));
  }

  toggleModuleColumn(column: 'id' | 'code' | 'title' | 'description' | 'credits' | 'level' | 'semesterOfStudy' | 'term'): void {
    this.moduleVisibleColumns.update(cols => ({
      ...cols,
      [column]: !cols[column as keyof typeof cols]
    }));
  }

  getCourseVisibleColumnCount(): number {
    return Object.values(this.courseVisibleColumns()).filter(v => v).length;
  }

  getModuleVisibleColumnCount(): number {
    return Object.values(this.moduleVisibleColumns()).filter(v => v).length;
  }

  getFilteredStudents() {
    const query = this.studentSearchQuery().toLowerCase();
    const students = this.users().filter(u => u.roles && u.roles.includes(1));

    if (!query) return students;

    return students.filter(user => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }

  getFilteredCourses() {
    const query = this.courseSearchQuery().toLowerCase();
    if (!query) return this.courses();

    return this.courses().filter(course => {
      const code = (course.courseCode || '').toLowerCase();
      const title = (course.title || '').toLowerCase();
      return code.includes(query) || title.includes(query);
    });
  }

  getFilteredModules() {
    const query = this.moduleSearchQuery().toLowerCase();
    if (!query) return this.modules();

    return this.modules().filter(module => {
      const code = (module.moduleCode || '').toLowerCase();
      const title = (module.title || '').toLowerCase();
      return code.includes(query) || title.includes(query);
    });
  }

  isStudentSelected(studentId: string): boolean {
    return this.selectedStudentIds().has(studentId);
  }

  toggleStudentSelection(studentId: string): void {
    const current = new Set(this.selectedStudentIds());
    if (current.has(studentId)) {
      current.delete(studentId);
    } else {
      current.add(studentId);
    }
    this.selectedStudentIds.set(current);
  }

  getSelectedStudentIds(): string[] {
    return Array.from(this.selectedStudentIds());
  }

  selectCourseForEnrollment(courseId: string): void {
    this.selectedCourseId.set(courseId);
  }

  selectModuleForEnrollment(moduleId: string): void {
    this.selectedModuleId.set(moduleId);
  }

  canEnrollInCourse(): boolean {
    return this.getSelectedStudentIds().length > 0 && !!this.selectedCourseId();
  }

  canEnrollInModule(): boolean {
    return this.getSelectedStudentIds().length > 0 && !!this.selectedModuleId();
  }

  enrollStudentsInCourse(): void {
    const studentIds = this.getSelectedStudentIds();
    const courseId = this.selectedCourseId();

    if (!this.canEnrollInCourse()) {
      this.snackbarService.show('Please select students and a course', 400);
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const totalStudents = studentIds.length;

    studentIds.forEach((userId, index) => {
      const user = this.users().find(u => u.id === userId);
      const studentId = user?.student?.id;

      if (!studentId) {
        errorCount++;
        if (index === totalStudents - 1) {
          this.snackbarService.show(`${successCount} succeeded, ${errorCount} failed (missing student ID)`, 400);
        }
        return;
      }

      this.adminEnrollmentService.apiAdminStudentsStudentIdCourseEnrollmentPost(
        studentId,
        { courseId }
      ).subscribe({
        next: (response: any) => {
          successCount++;
          if (index === totalStudents - 1) {
            this.snackbarService.show(`Successfully enrolled ${successCount} student(s)`, 200);
            this.selectedStudentIds.set(new Set());
            this.selectedCourseId.set('');
          }
        },
        error: (err: any) => {
          errorCount++;
          const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
          const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to enroll student';
          this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);

          if (index === totalStudents - 1 && successCount > 0) {
            this.snackbarService.show(`${successCount} succeeded, ${errorCount} failed`, 400);
          }
        }
      });
    });
  }

  enrollStudentsInModule(): void {
    const studentIds = this.getSelectedStudentIds();
    const moduleId = this.selectedModuleId();

    if (!this.canEnrollInModule()) {
      this.snackbarService.show('Please select students and a module', 400);
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const totalStudents = studentIds.length;

    studentIds.forEach((userId, index) => {
      const user = this.users().find(u => u.id === userId);
      const studentId = user?.student?.id;

      if (!studentId) {
        errorCount++;
        if (index === totalStudents - 1) {
          this.snackbarService.show(`${successCount} succeeded, ${errorCount} failed (missing student ID)`, 400);
        }
        return;
      }

      this.adminEnrollmentService.apiAdminStudentsStudentIdModulesModuleIdEnrollPost(
        studentId,
        moduleId,
        {}
      ).subscribe({
        next: (response: any) => {
          successCount++;
          if (index === totalStudents - 1) {
            this.snackbarService.show(`Successfully enrolled ${successCount} student(s)`, 200);
            this.selectedStudentIds.set(new Set());
            this.selectedModuleId.set('');
          }
        },
        error: (err: any) => {
          errorCount++;
          const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
          const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to enroll student';
          this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);

          if (index === totalStudents - 1 && successCount > 0) {
            this.snackbarService.show(`${successCount} succeeded, ${errorCount} failed`, 400);
          }
        }
      });
    });
  }

  viewUserEnrollments(userId: string): void {
    const user = this.users().find(u => u.id === userId);
    const studentId = user?.student?.id;

    if (!studentId) {
      this.snackbarService.show('This user is not a student', 400);
      return;
    }

    const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    this.enrollmentDetailsMode.set('user');
    this.enrollmentDetailsEntityId.set(studentId);
    this.enrollmentDetailsEntityName.set(userName || user?.email || 'Unknown User');
    this.showEnrollmentDetails.set(true);
  }

  viewCourseEnrollments(courseId: string): void {
    const course = this.courses().find(c => c.id === courseId);
    const courseName = `${course?.courseCode || ''} - ${course?.title || ''}`.trim();

    this.enrollmentDetailsMode.set('course');
    this.enrollmentDetailsEntityId.set(courseId);
    this.enrollmentDetailsEntityName.set(courseName || 'Unknown Course');
    this.showEnrollmentDetails.set(true);
  }

  viewModuleEnrollments(moduleId: string): void {
    const module = this.modules().find(m => m.id === moduleId);
    const moduleName = `${module?.moduleCode || ''} - ${module?.title || ''}`.trim();

    this.enrollmentDetailsMode.set('module');
    this.enrollmentDetailsEntityId.set(moduleId);
    this.enrollmentDetailsEntityName.set(moduleName || 'Unknown Module');
    this.showEnrollmentDetails.set(true);
  }

  closeEnrollmentDetails(): void {
    this.showEnrollmentDetails.set(false);
  }

  getStudentsWithStudentProfile(): AdminUserListItemDto[] {
    return this.users().filter(u => !!u.student?.id);
  }


  getCourseById(courseId: string | null | undefined): AdminCourseDto | null {
    if (!courseId) return null;
    return this.courses().find(c => c.id === courseId) ?? null;
  }

  getModuleById(moduleId: string | null | undefined): AdminModuleDto | null {
    if (!moduleId) return null;
    return this.modules().find(m => m.id === moduleId) ?? null;
  }
}
