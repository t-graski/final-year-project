import {Component} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {NgStyle} from '@angular/common';
import {MatCheckbox} from '@angular/material/checkbox';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [MatIconModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  activeTab: 'login' | 'register' = 'login';

  switchTab(tab: 'login' | 'register') {
    this.activeTab = tab;
  }
}
