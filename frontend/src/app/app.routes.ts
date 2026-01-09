import {Routes} from '@angular/router';
import {Login} from './components/login/login';
import {authGuard} from './guards/auth.guard';
import {
  AttendanceManagement
} from './components/attendance-management/attendance-management.component';

export const routes: Routes = [
  {
    path: '',
    component: Login
  },
  {
    path: 'attendance',
    component: AttendanceManagement,
    canActivate: [authGuard]
  }
];
