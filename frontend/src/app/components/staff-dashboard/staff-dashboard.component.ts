import {ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, OnInit, signal} from '@angular/core';
import {Card} from '../card/card';
import {MatIconModule} from '@angular/material/icon';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {UserService} from '../../services/user.service';
import {CommonModule} from '@angular/common';

interface StaffModule {
  moduleId: string;
  moduleCode: string;
  title: string;
  semester: number;
  yearOfStudy: number;
}

@Component({
  selector: 'app-staff-dashboard',
  templateUrl: './staff-dashboard.component.html',
  styleUrls: ['./staff-dashboard.component.scss'],
  imports: [CommonModule, Card, MatIconModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffDashboardComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  $staffName = signal<string>('Staff Member');
  $modules = signal<StaffModule[]>([]);
  $isLoading = signal(true);
  $searchQuery = signal('');

  $filteredModules = computed(() => {
    const mods = this.$modules();
    const query = this.$searchQuery().toLowerCase().trim();

    if (!mods.length || !query) {
      return mods;
    }

    return mods.filter(module =>
      module.title?.toLowerCase().includes(query) ||
      module.moduleCode?.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.$isLoading.set(true);

    this.userService.loadCurrentUser().subscribe({
      next: (user) => {
        if (user.firstName && user.lastName) {
          this.$staffName.set(`${user.firstName} ${user.lastName}`);
        } else if (user.email) {
          const emailName = user.email.split('@')[0];
          const formattedName = emailName
            .split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
          this.$staffName.set(formattedName);
        }

        this.$isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load staff dashboard:', err);
        this.$isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  navigateToStudentRecords(): void {
    console.log('Navigate to student records');
  }

  onSearchChange(value: string): void {
    this.$searchQuery.set(value);
  }

  onModuleClick(module: StaffModule): void {
    console.log('Module clicked:', module);
  }
}
