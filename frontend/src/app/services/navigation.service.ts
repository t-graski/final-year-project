import {inject, Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {UserService} from './user.service';
import {PermissionService, Permission} from './permission.service';
import {NavLink} from '../shared/models/nav-link.model';

@Injectable({providedIn: 'root'})
export class NavigationService {
  private readonly userService = inject(UserService);
  private readonly permissionService = inject(PermissionService);
  private readonly router = inject(Router);


  navigateToHomeDashboard(): void {
    if (this.permissionService.$canAccessAdminDashboard()) {
      void this.router.navigateByUrl('/admin');
    } else {
      void this.router.navigateByUrl('/dashboard');
    }
  }

  getNavigationLinks(): NavLink[] {
    if (this.permissionService.$canAccessAdminDashboard()) {
      return [
        {label: 'Dashboard', path: '/admin', icon: 'admin_panel_settings'},
        {label: 'Users', path: '/admin', icon: 'people'},
        {label: 'Courses', path: '/admin', icon: 'school'},
        {label: 'Modules', path: '/admin', icon: 'menu_book'}
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
    if (this.permissionService.$canAccessAdminDashboard()) {
      return '/admin';
    } else {
      return '/dashboard';
    }
  }
}
