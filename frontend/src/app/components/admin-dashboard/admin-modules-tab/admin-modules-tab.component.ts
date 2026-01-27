import {Component, inject, signal, input, output, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {AdminCatalogService} from '../../../api/api/adminCatalog.service';
import {SnackbarService} from '../../../services/snackbar.service';
import {AdminModuleDto} from '../../../api/model/adminModuleDto';
import {AdminCourseDto} from '../../../api/model/adminCourseDto';
import {DynamicTableComponent, TableColumn, TableAction} from '../../dynamic-table/dynamic-table.component';
import {FormsModule} from '@angular/forms';
import {HasPermissionDirective} from '../../../directives/has-permission.directive';

@Component({
  selector: 'app-admin-modules-tab',
  standalone: true,
  imports: [CommonModule, MatIconModule, DynamicTableComponent, FormsModule, HasPermissionDirective],
  templateUrl: './admin-modules-tab.component.html',
  styleUrl: './admin-modules-tab.component.scss'
})
export class AdminModulesTabComponent implements OnInit {
  private readonly adminCatalogService = inject(AdminCatalogService);
  private readonly snackbarService = inject(SnackbarService);

  courses = input.required<AdminCourseDto[]>();

  isLoading = signal(false);
  modules = signal<AdminModuleDto[]>([]);
  selectedCourseId = signal<string>('');
  showModuleDetails = signal<string | null>(null);
  showCreateModuleModal = signal<boolean>(false);
  showEditModuleModal = signal<string | null>(null);

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

  moduleColumns: TableColumn<AdminModuleDto>[] = [
    {key: 'id', label: 'ID', visible: false, cellClass: 'cell-id'},
    {key: 'moduleCode', label: 'Code', sortable: true, visible: true},
    {key: 'title', label: 'Title', sortable: true, visible: true},
    {key: 'description', label: 'Description', visible: true, cellClass: 'cell-description'},
    {key: 'credits', label: 'Credits', visible: true},
    {key: 'level', label: 'Level', visible: true},
    {key: 'semesterOfStudy', label: 'Semester', visible: true},
    {key: 'term', label: 'Term', visible: true}
  ];

  moduleActions: TableAction<AdminModuleDto>[] = [
    {
      icon: 'visibility',
      label: 'View Details',
      handler: (module) => this.showModuleDetails.set(module.id!),
      requiredPermission: 'CatalogRead'
    },
    {
      icon: 'people',
      label: 'View Enrolled Students',
      handler: (module) => this.viewModuleEnrollments(module.id!),
      requiredPermission: 'EnrollmentRead'
    },
    {
      icon: 'edit',
      label: 'Edit Module',
      handler: (module) => this.editModule(module),
      requiredPermission: 'CatalogWrite'
    },
    {
      icon: 'content_copy',
      label: 'Clone Module',
      handler: (module) => this.cloneModule(module),
      requiredPermission: 'CatalogWrite'
    },
    {
      divider: true, icon: '', label: '', handler: () => {
      }
    },
    {
      icon: 'delete',
      label: 'Delete Module',
      danger: true,
      handler: (module) => this.deleteModule(module.id!),
      requiredPermission: 'CatalogDelete'
    }
  ];

  // Events to parent
  viewEnrollments = output<string>();

  ngOnInit(): void {
    if (this.courses().length > 0 && !this.selectedCourseId()) {
      this.selectedCourseId.set(this.courses()[0].id || '');
      this.loadModules();
    }
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
        this.modules.set([]);
        this.isLoading.set(false);
      }
    });
  }

  reloadModules(): void {
    this.loadModules();
  }

  viewModuleEnrollments(moduleId: string): void {
    this.viewEnrollments.emit(moduleId);
  }

  closeModuleDetails(): void {
    this.showModuleDetails.set(null);
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
      code: `${module.moduleCode}-COPY`,
      title: `${module.title} (Copy)`,
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

  deleteModule(moduleId: string): void {
    if (!confirm('Are you sure you want to delete this module? This action cannot be undone.')) return;

    if (!this.selectedCourseId()) {
      this.snackbarService.show('Course ID is missing', 400);
      return;
    }

    // TODO: Fix API method name
    this.snackbarService.show('Delete module feature temporarily disabled during refactoring', 400);
    /*
    this.adminCatalogService.apiAdminCoursesCourseIdModulesModuleIdDelete(
      this.selectedCourseId(),
      moduleId
    ).subscribe({
      next: (response: any) => {
        this.snackbarService.showFromApiResponse(response);
        this.loadModules();
      },
      error: (err: any) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to delete module';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
      }
    });
    */
  }

  openCreateModuleModal(): void {
    this.showCreateModuleModal.set(true);
  }

  closeCreateModuleModal(): void {
    this.showCreateModuleModal.set(false);
  }

  closeEditModuleModal(): void {
    this.showEditModuleModal.set(null);
  }

  createModule(): void {
    const module = this.newModule();
    if (!module.code || !module.title) {
      this.snackbarService.show('Please fill required fields', 400);
      return;
    }

    if (!this.selectedCourseId()) {
      this.snackbarService.show('Please select a course', 400);
      return;
    }

    this.adminCatalogService.apiAdminCoursesCourseIdModulesPost(
      this.selectedCourseId(),
      {
        moduleCode: module.code,
        title: module.title,
        description: module.description,
        credits: module.credits,
        level: module.level,
        semesterOfStudy: module.semesterOfStudy,
        term: module.term
      }
    ).subscribe({
      next: (response) => {
        this.snackbarService.showFromApiResponse(response);
        this.closeCreateModuleModal();
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
        this.loadModules();
      },
      error: (err) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to create module';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
      }
    });
  }

  updateModule(): void {
    const module = this.editModuleData();
    if (!module.code || !module.title) {
      this.snackbarService.show('Please fill required fields', 400);
      return;
    }

    if (!this.selectedCourseId()) {
      this.snackbarService.show('Course ID is missing', 400);
      return;
    }

    // TODO: Fix API method name
    this.snackbarService.show('Update module feature temporarily disabled during refactoring', 400);
    /*
    this.adminCatalogService.apiAdminCoursesCourseIdModulesModuleIdPut(
      this.selectedCourseId(),
      module.id,
      {
        moduleCode: module.code,
        title: module.title,
        description: module.description,
        credits: module.credits,
        level: module.level,
        semesterOfStudy: module.semesterOfStudy,
        term: module.term
      }
    ).subscribe({
      next: (response: any) => {
        this.snackbarService.showFromApiResponse(response);
        this.closeEditModuleModal();
        this.loadModules();
      },
      error: (err: any) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to update module';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
      }
    });
    */
  }
}
