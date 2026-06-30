import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="mobile-shell auth-shell">
      <div class="glass-panel auth-card">
        <div class="auth-header">
          <mat-icon class="auth-logo-icon">account_circle</mat-icon>
          <h2 class="neon-text-primary">Sign In</h2>
          <p class="auth-subtitle">Enter credentials to begin self-checkout</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
          <mat-form-field appearance="fill">
            <mat-label>Username or Email</mat-label>
            <input matInput formControlName="usernameOrEmail" placeholder="Enter username or email" required>
            <mat-icon matSuffix>person</mat-icon>
            <mat-error *ngIf="loginForm.get('usernameOrEmail')?.hasError('required')">
              Username/Email is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>Password</mat-label>
            <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" required>
            <button type="button" mat-icon-button matSuffix (click)="hidePassword = !hidePassword" aria-label="Toggle Password Visibility">
              <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
            </button>
            <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
              Password is required
            </mat-error>
          </mat-form-field>

          <div class="error-msg" *ngIf="errorMessage">
            <mat-icon>error_outline</mat-icon>
            <span>{{ errorMessage }}</span>
          </div>

          <button type="submit" class="primary-button submit-btn" [disabled]="loginForm.invalid || loading">
            <mat-spinner diameter="20" color="accent" *ngIf="loading"></mat-spinner>
            <span *ngIf="!loading">Authenticate</span>
          </button>
        </form>

        <div class="auth-footer">
          <span>New shopping customer? </span>
          <a routerLink="/register" class="link-text">Create Account</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-shell {
      justify-content: center;
      padding-top: 40px;
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
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  hidePassword = true;
  loading = false;
  errorMessage = '';

  loginForm: FormGroup = this.fb.group({
    usernameOrEmail: ['', Validators.required],
    password: ['', Validators.required]
  });

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    const { usernameOrEmail, password } = this.loginForm.value;

    this.authService.login(usernameOrEmail, password).subscribe({
      next: (res) => {
        this.loading = false;
        
        // Redirect logic based on role
        const role = res.role;
        const redirectUrl = this.authService.getRedirectUrl();
        
        if (redirectUrl) {
          this.router.navigateByUrl(redirectUrl);
        } else if (role === 'ROLE_GUARD') {
          this.router.navigate(['/guard']);
        } else if (role === 'ROLE_ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          // If customer has a scanned store ID stored, go directly to scanner
          const activeStoreId = localStorage.getItem('active_store_id');
          if (activeStoreId) {
            this.router.navigate(['/customer/scanner']);
          } else {
            this.router.navigate(['/store-session']);
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Invalid username/email or password';
      }
    });
  }
}
