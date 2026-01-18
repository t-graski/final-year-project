import {inject, Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {UserService} from './user.service';
import {NavLink} from '../shared/models/nav-link.model';

const ADMIN = 3;
const STAFF = 2;

@Injectable({providedIn: 'root'})
export class NavigationService {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);


  navigateToHomeDashboard(): void {
    const user = this.userService.getCurrentUser();

    if (user?.roles?.includes(ADMIN)) {
      void this.router.navigateByUrl('/admin');
    } else if (user?.roles?.includes(STAFF)) {
      void this.router.navigateByUrl('/staff');
    } else {
      void this.router.navigateByUrl('/dashboard');
    }
  }

  getNavigationLinks(): NavLink[] {
    const user = this.userService.getCurrentUser();

    if (user?.roles?.includes(ADMIN)) {
      return [
        {label: 'Dashboard', path: '/admin', icon: 'admin_panel_settings'},
        {label: 'Users', path: '/admin', icon: 'people'},
        {label: 'Courses', path: '/admin', icon: 'school'},
        {label: 'Modules', path: '/admin', icon: 'menu_book'}
      ];
    } else if (user?.roles?.includes(STAFF)) {
      return [
        {label: 'Dashboard', path: '/staff', icon: 'dashboard'},
        {label: 'Students', path: '/staff/students', icon: 'people'},
        {label: 'Modules', path: '/staff', icon: 'menu_book'}
      ];
    } else {
      return [
        {label: 'Dashboard', path: '/dashboard', icon: 'home'},
        {label: 'My Courses', path: '/dashboard', icon: 'school'},
        {label: 'Attendance', path: '/attendance', icon: 'how_to_reg'}
      ];
    }
  }

  getHomeDashboardPath(): string {
    const user = this.userService.getCurrentUser();

    if (user?.roles?.includes(ADMIN)) {
      return '/admin';
    } else if (user?.roles?.includes(STAFF)) {
      return '/staff';
    } else {
      return '/dashboard';
    }
  }
}
