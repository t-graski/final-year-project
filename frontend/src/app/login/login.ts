import {Component} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {NgStyle} from '@angular/common';
import {MatCheckbox} from '@angular/material/checkbox';

@Component({
  selector: 'app-login',
  imports: [MatIconModule, NgStyle, MatCheckbox],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

}
