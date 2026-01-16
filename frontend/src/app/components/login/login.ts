import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {Router} from '@angular/router';
import {AppAuthService} from '../../api/auth/app-auth.service';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {finalize, switchMap} from 'rxjs/operators'
import {UserService} from '../../services/user.service';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AppAuthService);
  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);

  isSubmitting = false;
  errorMessage: string | null = null;

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [true]
  });


  signIn(): void {
    if (this.loginForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    const {email, password, rememberMe} = this.loginForm.getRawValue();

    this.auth
      .login(email, password, rememberMe)
      .pipe(
        switchMap(() => this.userService.loadCurrentUser()),
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (user) => {
          if (user.roles?.includes(3)) {
            void this.router.navigateByUrl('/admin');
          } else {
            void this.router.navigateByUrl('/dashboard');
          }
        },
        error: (err) => {
          if (err?.status === 401) this.errorMessage = 'Invalid email or password.';
          else this.errorMessage = 'Login failed. Please try again.';
          this.cdr.markForCheck();
        }
      })
  }
}
