import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="mobile-shell auth-shell">
      <div class="glass-panel auth-card">
        <div class="auth-header">
          <mat-icon class="auth-logo-icon">person_add</mat-icon>
          <h2 class="neon-text-primary">Register</h2>
          <p class="auth-subtitle">Create profiles to begin scan-and-pay checkouts</p>
        </div>

        <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="auth-form">
          <mat-form-field appearance="fill">
            <mat-label>Username</mat-label>
            <input matInput formControlName="username" placeholder="Pick a username" required>
            <mat-icon matSuffix>badge</mat-icon>
            <mat-error *ngIf="signupForm.get('username')?.hasError('required')">Username is required</mat-error>
            <mat-error *ngIf="signupForm.get('username')?.hasError('minlength')">Must be at least 3 letters</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Email Address</mat-label>
            <input matInput formControlName="email" placeholder="Email contact" type="email" required>
            <mat-icon matSuffix>mail</mat-icon>
            <mat-error *ngIf="signupForm.get('email')?.hasError('required')">Email is required</mat-error>
            <mat-error *ngIf="signupForm.get('email')?.hasError('email')">Invalid email address</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Password</mat-label>
            <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" required>
            <button type="button" mat-icon-button matSuffix (click)="hidePassword = !hidePassword" aria-label="Toggle Password Visibility">
              <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
            </button>
            <mat-error *ngIf="signupForm.get('password')?.hasError('required')">Password is required</mat-error>
            <mat-error *ngIf="signupForm.get('password')?.hasError('minlength')">Must be at least 6 characters</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Account Role</mat-label>
            <mat-select formControlName="role">
              <mat-option value="customer">Customer Shopper</mat-option>
              <mat-option value="guard">Security Gate Guard</mat-option>
              <mat-option value="admin">Store Administrator</mat-option>
            </mat-select>
            <mat-icon matSuffix>military_tech</mat-icon>
          </mat-form-field>

          <div class="error-msg" *ngIf="errorMessage">
            <mat-icon>error_outline</mat-icon>
            <span>{{ errorMessage }}</span>
          </div>

          <button type="submit" class="primary-button submit-btn" [disabled]="signupForm.invalid || loading">
            <mat-spinner diameter="20" color="accent" *ngIf="loading"></mat-spinner>
            <span *ngIf="!loading">Create Profile</span>
          </button>
        </form>

        <div class="auth-footer">
          <span>Already registered? </span>
          <a routerLink="/login" class="link-text">Login instead</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-shell {
      justify-content: center;
      padding-top: 20px;
    }

    .auth-card {
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .auth-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .auth-logo-icon {
      font-size: 3rem;
      width: auto;
      height: auto;
      color: var(--primary);
      margin-bottom: 8px;
    }

    .auth-subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--danger);
      font-size: 0.85rem;
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.15);
      padding: 10px 14px;
      border-radius: 10px;
    }

    .submit-btn {
      width: 100%;
      height: 48px;
    }

    .auth-footer {
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .link-text {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      
      &:hover {
        text-decoration: underline;
      }
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  hidePassword = true;
  loading = false;
  errorMessage = '';

  signupForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['customer', Validators.required]
  });

  onSubmit() {
    if (this.signupForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    const { username, email, password, role } = this.signupForm.value;

    this.authService.register(username, email, password, role).subscribe({
      next: (res) => {
        this.loading = false;
        
        // Redirect to scanner or dashboard based on role
        if (res.role === 'ROLE_GUARD') {
          this.router.navigate(['/guard']);
        } else if (res.role === 'ROLE_ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/store-session']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Username or email may already be registered.';
      }
    });
  }
}
