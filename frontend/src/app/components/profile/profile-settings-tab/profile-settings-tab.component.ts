import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {PreferencesService} from '../../../services/preferences.service';
import {UserService} from '../../../services/user.service';
import {Theme} from '../../../shared/models/theme.enum';
import {Page, isValidPage} from '../../../shared/models/page.enum';
import {UserPreferences, AdminTablePreferences} from '../../../shared/models/user-preferences.model';

@Component({
  selector: 'app-profile-settings-tab',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './profile-settings-tab.component.html',
  styleUrl: './profile-settings-tab.component.scss'
})
export class ProfileSettingsTabComponent implements OnInit {
  private readonly preferencesService = inject(PreferencesService);
  private readonly userService = inject(UserService);

  $preferences = signal<UserPreferences | null>(null);
  $adminTablePreferences = signal<AdminTablePreferences | null>(null);
  $isAdmin = signal(false);

  readonly Theme = Theme;
  readonly Page = Page;

  availablePages = signal<Page[]>([]);
  availableLanguages = [
    {code: 'en', name: 'English'},
    {code: 'de', name: 'German'}
  ];

  ngOnInit(): void {
    this.loadPreferences();
    this.checkUserRole();
    this.setAvailablePages();
  }

  private loadPreferences(): void {
    const prefs = this.preferencesService.getPreferences();
    this.$preferences.set(prefs);

    const adminPrefs = this.preferencesService.getAdminTablePreferences();
    this.$adminTablePreferences.set(adminPrefs);
  }

  private checkUserRole(): void {
    const user = this.userService.getCurrentUser();
    this.$isAdmin.set(user?.roles?.includes(3) || false);
  }

  private setAvailablePages(): void {
    const user = this.userService.getCurrentUser();
    const roles = user?.roles || [];

    const pages: Page[] = [];

    if (roles.includes(1)) {
      pages.push(Page.DASHBOARD, Page.ATTENDANCE);
    }
    if (roles.includes(2)) {
      pages.push(Page.STAFF_DASHBOARD);
    }
    if (roles.includes(3)) {
      pages.push(Page.ADMIN_DASHBOARD);
    }
    pages.push(Page.PROFILE);

    this.availablePages.set(pages);
  }

  onThemeChange(theme: Theme): void {
    this.preferencesService.updatePreferences({theme});
    this.preferencesService.applyTheme(theme);
    this.$preferences.set(this.preferencesService.getPreferences());
  }

  onDefaultPageChange(page: Page): void {
    if (isValidPage(page)) {
      this.preferencesService.updatePreferences({defaultPage: page});
      this.$preferences.set(this.preferencesService.getPreferences());
    }
  }

  onShowNotificationsChange(showNotifications: boolean): void {
    this.preferencesService.updatePreferences({showNotifications});
    this.$preferences.set(this.preferencesService.getPreferences());
  }

  onEmailNotificationsChange(emailNotifications: boolean): void {
    this.preferencesService.updatePreferences({emailNotifications});
    this.$preferences.set(this.preferencesService.getPreferences());
  }

  onDesktopNotificationsChange(desktopNotifications: boolean): void {
    this.preferencesService.updatePreferences({desktopNotifications});
    this.$preferences.set(this.preferencesService.getPreferences());
  }

  onLanguageChange(language: string): void {
    this.preferencesService.updatePreferences({language});
    this.$preferences.set(this.preferencesService.getPreferences());
  }

  onCustomNavbarChange(customNavbar: boolean): void {
    this.preferencesService.updatePreferences({customNavbar});
    this.$preferences.set(this.preferencesService.getPreferences());
  }

  onNavbarPageToggle(page: Page): void {
    const prefs = this.$preferences();
    if (!prefs) return;

    const selected = [...prefs.selectedNavbarPages];
    const index = selected.indexOf(page);

    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(page);
    }

    this.preferencesService.updatePreferences({selectedNavbarPages: selected});
    this.$preferences.set(this.preferencesService.getPreferences());
  }

  isPageSelected(page: Page): boolean {
    return this.$preferences()?.selectedNavbarPages.includes(page) || false;
  }

  onTableColumnToggle(table: string, column: string): void {
    const adminPrefs = this.$adminTablePreferences();
    if (!adminPrefs) return;

    const visibleColumns = {...adminPrefs.visibleColumns};
    const tableColumns = [...(visibleColumns[table as keyof typeof visibleColumns] || [])];
    const index = tableColumns.indexOf(column);

    if (index > -1) {
      tableColumns.splice(index, 1);
    } else {
      tableColumns.push(column);
    }

    visibleColumns[table as keyof typeof visibleColumns] = tableColumns as any;
    this.preferencesService.updateAdminTablePreferences({visibleColumns});
    this.$adminTablePreferences.set(this.preferencesService.getAdminTablePreferences());
  }

  isColumnVisible(table: string, column: string): boolean {
    const adminPrefs = this.$adminTablePreferences();
    if (!adminPrefs) return false;

    const tableColumns = adminPrefs.visibleColumns[table as keyof typeof adminPrefs.visibleColumns];
    return tableColumns?.includes(column) || false;
  }

  onRowsPerPageChange(rowsPerPage: number): void {
    this.preferencesService.updateAdminTablePreferences({rowsPerPage});
    this.$adminTablePreferences.set(this.preferencesService.getAdminTablePreferences());
  }

  resetSettings(): void {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      this.preferencesService.resetPreferences();
      this.$preferences.set(this.preferencesService.getPreferences());

      if (this.$isAdmin()) {
        this.preferencesService.resetAdminTablePreferences();
        this.$adminTablePreferences.set(this.preferencesService.getAdminTablePreferences());
      }
    }
  }

  getPageLabel(page: Page): string {
    const labels: Record<Page, string> = {
      [Page.DASHBOARD]: 'Student Dashboard',
      [Page.STAFF_DASHBOARD]: 'Staff Dashboard',
      [Page.ADMIN_DASHBOARD]: 'Admin Dashboard',
      [Page.ATTENDANCE]: 'Attendance',
      [Page.PROFILE]: 'Profile',
      [Page.SETTINGS]: 'Settings'
    };
    return labels[page] || page;
  }

  getAvailableTableColumns(): Record<string, Array<{ key: string; label: string }>> {
    return {
      users: [
        {key: 'email', label: 'Email'},
        {key: 'firstName', label: 'First Name'},
        {key: 'lastName', label: 'Last Name'},
        {key: 'roles', label: 'Roles'},
        {key: 'isActive', label: 'Active Status'},
        {key: 'createdAt', label: 'Created Date'}
      ],
      courses: [
        {key: 'title', label: 'Course Title'},
        {key: 'yearOfStudy', label: 'Year'},
        {key: 'semester', label: 'Semester'},
        {key: 'credits', label: 'Credits'},
        {key: 'department', label: 'Department'}
      ],
      modules: [
        {key: 'moduleCode', label: 'Module Code'},
        {key: 'title', label: 'Title'},
        {key: 'credits', label: 'Credits'},
        {key: 'semester', label: 'Semester'},
        {key: 'lecturer', label: 'Lecturer'}
      ],
      enrollments: [
        {key: 'student', label: 'Student'},
        {key: 'course', label: 'Course'},
        {key: 'status', label: 'Status'},
        {key: 'enrolledDate', label: 'Enrolled Date'},
        {key: 'completedDate', label: 'Completed Date'}
      ]
    };
  }
}
