import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AppAuthService } from '../../api/auth/app-auth.service';
import { ProfileInfoTabComponent } from './profile-info-tab/profile-info-tab.component';
import { ProfileSettingsTabComponent } from './profile-settings-tab/profile-settings-tab.component';

type ProfileTab = 'info' | 'settings';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ProfileInfoTabComponent,
    ProfileSettingsTabComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  private readonly authService = inject(AppAuthService);
  private readonly router = inject(Router);

  activeTab = signal<ProfileTab>('info');

  selectTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('');
  }
}
