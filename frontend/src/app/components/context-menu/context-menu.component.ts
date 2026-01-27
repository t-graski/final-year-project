import {Component, input, output, signal, effect, ElementRef, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {PermissionService, Permission} from '../../services/permission.service';

export interface ContextMenuAction {
  label: string;
  icon?: string;
  action: () => void;
  requiredPermission?: Permission | Permission[];
  disabled?: boolean;
  divider?: boolean;
  danger?: boolean;
  hidden?: boolean;
}

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.scss'
})
export class ContextMenuComponent {
  private readonly permissionService = inject(PermissionService);
  private readonly elementRef = inject(ElementRef);

  // Inputs
  actions = input.required<ContextMenuAction[]>();
  isOpen = input<boolean>(false);
  position = input<{x: number, y: number}>({x: 0, y: 0});

  // Outputs
  close = output<void>();

  $visibleActions = signal<ContextMenuAction[]>([]);

  constructor() {
    // Filter actions based on permissions
    effect(() => {
      const allActions = this.actions();
      const filtered = allActions.filter(action => {
        if (action.hidden) return false;
        if (!action.requiredPermission) return true;

        const permissions = Array.isArray(action.requiredPermission)
          ? action.requiredPermission
          : [action.requiredPermission];

        return this.permissionService.hasAnyPermission(...permissions);
      });

      this.$visibleActions.set(filtered);
    });
  }

  handleAction(action: ContextMenuAction): void {
    if (action.disabled || action.divider) return;

    action.action();
    this.close.emit();
  }

  handleBackdropClick(): void {
    this.close.emit();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
