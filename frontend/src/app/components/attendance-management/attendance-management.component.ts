import {Component, computed, signal} from '@angular/core';
import {NavLink} from '../../shared/models/nav-link.model';
import {Navbar} from '../navbar/navbar';
import {Card} from '../card/card';
import {MatIconModule} from '@angular/material/icon';
import {ProgressBar} from '../progress-bar/progress-bar';
import {AttendanceColorPipe} from '../../shared/pipes/attendance-color-pipe';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  imports: [
    Navbar,
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
  headline = "Student Dashboard";
  subHeadline = "Welcome back, John Doe";

  navLinks: NavLink[] = [
    {label: "Logout", path: "/", icon: "logout"}
  ];

  toggleOptions = [
    {id: 'my-courses', label: 'My Courses'},
    {id: 'global', label: 'Global'}
  ];

  activeToggle: string = this.toggleOptions[0].id;

  setActive(id: string) {
    this.activeToggle = id;
  }

  students = [
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
  ]

  searchText = signal<string>("");

  filteredStudents = computed(() => {
    const search = this.searchText().trim().toLowerCase();

    if (!search) return this.students;

    console.log(this.searchText())
    console.log(this.students[0].name.toLowerCase().includes("j"))

    return this.students.filter(s => {
      return s.name.toLowerCase().includes(this.searchText().toLowerCase()) ||
        s.id.toString().includes(this.searchText())
    });
  });
}
