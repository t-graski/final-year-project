import {Component, inject, signal, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {AdminAuditService, LoginEventDto} from '../../../api';
import {SnackbarService} from '../../../services/snackbar.service';

@Component({
  selector: 'app-admin-login-audit-tab',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './admin-login-audit-tab.html',
  styleUrl: './admin-login-audit-tab.scss',
})
export class AdminLoginAuditTab implements OnInit {
  private readonly adminAuditService = inject(AdminAuditService);
  private readonly snackbarService = inject(SnackbarService);

  $isLoading = signal(false);
  $loginEvents = signal<LoginEventDto[]>([]);
  $showLoginEventDetails = signal<string | null>(null);

  $loginFilters = signal<LoginFilterOptions>(<LoginFilterOptions>{});

  ngOnInit(): void {
    this.loadLoginEvents();
  }

  loadLoginEvents(): void {
    this.$isLoading.set(true);
    const filters = this.$loginFilters();

    this.adminAuditService.apiAdminAuditLoginsGet(
      filters.actorUserId || undefined,
      undefined,
      undefined
    ).subscribe({
      next: (response) => {
        const loginData = response.data;
        if (Array.isArray(loginData)) {
          this.$loginEvents.set(loginData);
        } else {
          this.$loginEvents.set([]);
        }
        this.$isLoading.set(false);
      },
      error: (err) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to load login events';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
        this.$isLoading.set(false);
      }
    });
  }

  updateLoginFilter(key: keyof LoginFilterOptions, value: string): void {
    this.$loginFilters.update(filters => ({...filters, [key]: value}));
  }

  applyLoginFilters(): void {
    this.loadLoginEvents();
  }

  clearLoginFilters(): void {
    this.$loginFilters.set(<LoginFilterOptions>{});
    this.loadLoginEvents();
  }

  viewLoginEventDetails(eventId: string): void {
    this.$showLoginEventDetails.set(eventId);
  }

  closeLoginEventDetails(): void {
    this.$showLoginEventDetails.set(null);
  }

  formatLoginDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  }
}

type LoginFilterOptions = {
  actorUserId: string,
}
