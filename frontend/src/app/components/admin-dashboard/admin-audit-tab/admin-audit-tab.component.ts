import {Component, inject, signal, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {AdminAuditService} from '../../../api';
import {SnackbarService} from '../../../services/snackbar.service';
import {AuditEventDto} from '../../../api';

@Component({
  selector: 'app-admin-audit-tab',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './admin-audit-tab.component.html',
  styleUrl: './admin-audit-tab.component.scss'
})
export class AdminAuditTabComponent implements OnInit {
  private readonly adminAuditService = inject(AdminAuditService);
  private readonly snackbarService = inject(SnackbarService);

  $isLoading = signal(false);
  $auditEvents = signal<AuditEventDto[]>([]);
  $showAuditEventDetails = signal<string | null>(null);

  $auditFilters = signal<filterOptions>(<filterOptions>{});

  ngOnInit(): void {
    this.loadAuditEvents();
  }

  loadAuditEvents(): void {
    this.$isLoading.set(true);
    const filters = this.$auditFilters();

    this.adminAuditService.apiAdminAuditGet(
      filters.actorUserId || undefined,
      filters.entityType || undefined,
      filters.entityId || undefined,
      filters.action || undefined,
      filters.fromUtc || undefined,
      filters.toUtc || undefined
    ).subscribe({
      next: (response) => {
        const auditData = response.data;
        if (Array.isArray(auditData)) {
          this.$auditEvents.set(auditData);
        } else {
          this.$auditEvents.set([]);
        }
        this.$isLoading.set(false);
      },
      error: (err) => {
        const errorCode = err?.error?.error?.code || err?.error?.code || 'ERROR';
        const errorMessage = err?.error?.error?.message || err?.error?.message || 'Failed to load audit events';
        this.snackbarService.show(`${errorCode}: ${errorMessage}`, err?.status || 500);
        this.$isLoading.set(false);
      }
    });
  }

  updateAuditFilter(key: keyof filterOptions, value: string): void {
    this.$auditFilters.update(filters => ({...filters, [key]: value}));
  }

  applyAuditFilters(): void {
    this.loadAuditEvents();
  }

  clearAuditFilters(): void {
    this.$auditFilters.set(<filterOptions>{});
    this.loadAuditEvents();
  }

  viewAuditEventDetails(eventId: string): void {
    this.$showAuditEventDetails.set(eventId);
  }

  closeAuditEventDetails(): void {
    this.$showAuditEventDetails.set(null);
  }

  formatAuditDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  }

  getActionIcon(action: string | null | undefined): string {
    if (!action) return 'help_outline';
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('insert')) return 'add_circle';
    if (lowerAction.includes('update') || lowerAction.includes('edit')) return 'edit';
    if (lowerAction.includes('delete')) return 'delete';
    if (lowerAction.includes('login')) return 'login';
    if (lowerAction.includes('logout')) return 'logout';
    return 'info';
  }

  getActionColor(action: string | null | undefined): string {
    if (!action) return '';
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('insert')) return 'action-create';
    if (lowerAction.includes('update') || lowerAction.includes('edit')) return 'action-update';
    if (lowerAction.includes('delete')) return 'action-delete';
    if (lowerAction.includes('login')) return 'action-login';
    return '';
  }

  parseChangesJson(changesJson: string | null | undefined): any {
    if (!changesJson) return null;
    try {
      return JSON.parse(changesJson);
    } catch {
      return null;
    }
  }

  hasChanges(changesJson: string | null | undefined): boolean {
    const parsed = this.parseChangesJson(changesJson);
    return parsed !== null && Object.keys(parsed).length > 0;
  }

  getChangeFields(changesJson: string | null | undefined): string[] {
    const parsed = this.parseChangesJson(changesJson);
    if (!parsed || !parsed.Fields) return [];
    return Object.keys(parsed.Fields);
  }

  getChangeValue(changesJson: string | null | undefined, field: string): { Old: any, New: any } | null {
    const parsed = this.parseChangesJson(changesJson);
    if (!parsed || !parsed.Fields || !parsed.Fields[field]) return null;
    return parsed.Fields[field];
  }
}

type filterOptions = {
  actorUserId: string,
  entityType: string,
  entityId: string,
  action: string,
  fromUtc: string,
  toUtc: string,
}
