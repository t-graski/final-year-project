import {Component, computed, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {NavLink} from '../../shared/models/nav-link.model';
import {Navbar} from '../navbar/navbar';
import {Card} from '../card/card';
import {MatIconModule} from '@angular/material/icon';
import {ProgressBar} from '../progress-bar/progress-bar';
import {AttendanceColorPipe} from '../../shared/pipes/attendance-color-pipe';
import {FormsModule} from '@angular/forms';
import {UserService} from '../../services/user.service';

type Student = {
  name: string;
  id: string;
  course: string;
  year: number;
  attendance: number;
  attendanceTrend: string;
  attendanceScore: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    Card,
    MatIconModule,
    ProgressBar,
    AttendanceColorPipe,
    FormsModule,
  ],
  templateUrl: './attendance-management.html',
  styleUrl: './attendance-management.component.scss',
})
export class AttendanceManagement {
  private readonly userService = inject(UserService);

  readonly currentUser = toSignal(this.userService.currentUser$);

  readonly welcomeMessage = computed(() => {
    const user = this.currentUser();
    return user?.email ? `Welcome back, ${user.email}` : 'Welcome back, Guest';
  });

  headline = "Student Dashboard";

  navLinks: NavLink[] = [];

  toggleOptions = signal([
    {id: 'my-courses', label: 'My Courses'},
    {id: 'global', label: 'Global'}
  ]);

  activeToggle = signal('my-courses');

  setActive(id: string) {
    this.activeToggle.set(id);
  }


  students = signal<Student[]>([
    {
      name: "John Doe",
      id: "w1988854",
      course: "Computer Science",
      year: 3,
      attendance: 92,
      attendanceTrend: "improving",
      attendanceScore: "Low Risk"
    },
    {
      name: "Jane Smith",
      id: "w1988855",
      course: "Information Technology",
      year: 2,
      attendance: 76,
      attendanceTrend: "declining",
      attendanceScore: "Medium Risk"
    },
    {
      name: "Alice Johnson",
      id: "w1988856",
      course: "Software Engineering",
      year: 1,
      attendance: 58,
      attendanceTrend: "declining",
      attendanceScore: "High Risk"
    }
  ]);

  searchText = signal<string>("");

  filteredStudents = computed<Array<Student>>(() => {
    const search = this.searchText().trim().toLowerCase();

    if (!search) return this.students();

    return this.students().filter(s => {
      return s.name.toLowerCase().includes(search) ||
        s.id.toString().includes(search);
    });
  });
}

