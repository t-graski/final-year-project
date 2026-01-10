import {Component, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {SnackbarComponent} from './components/snackbar/snackbar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [
    RouterOutlet,
    SnackbarComponent
  ],
  styleUrl: './app.scss'
})
export class App {
}
