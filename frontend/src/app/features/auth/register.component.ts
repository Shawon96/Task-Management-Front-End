import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { extractErrorMessage } from '../../shared/utils/error.util';

/** Mirrors the server-side password policy (the server remains the source of truth). */
function passwordPolicy(control: AbstractControl<string>): ValidationErrors | null {
  const v = control.value ?? '';
  return /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v) ? null : { policy: true };
}

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './auth-page.scss',
  template: `
    <form class="card auth-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <h1>Create account</h1>

      @if (error()) { <div class="form-error" role="alert">{{ error() }}</div> }

      <div class="field">
        <label for="fullName">Full name</label>
        <input id="fullName" class="input" formControlName="fullName" autocomplete="name" [class.invalid]="invalid('fullName')" />
        @if (invalid('fullName')) { <span class="error-text">Full name is required (max 100 characters).</span> }
      </div>

      <div class="field">
        <label for="email">Email</label>
        <input id="email" class="input" type="email" formControlName="email" autocomplete="username" [class.invalid]="invalid('email')" />
        @if (invalid('email')) { <span class="error-text">Enter a valid email address.</span> }
      </div>

      <div class="field">
        <label for="password">Password</label>
        <input id="password" class="input" type="password" formControlName="password" autocomplete="new-password" [class.invalid]="invalid('password')" />
        @if (invalid('password')) {
          <span class="error-text">At least 8 characters with an uppercase letter, a lowercase letter and a digit.</span>
        }
      </div>

      <div class="field">
        <label for="role">I am a</label>
        <select id="role" class="input" formControlName="role">
          <option value="TeamMember">Team Member</option>
          <option value="ProjectManager">Project Manager</option>
        </select>
      </div>

      <button class="btn" style="width:100%" type="submit" [disabled]="loading()">
        {{ loading() ? 'Creating…' : 'Create account' }}
      </button>
      <p class="muted switch">Already registered? <a routerLink="/login">Sign in</a></p>
    </form>
  `
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128), passwordPolicy]],
    role: ['TeamMember' as 'TeamMember' | 'ProjectManager']
  });

  protected invalid(name: 'fullName' | 'email' | 'password'): boolean {
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

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl('/dashboard'),
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Unable to create the account.'));
        this.loading.set(false);
      }
    });
  }
}
