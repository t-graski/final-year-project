import {Component, signal, computed, input, model, output, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {Permission, PermissionService} from '../../services/permission.service';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  visible?: boolean;
  render?: (item: T) => string;
  cellClass?: string;
}

export interface TableAction<T = any> {
  icon: string;
  label: string;
  handler: (item: T) => void;
  danger?: boolean;
  divider?: boolean;
  requiredPermission?: Permission | Permission[];
  hidden?: boolean;
}

@Component({
  selector: 'app-dynamic-table',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './dynamic-table.component.html',
  styleUrl: './dynamic-table.component.scss'
})
export class DynamicTableComponent<T extends Record<string, any>> {
  private readonly permissionService = inject(PermissionService);

  $data = input<T[]>([]);
  $columns = model<TableColumn<T>[]>([]);

  $actions = input<TableAction<T>[]>([]);
  $searchPlaceholder = input<string>("Search...");
  $emptyMessage = input<string>("No data found");
  $loading = input<boolean>(false);

  $contextMenuAction = output<{ action: TableAction<T>, item: T }>();
  $reload = output<void>();

  $searchQuery = signal('');
  $sortField = signal<string | null>(null);
  $sortDirection = signal<'asc' | 'desc'>('asc');
  $showColumnSelector = signal(false);

  $contextMenuPosition = signal<{ x: number, y: number } | null>(null);
  $contextMenuItem = signal<T | null>(null);

  $showDeleteConfirmation = signal(false);
  $deleteConfirmationMessage = signal('');
  pendingDeleteAction: (() => void) | null = null;

  // Computed filtered actions based on permissions
  $filteredActions = computed(() => {
    return this.$actions().filter(action => {
      if (action.hidden) return false;
      if (action.divider) return true;
      if (!action.requiredPermission) return true;

      const permissions = Array.isArray(action.requiredPermission)
        ? action.requiredPermission
        : [action.requiredPermission];

      return this.permissionService.hasAnyPermission(...permissions);
    });
  });

  $visibleColumns = computed(() =>
    this.$columns().filter(col => col.visible !== false)
  );

  $filteredData = computed(() => {
    let filtered = this.$data();
    const query = this.$searchQuery().toLowerCase();

    if (query) {
      filtered = filtered.filter(item => {
        return this.$visibleColumns().some(col => {
          const value = item[col.key];
          if (value == null) return false;
          return String(value).toLowerCase().includes(query);
        });
      });
    }

    return this.sortData(filtered);
  });

  sortData(data: T[]): T[] {
    const field = this.$sortField();
    if (!field) return data;

    const direction = this.$sortDirection();
    const sorted = [...data];

    sorted.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (aStr < bStr) return direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  toggleSort(column: TableColumn<T>): void {
    if (!column.sortable) return;

    if (this.$sortField() === column.key) {
      this.$sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.$sortField.set(column.key);
      this.$sortDirection.set('asc');
    }
  }

  getSortIcon(column: TableColumn<T>): string {
    if (!column.sortable) return '';
    if (this.$sortField() !== column.key) return 'unfold_more';
    return this.$sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  toggleColumn(column: TableColumn<T>): void {
    column.visible = !column.visible;
    this.$columns.set([...this.$columns()]);
  }

  applyColumnChanges(): void {
    this.closeColumnSelector();
  }

  toggleColumnSelector(): void {
    this.$showColumnSelector.update(v => !v);
  }

  closeColumnSelector(): void {
    this.$showColumnSelector.set(false);
  }

  getCellValue(item: T, column: TableColumn<T>): string {
    if (column.render) {
      return column.render(item);
    }
    const value = item[column.key];
    return value != null ? String(value) : '-';
  }

  openContextMenu(event: MouseEvent, item: T): void {
    const actions = this.$filteredActions();
    if (actions.length === 0) return;

    event.preventDefault();
    event.stopPropagation();
    this.$contextMenuItem.set(item);
    this.$contextMenuPosition.set({x: event.clientX, y: event.clientY});
  }

  closeContextMenu(): void {
    this.$contextMenuItem.set(null);
    this.$contextMenuPosition.set(null);
  }

  handleAction(action: TableAction<T>): void {
    const item = this.$contextMenuItem();
    if (item) {
      this.closeContextMenu();

      if (action.danger) {
        this.$deleteConfirmationMessage.set(`Are you sure you want to delete this item?`);
        this.$showDeleteConfirmation.set(true);
        this.pendingDeleteAction = () => {
          action.handler(item);
          this.$contextMenuAction.emit({action, item});
        };
      } else {
        this.$contextMenuAction.emit({action, item});
        action.handler(item);
      }
    }
  }

  confirmDelete(): void {
    if (this.pendingDeleteAction) {
      this.pendingDeleteAction();
      this.pendingDeleteAction = null;
    }
    this.$showDeleteConfirmation.set(false);
  }

  cancelDelete(): void {
    this.pendingDeleteAction = null;
    this.$showDeleteConfirmation.set(false);
  }

  onReload(): void {
    this.$reload.emit();
  }

  getVisibleColumnCount(): number {
    return this.$visibleColumns().length;
  }

  getEmptyMessage(): string {
    return this.$searchQuery()
      ? `No results found for "${this.$searchQuery()}"`
      : this.$emptyMessage();
  }
}

