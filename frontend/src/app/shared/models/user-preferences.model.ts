import { Theme } from './theme.enum';
import { Page } from './page.enum';

export interface UserPreferences {
  theme: Theme;
  defaultPage: Page;
  compactMode: boolean;
  showNotifications: boolean;
  customNavbar: boolean;
  selectedNavbarPages: Page[];
  emailNotifications: boolean;
  desktopNotifications: boolean;
  language: string;
}

export interface AdminTablePreferences {
  visibleColumns: {
    users: string[];
    courses: string[];
    modules: string[];
    enrollments: string[];
  };
  rowsPerPage: number;
  sortPreferences: {
    [key: string]: {
      column: string;
      direction: 'asc' | 'desc';
    };
  };
}
