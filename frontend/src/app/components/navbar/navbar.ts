import {Component, inject, Input, signal} from '@angular/core';
import {NavLink} from '../../shared/models/nav-link.model';
import {MatIconModule} from '@angular/material/icon';
import {AppAuthService} from '../../api/auth/app-auth.service';
import {Router} from '@angular/router';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  imports: [
    CommonModule,
    MatIconModule,
  ]
})
export class Navbar {
  private readonly authService = inject(AppAuthService);
  private readonly router = inject(Router);

  @Input() title = '';
  @Input() subTitle?: string;
  @Input() links: NavLink[] = [];
  @Input() userName?: string;
  @Input() userEmail?: string;

  showUserDropdown = signal(false);

  navigateTo(path: string): void {
    void this.router.navigateByUrl(path);
  }

  navigateToDashboard(): void {
    void this.router.navigateByUrl('/dashboard');
  }

  toggleUserDropdown(event: Event): void {
    event.stopPropagation();
    this.showUserDropdown.update(v => !v);
  }

  navigateToProfile(): void {
    this.showUserDropdown.set(false);
    void this.router.navigateByUrl('/profile');
  }

  navigateToSettings(): void {
    this.showUserDropdown.set(false);
    void this.router.navigateByUrl('/settings');
  }

  logout(): void {
    this.showUserDropdown.set(false);
    this.authService.logout();
    void this.router.navigateByUrl('');
  }
}
