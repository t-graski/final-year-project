import {Component, inject, Input} from '@angular/core';
import {NavLink} from '../../shared/models/nav-link.model';
import {MatIconModule} from '@angular/material/icon';
import {AppAuthService} from '../../api/auth/app-auth.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  imports: [
    MatIconModule,
  ]
})
export class Navbar {
  private readonly authService = inject(AppAuthService);
  private readonly router = inject(Router);

  @Input() title = '';
  @Input() subTitle?: string;
  @Input() links: NavLink[] = [];

  navigateTo(path: string): void {
    void this.router.navigateByUrl(path);
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('');
  }
}
