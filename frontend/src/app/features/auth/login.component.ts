import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { extractErrorMessage } from '../../shared/utils/error.util';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './auth-page.scss',
  template: `
    <form class="card auth-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <h1>Sign in</h1>
      <p class="muted" style="text-align:center">Smart Task Management</p>

      @if (error()) { <div class="form-error" role="alert">{{ error() }}</div> }

      <div class="field">
        <label for="email">Email</label>
        <input id="email" class="input" type="email" autocomplete="username" formControlName="email"
               [class.invalid]="invalid('email')" />
        @if (invalid('email')) { <span class="error-text">Enter a valid email address.</span> }
      </div>

      <div class="field">
        <label for="password">Password</label>
        <input id="password" class="input" type="password" autocomplete="current-password" formControlName="password"
               [class.invalid]="invalid('password')" />
        @if (invalid('password')) { <span class="error-text">Password is required.</span> }
      </div>

      <button class="btn" style="width:100%" type="submit" [disabled]="loading()">
        {{ loading() ? 'Signing in…' : 'Sign in' }}
      </button>
      <p class="muted switch">No account? <a routerLink="/register">Create one</a></p>
    </form>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  protected invalid(name: 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        // Only follow same-app relative URLs (prevents open redirects).
        void this.router.navigateByUrl(returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/dashboard');
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Unable to sign in.'));
        this.loading.set(false);
      }
    });
  }
}
