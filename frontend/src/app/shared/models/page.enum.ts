export enum Page {
  DASHBOARD = 'dashboard',
  STAFF_DASHBOARD = 'staff',
  ADMIN_DASHBOARD = 'admin',
  ATTENDANCE = 'attendance',
  PROFILE = 'profile',
  SETTINGS = 'settings'
}

export const PAGE_ROUTES: Record<Page, string> = {
  [Page.DASHBOARD]: '/dashboard',
  [Page.STAFF_DASHBOARD]: '/staff',
  [Page.ADMIN_DASHBOARD]: '/admin',
  [Page.ATTENDANCE]: '/attendance',
  [Page.PROFILE]: '/profile',
  [Page.SETTINGS]: '/settings'
};

export function getPageRoute(page: Page): string | null {
  return PAGE_ROUTES[page] || null;
}

export function isValidPage(pageKey: string): boolean {
  return Object.values(Page).includes(pageKey as Page);
}
