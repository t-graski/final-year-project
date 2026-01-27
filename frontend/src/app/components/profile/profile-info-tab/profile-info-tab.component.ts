import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {UserService} from '../../../services/user.service';
import {UserDetailDto, Role} from '../../../api';

interface UserInfo {
  name: string;
  email: string;
  course?: string;
  yearOfStudy?: number;
  semester?: number;
  studentNumber?: string;
  staffNumber?: string;
  roles: string[];
  modules?: Array<{ code: string; name: string; }>;
  attendanceRate?: number;
}

@Component({
  selector: 'app-profile-info-tab',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './profile-info-tab.component.html',
  styleUrl: './profile-info-tab.component.scss'
})
export class ProfileInfoTabComponent implements OnInit {
  private readonly userService = inject(UserService);

  userInfo = signal<UserInfo | null>(null);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadUserInfo();
  }

  private loadUserInfo(): void {
    this.isLoading.set(true);

    this.userService.loadCurrentUser().subscribe({
      next: (user) => {
        this.userInfo.set(this.mapUserToInfo(user));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load user info', err);
        this.isLoading.set(false);
      }
    });
  }

  private mapUserToInfo(user: UserDetailDto): UserInfo {
    // Mock data - TODO: Replace with actual API data
    const roles = this.getRoleNames(user.roles);
    const roleObjects = user.roles || [];

    const info: UserInfo = {
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
      email: user.email || 'N/A',
      roles,
      modules: this.getMockModules(roleObjects),
      attendanceRate: this.getMockAttendanceRate()
    };

    // Add student-specific info - check role.key
    if (roleObjects.some(r => r.key?.toLowerCase() === 'student')) {
      info.studentNumber = 'w1234567'; // Mock
      info.course = 'BSc Computer Science'; // Mock
      info.yearOfStudy = 2; // Mock
      info.semester = 1; // Mock
    }

    // Add staff-specific info - check role.key
    if (roleObjects.some(r => r.key?.toLowerCase() === 'staff') ||
        roleObjects.some(r => r.key?.toLowerCase() === 'admin')) {
      info.staffNumber = 's1001'; // Mock
    }

    return info;
  }

  private getRoleNames(roles: Role[] | null | undefined): string[] {
    if (!roles || roles.length === 0) return [];

    return roles
      .map(role => role.name)
      .filter((name): name is string => name != null && name.length > 0);
  }

  private getMockModules(roles: Role[]): Array<{ code: string; name: string; }> {
    // Mock module data
    if (roles.some(r => r.key?.toLowerCase() === 'student')) {
      return [
        {code: 'CS101', name: 'Introduction to Programming'},
        {code: 'CS201', name: 'Data Structures'},
        {code: 'CS301', name: 'Algorithms'},
        {code: 'MATH201', name: 'Discrete Mathematics'}
      ];
    } else if (roles.some(r => r.key?.toLowerCase() === 'staff')) {
      return [
        {code: 'CS101', name: 'Introduction to Programming'},
        {code: 'CS401', name: 'Advanced Algorithms'}
      ];
    }
    return [];
  }

  private getMockAttendanceRate(): number {
    // Mock attendance rate - TODO: Replace with actual data
    return Math.floor(Math.random() * 20) + 80; // 80-100%
  }

  getRoleBadgeClass(role: string): string {
    const roleMap: Record<string, string> = {
      'Student': 'profile-info-role-badge--student',
      'Staff': 'profile-info-role-badge--staff',
      'Admin': 'profile-info-role-badge--admin'
    };
    return roleMap[role] || '';
  }
}
