import {Component, Input} from '@angular/core';
import {NavLink} from '../../shared/models/nav-link.model';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  imports: [
    MatIconModule,
  ]
})
export class Navbar {
  @Input() title = '';
  @Input() subTitle?: string;
  @Input() links: NavLink[] = [];
}
