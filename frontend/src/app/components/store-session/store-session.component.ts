import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
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
    MatProgressSpinnerModule,
    ZXingScannerModule
  ],
  template: `
    <div class="mobile-shell session-shell">
      <div class="glass-panel session-card">
        <div class="session-header">
          <div class="qr-glow-icon">
            <mat-icon>storefront</mat-icon>
          </div>
          <h2 class="neon-text-primary">Welcome to SmartScan</h2>
          <p class="session-subtitle">Scan the store entrance QR code or enter the Store ID manually to begin shopping</p>
        </div>

        <!-- Mode Toggles (Scan vs Type) -->
        <div class="mode-toggles">
          <button type="button" class="toggle-btn" [class.active]="scannerEnabled" (click)="toggleScanner(true)">
            <mat-icon>qr_code_scanner</mat-icon> Scan Store QR
          </button>
          <button type="button" class="toggle-btn" [class.active]="!scannerEnabled" (click)="toggleScanner(false)">
            <mat-icon>edit_note</mat-icon> Type Store ID
          </button>
        </div>

        <!-- Camera Scanner Panel -->
        <div class="scanner-container" *ngIf="scannerEnabled">
          <div class="scanner-camera-window">
            <!-- Laser scanning overlay animation line -->
            <div class="scan-laser-line"></div>
            <div class="scanner-corner corner-tl"></div>
            <div class="scanner-corner corner-tr"></div>
            <div class="scanner-corner corner-bl"></div>
            <div class="scanner-corner corner-br"></div>
            
            <zxing-scanner
              [formats]="allowedFormats"
              (scanSuccess)="onScanSuccess($event)"
              [enable]="scannerEnabled">
            </zxing-scanner>
          </div>
          <p class="scanner-hint">Point your camera at the store entrance QR code</p>
        </div>

        <!-- Manual Input Form -->
        <form [formGroup]="sessionForm" (ngSubmit)="onSubmit()" class="session-form" *ngIf="!scannerEnabled">
          <mat-form-field appearance="fill">
            <mat-label>Store ID / QR Code</mat-label>
            <input matInput formControlName="qrIdentifier" placeholder="Enter Store ID" required>
            <mat-icon matSuffix>storefront</mat-icon>
            <mat-error *ngIf="sessionForm.get('qrIdentifier')?.hasError('required')">
              Store identifier code is required
            </mat-error>
          </mat-form-field>

          <button type="submit" class="primary-button session-btn" [disabled]="sessionForm.invalid || loading">
            <mat-spinner diameter="20" color="accent" *ngIf="loading"></mat-spinner>
            <span *ngIf="!loading">Enter Shopping Mode</span>
          </button>
        </form>

        <div class="error-msg" *ngIf="errorMessage && scannerEnabled">
          <mat-icon>error_outline</mat-icon>
          <span>{{ errorMessage }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .session-shell {
      justify-content: center;
      padding-top: 20px;
    }

    .session-card {
      padding: 36px 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .session-header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .qr-glow-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: rgba(127, 239, 189, 0.1);
      border: 1px solid var(--border-color-glow);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px 0 rgba(127, 239, 189, 0.15);
      margin-bottom: 4px;
      
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

    /* Mode Toggles */
    .mode-toggles {
      display: flex;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 4px;
      gap: 4px;
    }

    .toggle-btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      padding: 10px;
      font-family: 'Inter', sans-serif;
      font-size: 0.8rem;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: var(--transition-smooth);

      mat-icon {
        font-size: 1.1rem;
        width: auto;
        height: auto;
      }

      &:hover {
        color: var(--text-primary);
        background: rgba(255, 255, 255, 0.02);
      }

      &.active {
        color: #000000;
        background: var(--primary);
        font-weight: 600;
      }
    }

    /* Scanner Viewport */
    .scanner-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;
      width: 100%;
    }

    .scanner-camera-window {
      position: relative;
      width: 100%;
      height: 240px;
      border-radius: 12px;
      overflow: hidden;
      background: #000000;
      border: 1px solid var(--border-color);
      
      zxing-scanner {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .scanner-hint {
      font-size: 0.8rem;
      color: var(--text-secondary);
      text-align: center;
    }

    /* Laser Line & Corners */
    .scan-laser-line {
      position: absolute;
      width: 100%;
      height: 2px;
      background: var(--primary);
      box-shadow: 0 0 12px 2px var(--primary);
      z-index: 10;
      animation: scanAnimation 2.2s infinite ease-in-out;
    }

    @keyframes scanAnimation {
      0% { top: 5%; }
      50% { top: 95%; }
      100% { top: 5%; }
    }

    .scanner-corner {
      position: absolute;
      width: 16px;
      height: 16px;
      border: 3px solid var(--primary);
      z-index: 10;
      pointer-events: none;
    }
    .corner-tl { top: 8px; left: 8px; border-right: none; border-bottom: none; }
    .corner-tr { top: 8px; right: 8px; border-left: none; border-bottom: none; }
    .corner-bl { bottom: 8px; left: 8px; border-right: none; border-top: none; }
    .corner-br { bottom: 8px; right: 8px; border-left: none; border-top: none; }

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
      width: 100%;
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
  scannerEnabled = true; // Default to scan mode for physical scanning
  allowedFormats = [ BarcodeFormat.QR_CODE ];

  sessionForm: FormGroup = this.fb.group({
    qrIdentifier: ['', Validators.required]
  });

  ngOnInit() {
    // Check URL parameter first (e.g. /store-session/BLR_INDIRANAGAR_01)
    const qrParam = this.route.snapshot.paramMap.get('qrIdentifier');
    if (qrParam) {
      this.sessionForm.patchValue({ qrIdentifier: qrParam });
      this.scannerEnabled = false;
      this.validateStoreAndEnter(qrParam);
    }
  }

  toggleScanner(enabled: boolean) {
    this.scannerEnabled = enabled;
    this.errorMessage = '';
  }

  onScanSuccess(result: string) {
    let code = result;
    // Extract ID if a full URL is scanned (e.g. https://.../store-session/BLR_INDIRANAGAR_01)
    if (result.includes('/store-session/')) {
      const parts = result.split('/store-session/');
      code = parts[parts.length - 1];
    }
    this.sessionForm.patchValue({ qrIdentifier: code });
    this.scannerEnabled = false;
    this.validateStoreAndEnter(code);
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
