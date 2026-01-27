import {Injectable, inject, signal, computed} from '@angular/core';
import {RoleService as ApiRoleService} from '../api/api/role.service';
import {RoleDto} from '../api/model/models';

@Injectable({providedIn: 'root'})
export class RoleService {
  private readonly apiRoleService = inject(ApiRoleService);

  // Signal to hold roles
  private readonly roles = signal<RoleDto[]>([]);

  // Computed signal to check if roles are loaded
  public readonly $rolesLoaded = computed(() => this.roles().length > 0);

  // Expose roles as a computed signal for reactive access
  public readonly $roles = computed(() => this.roles());

  constructor() {
    // Don't load roles here - they need to be loaded after login
    // because the /api/roles endpoint requires authentication
  }

  /**
   * Load roles from the backend
   * Should be called after user login when auth token is available
   */
  loadRoles(): void {
    this.apiRoleService.apiRolesGet().subscribe({
      next: (response) => {
        if (response.data) {
          this.roles.set(response.data);
        }
      },
      error: (error) => {
        console.error('Failed to load roles:', error);
      }
    });
  }

  /**
   * Get all roles
   */
  getRoles(): RoleDto[] {
    return this.roles();
  }

  /**
   * Get role by ID
   */
  getRoleById(id: string): RoleDto | undefined {
    return this.roles().find(role => role.id === id);
  }

  /**
   * Get role name by ID
   */
  getRoleName(id: string): string {
    const role = this.getRoleById(id);
    return role?.name ?? 'Unknown';
  }

  /**
   * Get multiple role names by IDs
   */
  getRoleNames(ids: string[]): string {
    if (!ids || ids.length === 0) return 'No roles';

    const names = ids
      .map(id => this.getRoleName(id))
      .filter(name => name !== 'Unknown');

    return names.length > 0 ? names.join(', ') : 'Unknown';
  }

  /**
   * Force refresh roles from the backend
   */
  refreshRoles(): void {
    this.loadRoles();
  }
}
