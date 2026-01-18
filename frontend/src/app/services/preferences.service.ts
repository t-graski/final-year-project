import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {UserPreferences, AdminTablePreferences} from '../shared/models/user-preferences.model';
import {Theme} from '../shared/models/theme.enum';
import {Page} from '../shared/models/page.enum';

const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: Theme.AUTO,
  defaultPage: Page.DASHBOARD,
  compactMode: false,
  showNotifications: true,
  customNavbar: false,
  selectedNavbarPages: [Page.DASHBOARD, Page.ATTENDANCE],
  emailNotifications: true,
  desktopNotifications: false,
  language: 'en'
};

const DEFAULT_ADMIN_TABLE_PREFERENCES: AdminTablePreferences = {
  visibleColumns: {
    users: ['email', 'firstName', 'lastName', 'roles', 'isActive'],
    courses: ['title', 'yearOfStudy', 'semester', 'credits'],
    modules: ['moduleCode', 'title', 'credits', 'semester'],
    enrollments: ['student', 'course', 'status', 'enrolledDate']
  },
  rowsPerPage: 25,
  sortPreferences: {}
};

@Injectable({providedIn: 'root'})
export class PreferencesService {
  private readonly preferencesSubject = new BehaviorSubject<UserPreferences>(DEFAULT_USER_PREFERENCES);
  private readonly adminTablePreferencesSubject = new BehaviorSubject<AdminTablePreferences>(DEFAULT_ADMIN_TABLE_PREFERENCES);

  readonly preferences$: Observable<UserPreferences> = this.preferencesSubject.asObservable();
  readonly adminTablePreferences$: Observable<AdminTablePreferences> = this.adminTablePreferencesSubject.asObservable();

  constructor() {
    this.loadPreferences();
  }

  private loadPreferences(): void {
    // TODO: Load from backend
    const storedPrefs = localStorage.getItem('userPreferences');
    if (storedPrefs) {
      try {
        const prefs = JSON.parse(storedPrefs);
        this.preferencesSubject.next({...DEFAULT_USER_PREFERENCES, ...prefs});
      } catch (e) {
        console.error('Failed to parse preferences', e);
      }
    }

    const storedAdminPrefs = localStorage.getItem('adminTablePreferences');
    if (storedAdminPrefs) {
      try {
        const prefs = JSON.parse(storedAdminPrefs);
        this.adminTablePreferencesSubject.next({...DEFAULT_ADMIN_TABLE_PREFERENCES, ...prefs});
      } catch (e) {
        console.error('Failed to parse admin preferences', e);
      }
    }
  }

  getPreferences(): UserPreferences {
    return this.preferencesSubject.value;
  }

  getAdminTablePreferences(): AdminTablePreferences {
    return this.adminTablePreferencesSubject.value;
  }

  updatePreferences(preferences: Partial<UserPreferences>): void {
    const updated = {...this.preferencesSubject.value, ...preferences};
    this.preferencesSubject.next(updated);
    localStorage.setItem('userPreferences', JSON.stringify(updated));
    // TODO: Sync with backend
  }

  updateAdminTablePreferences(preferences: Partial<AdminTablePreferences>): void {
    const updated = {...this.adminTablePreferencesSubject.value, ...preferences};
    this.adminTablePreferencesSubject.next(updated);
    localStorage.setItem('adminTablePreferences', JSON.stringify(updated));
    // TODO: Sync with backend
  }

  resetPreferences(): void {
    this.preferencesSubject.next(DEFAULT_USER_PREFERENCES);
    localStorage.removeItem('userPreferences');
  }

  resetAdminTablePreferences(): void {
    this.adminTablePreferencesSubject.next(DEFAULT_ADMIN_TABLE_PREFERENCES);
    localStorage.removeItem('adminTablePreferences');
  }

  applyTheme(theme: Theme): void {
    // TODO: Implement theme switching logic
    this.updatePreferences({theme});
    console.log('Theme applied:', theme);
  }
}
