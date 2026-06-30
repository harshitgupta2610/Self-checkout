import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CatalogService } from '../../services/catalog.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-store-session',
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
    <div class="mobile-shell session-shell">
      <div class="glass-panel session-card">
        <div class="session-header">
          <div class="qr-glow-icon">
            <mat-icon>qr_code</mat-icon>
          </div>
          <h2 class="neon-text-primary">Welcome to SmartScan</h2>
          <p class="session-subtitle">Scan store entrance QR or input Store ID below to initialize shopping session</p>
        </div>

        <form [formGroup]="sessionForm" (ngSubmit)="onSubmit()" class="session-form">
          <mat-form-field appearance="fill">
            <mat-label>Store QR Identifier</mat-label>
            <input matInput formControlName="qrIdentifier" placeholder="e.g. BLR_INDIRANAGAR_01" required>
            <mat-icon matSuffix>storefront</mat-icon>
            <mat-hint>For testing, enter: BLR_INDIRANAGAR_01</mat-hint>
            <mat-error *ngIf="sessionForm.get('qrIdentifier')?.hasError('required')">
              Store identifier code is required
            </mat-error>
          </mat-form-field>

          <div class="error-msg" *ngIf="errorMessage">
            <mat-icon>error_outline</mat-icon>
            <span>{{ errorMessage }}</span>
          </div>

          <button type="submit" class="primary-button session-btn" [disabled]="sessionForm.invalid || loading">
            <mat-spinner diameter="20" color="accent" *ngIf="loading"></mat-spinner>
            <span *ngIf="!loading">Enter Shopping Mode</span>
          </button>
        </form>

        <div class="demo-stores-hints" *ngIf="!loading">
          <span class="hint-title">Active Demo Branches:</span>
          <div class="hint-tag" (click)="setMockStore('BLR_INDIRANAGAR_01')">
            <mat-icon>tag</mat-icon> Indiranagar (BLR_INDIRANAGAR_01)
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .session-shell {
      justify-content: center;
      padding-top: 40px;
    }

    .session-card {
      padding: 36px 24px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .session-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .qr-glow-icon {
      width: 72px;
      height: 72px;
      border-radius: 20px;
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid var(--border-color-glow);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px 0 rgba(99, 102, 241, 0.15);
      margin-bottom: 8px;
      
      mat-icon {
        font-size: 2.2rem;
        width: auto;
        height: auto;
        color: var(--primary);
      }
    }

    .session-subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .session-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .session-btn {
      width: 100%;
      height: 48px;
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

    .demo-stores-hints {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid var(--border-color);
    }

    .hint-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .hint-tag {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: var(--primary);
      background: rgba(99, 102, 241, 0.05);
      border: 1px solid rgba(99, 102, 241, 0.12);
      padding: 8px 12px;
      border-radius: 10px;
      cursor: pointer;
      transition: var(--transition-smooth);
      
      &:hover {
        background: rgba(99, 102, 241, 0.12);
        transform: scale(1.02);
      }
    }
  `]
})
export class StoreSessionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private catalogService = inject(CatalogService);
  private authService = inject(AuthService);

  loading = false;
  errorMessage = '';

  sessionForm: FormGroup = this.fb.group({
    qrIdentifier: ['', Validators.required]
  });

  ngOnInit() {
    // Check url parameter first (e.g. /store-session/BLR_INDIRANAGAR_01)
    const qrParam = this.route.snapshot.paramMap.get('qrIdentifier');
    if (qrParam) {
      this.sessionForm.patchValue({ qrIdentifier: qrParam });
      this.validateStoreAndEnter(qrParam);
    }
  }

  setMockStore(code: string) {
    this.sessionForm.patchValue({ qrIdentifier: code });
  }

  onSubmit() {
    if (this.sessionForm.invalid) return;
    const { qrIdentifier } = this.sessionForm.value;
    this.validateStoreAndEnter(qrIdentifier);
  }

  private validateStoreAndEnter(qrCode: string) {
    this.loading = true;
    this.errorMessage = '';

    this.catalogService.getStoreSession(qrCode).subscribe({
      next: (store) => {
        this.loading = false;
        
        // Save store session details locally
        localStorage.setItem('active_store_id', store.id);
        localStorage.setItem('active_store_name', store.name);

        // Redirect based on login status
        if (this.authService.isAuthenticated()) {
          this.router.navigate(['/customer/scanner']);
        } else {
          // Send to login, which will auto return to scanner
          this.authService.setRedirectUrl('/customer/scanner');
          this.router.navigate(['/login']);
        }
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Invalid store entrance QR. Please check the branch code.';
      }
    });
  }
}
