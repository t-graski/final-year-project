import {Routes} from '@angular/router';
import {Login} from './components/login/login';
import {authGuard} from './guards/auth.guard';
import {adminGuard} from './guards/admin.guard';
import {
  AttendanceManagement
} from './components/attendance-management/attendance-management.component';
import {
  StudentDashboardComponent
} from './components/student-dashboard/student-dashboard.component';
import {AdminDashboardComponent} from './components/admin-dashboard/admin-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: Login
  },
  {
    path: 'attendance',
    component: AttendanceManagement,
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    component: StudentDashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [authGuard, adminGuard]
  }
];
