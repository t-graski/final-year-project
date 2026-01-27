import {Component, inject, signal, output, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {AdminCatalogService, CreateCourseDto} from '../../../api';
import {SnackbarService} from '../../../services/snackbar.service';
import {AdminCourseDto} from '../../../api';
import {DynamicTableComponent, TableColumn, TableAction} from '../../dynamic-table/dynamic-table.component';
import {FormsModule} from '@angular/forms';
import {Permission} from '../../../services/permission.service';
import {HasPermissionDirective} from '../../../directives/has-permission.directive';

@Component({
  selector: 'app-admin-courses-tab',
  standalone: true,
  imports: [CommonModule, MatIconModule, DynamicTableComponent, FormsModule, HasPermissionDirective],
  templateUrl: './admin-courses-tab.component.html',
  styleUrl: './admin-courses-tab.component.scss'
})
export class AdminCoursesTabComponent implements OnInit {
  private readonly adminCatalogService = inject(AdminCatalogService);
  private readonly snackbarService = inject(SnackbarService);

  // Expose Permission enum to template
  protected readonly Permission = Permission;

  $isLoading = signal(false);
  $courses = signal<AdminCourseDto[]>([]);
  $showCourseDetails = signal<string | null>(null);
  $showCreateCourseModal = signal<boolean>(false);
  $showEditCourseModal = signal<string | null>(null);

  $newCourse = signal<AdminCourseDto>({});

  $editCourseData = signal<AdminCourseDto>({});

  courseColumns: TableColumn<AdminCourseDto>[] = [
    {key: 'id', label: 'ID', visible: false, cellClass: 'cell-id'},
    {key: 'courseCode', label: 'Code', sortable: true, visible: true},
    {key: 'title', label: 'Title', sortable: true, visible: true},
    {key: 'description', label: 'Description', visible: true, cellClass: 'cell-description'},
    {key: 'award', label: 'Award', visible: true},
    {key: 'durationSemesters', label: 'Duration', visible: true},
    {
      key: 'isActive',
      label: 'Status',
      visible: true,
      render: (course) => course.isActive ? 'Active' : 'Inactive'
    }
  ];

  courseActions: TableAction<AdminCourseDto>[] = [
    {
      icon: 'visibility',
      label: 'View Details',
      handler: (course) => this.$showCourseDetails.set(course.id!),
      requiredPermission: Permission.CatalogRead
    },
    {
      icon: 'people',
      label: 'View Enrolled Students',
      handler: (course) => this.viewCourseEnrollments(course.id!),
      requiredPermission: Permission.EnrollmentRead
    },
    {
      icon: 'edit',
      label: 'Edit Course',
      handler: (course) => this.editCourse(course),
      requiredPermission: Permission.CatalogWrite
    },
    {
      icon: 'content_copy',
      label: 'Clone Course',
      handler: (course) => this.cloneCourse(course),
      requiredPermission: Permission.CatalogWrite
    },
    {
      divider: true, icon: '', label: '', handler: () => {
      }
    },
    {
      icon: 'delete',
      label: 'Delete Course',
      danger: true,
      handler: (course) => this.deleteCourse(course.id!),
      requiredPermission: Permission.CatalogDelete
    }
  ];

  $viewEnrollments = output<string>();

  ngOnInit(): void {
    this.loadCourses();
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
      error: (err) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to load courses';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
        this.$isLoading.set(false);
      }
    });
  }

  reloadCourses(): void {
    this.loadCourses();
  }

  viewCourseEnrollments(courseId: string): void {
    this.$viewEnrollments.emit(courseId);
  }

  closeCourseDetails(): void {
    this.$showCourseDetails.set(null);
  }

  editCourse(course: AdminCourseDto): void {
    this.$editCourseData.set({
      id: course.id || '',
      courseCode: course.courseCode || '',
      title: course.title || '',
      description: course.description || '',
      award: course.award || '',
      durationSemesters: course.durationSemesters || 0,
      isActive: course.isActive ?? true
    });
    this.$showEditCourseModal.set(course.id!);
  }

  cloneCourse(course: AdminCourseDto): void {
    this.$newCourse.set({
      id: `${course.id}-COPY`,
      courseCode: `${course.courseCode}-COPY`,
      title: `${course.title} (Copy)`,
      description: course.description || '',
      award: course.award || '',
      durationSemesters: course.durationSemesters || 0,
      isActive: true
    });
    this.$showCreateCourseModal.set(true);
  }

  deleteCourse(courseId: string): void {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

    this.adminCatalogService.apiAdminCoursesIdDelete(courseId).subscribe({
      next: (response: any) => {
        this.snackbarService.showFromApiResponse(response);
        this.loadCourses();
      },
      error: (err: any) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to delete course';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
      }
    });
  }

  openCreateCourseModal(): void {
    this.$showCreateCourseModal.set(true);
  }

  closeCreateCourseModal(): void {
    this.$showCreateCourseModal.set(false);
  }

  closeEditCourseModal(): void {
    this.$showEditCourseModal.set(null);
  }

  createCourse(): void {
    const course = this.$newCourse();
    if (!course.courseCode || !course.title) {
      this.snackbarService.show('Please fill required fields', 400);
      return;
    }

    this.adminCatalogService.apiAdminCoursesPost({
      courseCode: course.courseCode,
      title: course.title,
      description: course.description,
      award: course.award,
      durationSemesters: course.durationSemesters,
      isActive: course.isActive
    }).subscribe({
      next: (response) => {
        this.snackbarService.showFromApiResponse(response);
        this.closeCreateCourseModal();
        this.$newCourse.set({
          id: '',
          courseCode: '',
          title: '',
          description: '',
          award: '',
          durationSemesters: 0,
          isActive: true
        });
        this.loadCourses();
      },
      error: (err) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to create course';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
      }
    });
  }

  updateCourse(): void {
    const course = this.$editCourseData();
    if (!course.courseCode || !course.title) {
      this.snackbarService.show('Please fill required fields', 400);
      return;
    }

    this.snackbarService.show('Update course feature temporarily disabled during refactoring', 400);
    this.adminCatalogService.apiAdminCoursesIdPut(course.id!, {
      courseCode: course.courseCode,
      title: course.title,
      description: course.description,
      award: course.award,
      durationSemesters: course.durationSemesters,
      isActive: course.isActive
    }).subscribe({
      next: (response: any) => {
        this.snackbarService.showFromApiResponse(response);
        this.closeEditCourseModal();
        this.loadCourses();
      },
      error: (err: any) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to update course';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
      }
    });
  }
}
