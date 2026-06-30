import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { GuardService, VerificationResponse } from '../../services/guard.service';
import { CatalogService, StoreDto } from '../../services/catalog.service';

@Component({
  selector: 'app-guard-verify',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    ZXingScannerModule
  ],
  template: `
    <div class="container guard-verify-shell">
      <h2 class="neon-text-primary"><mat-icon>security</mat-icon> Exit Gate Verification</h2>

      <!-- Store Branch Config -->
      <div class="glass-panel branch-selector-card">
        <mat-form-field appearance="fill">
          <mat-label>Active Guard Station Location</mat-label>
          <mat-select [(ngModel)]="activeStoreId" (selectionChange)="onStoreChange()">
            <mat-option *ngFor="let store of storeList" [value]="store.id">
              {{ store.name }}
            </mat-option>
          </mat-select>
          <mat-icon matSuffix>storefront</mat-icon>
        </mat-form-field>
        <div class="branch-status" *ngIf="activeStoreId">
          <span class="status-indicator active"></span>
          <span>Station fully armed. Monitoring exits.</span>
        </div>
      </div>

      <div class="verification-dashboard">
        <!-- Scanner Panel -->
        <div class="glass-panel scanner-panel" *ngIf="!response">
          <h3 class="panel-title">Scan Customer Receipt QR</h3>
          
          <div class="scanner-wrapper" *ngIf="scannerEnabled">
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

          <div class="manual-fallback">
            <h4 class="card-title">Manual Token Verification</h4>
            <div class="manual-form">
              <mat-form-field appearance="fill" class="manual-input">
                <mat-label>Paste Cryptographic Receipt Token</mat-label>
                <input matInput [(ngModel)]="manualToken" placeholder="Paste signed JWT token here" (keyup.enter)="verifyManualToken()">
              </mat-form-field>
              <button class="accent-button lookup-btn" (click)="verifyManualToken()" [disabled]="!manualToken || verifying">
                <mat-icon *ngIf="!verifying">gavel</mat-icon>
                <mat-spinner diameter="18" color="accent" *ngIf="verifying"></mat-spinner>
              </button>
            </div>
          </div>
        </div>

        <!-- Verification Results Screen -->
        <div class="glass-panel results-panel" *ngIf="response" [ngClass]="{'valid': response.valid, 'invalid': !response.valid}">
          <div class="status-banner">
            <div class="status-icon-ring">
              <mat-icon>{{ response.valid ? 'check_circle' : 'gpp_bad' }}</mat-icon>
            </div>
            <h3 class="status-headline">{{ response.valid ? 'Exit Authorized' : 'Exit Denied' }}</h3>
            <p class="status-msg">{{ response.message }}</p>
          </div>

          <div class="result-divider"></div>

          <!-- Order Summary Details -->
          <div class="customer-audit-sheet" *ngIf="response.valid && response.orderNumber">
            <h4 class="audit-section-lbl">Customer exit details</h4>
            <div class="audit-grid">
              <div class="grid-cell"><span class="lbl">Customer:</span><span class="val">{{ response.customerName }}</span></div>
              <div class="grid-cell"><span class="lbl">Order Number:</span><span class="val">{{ response.orderNumber }}</span></div>
              <div class="grid-cell"><span class="lbl">Total Paid:</span><span class="val amt">₹{{ response.finalAmount | number:'1.2-2' }}</span></div>
              <div class="grid-cell"><span class="lbl">Timestamp:</span><span class="val">{{ response.paymentTimestamp | date:'medium' }}</span></div>
            </div>

            <div class="result-divider"></div>

            <!-- Purchased items to check -->
            <h4 class="audit-section-lbl">Paid Product Verification Checklist</h4>
            <div class="items-list-box">
              <div class="audit-item-row" *ngFor="let item of response.items">
                <div class="item-meta">
                  <span class="item-title">{{ item.productName }}</span>
                  <span class="item-barcode">EAN: {{ item.barcode }}</span>
                </div>
                <span class="item-quantity">Qty: <strong>{{ item.quantity }}</strong></span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <button class="primary-button next-verify-btn" (click)="resetVerification()">
            <mat-icon>refresh</mat-icon> Scan Next Customer
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .guard-verify-shell {
      padding-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-width: 600px !important;
      min-height: calc(100vh - 64px);
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.6rem;
    }

    .branch-selector-card {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .branch-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      
      &.active {
        background: var(--accent);
        box-shadow: 0 0 8px 1px var(--accent);
      }
    }

    .verification-dashboard {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .scanner-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 24px;
    }

    .panel-title {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .scanner-wrapper {
      position: relative;
      width: 100%;
      height: 250px;
      border-radius: 16px;
      overflow: hidden;
      background: #000;
      
      zxing-scanner {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    /* Laser Line & Corners */
    .scan-laser-line {
      position: absolute;
      width: 100%;
      height: 2px;
      background: var(--danger);
      box-shadow: 0 0 12px 2px var(--danger);
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
      width: 20px;
      height: 20px;
      border: 3px solid var(--danger);
      z-index: 10;
      pointer-events: none;
    }
    .corner-tl { top: 12px; left: 12px; border-right: none; border-bottom: none; }
    .corner-tr { top: 12px; right: 12px; border-left: none; border-bottom: none; }
    .corner-bl { bottom: 12px; left: 12px; border-right: none; border-top: none; }
    .corner-br { bottom: 12px; right: 12px; border-left: none; border-top: none; }

    .manual-fallback {
      border-top: 1px solid var(--border-color);
      padding-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .card-title {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .manual-form {
      display: flex;
      gap: 8px;
    }

    .manual-input {
      flex: 1;
    }

    .lookup-btn {
      height: 56px;
      width: 56px;
      border-radius: 12px;
      padding: 0;
    }

    /* Results card styling */
    .results-panel {
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      
      &.valid {
        border-color: var(--accent);
        box-shadow: 0 8px 32px 0 rgba(16, 185, 129, 0.15);
        
        .status-icon-ring {
          background: rgba(16, 185, 129, 0.1);
          border-color: var(--accent-glow);
          color: var(--accent);
        }
        .status-headline { color: var(--accent); }
      }
      
      &.invalid {
        border-color: var(--danger);
        box-shadow: 0 8px 32px 0 rgba(239, 68, 68, 0.15);
        
        .status-icon-ring {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
          color: var(--danger);
        }
        .status-headline { color: var(--danger); }
      }
    }

    .status-banner {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
    }

    .status-icon-ring {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 1px solid;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      
      mat-icon {
        font-size: 2.2rem;
        width: auto;
        height: auto;
      }
    }

    .status-headline {
      font-size: 1.3rem;
      font-weight: 700;
    }

    .status-msg {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.4;
      max-width: 380px;
    }

    .result-divider {
      border-top: 1px solid var(--border-color);
      width: 100%;
    }

    /* Customer exit details audit */
    .customer-audit-sheet {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .audit-section-lbl {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .audit-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .grid-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
      
      .lbl {
        font-size: 0.7rem;
        color: var(--text-secondary);
      }
      
      .val {
        font-size: 0.85rem;
        font-weight: 600;
        
        &.amt {
          color: var(--accent);
          font-weight: 700;
        }
      }
    }

    .items-list-box {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.15);
      padding: 4px;
    }

    .audit-item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.8rem;
      
      &:last-child {
        border-bottom: none;
      }
    }

    .item-meta {
      display: flex;
      flex-direction: column;
    }

    .item-title {
      font-weight: 600;
      color: var(--text-primary);
    }

    .item-barcode {
      font-size: 0.65rem;
      color: var(--text-muted);
      font-family: monospace;
    }

    .item-quantity {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-color);
      padding: 4px 10px;
      border-radius: 6px;
      color: var(--text-secondary);
    }

    .next-verify-btn {
      width: 100%;
      height: 48px;
    }
  `]
})
export class GuardVerifyComponent implements OnInit {
  private guardService = inject(GuardService);
  private catalogService = inject(CatalogService);

  storeList: StoreDto[] = [];
  activeStoreId = '';
  scannerEnabled = false;
  
  manualToken = '';
  verifying = false;
  
  response: VerificationResponse | null = null;
  allowedFormats = [BarcodeFormat.QR_CODE];

  ngOnInit() {
    this.catalogService.getStores().subscribe(stores => {
      this.storeList = stores;
      
      const cachedStore = localStorage.getItem('guard_store_id');
      if (cachedStore && stores.some(s => s.id === cachedStore)) {
        this.activeStoreId = cachedStore;
        this.scannerEnabled = true;
      } else if (stores.length > 0) {
        this.activeStoreId = stores[0].id;
        localStorage.setItem('guard_store_id', this.activeStoreId);
        this.scannerEnabled = true;
      }
    });
  }

  onStoreChange() {
    localStorage.setItem('guard_store_id', this.activeStoreId);
    this.resetVerification();
  }

  onScanSuccess(token: string) {
    if (!token || this.verifying) return;
    this.verifyReceiptToken(token);
  }

  verifyManualToken() {
    if (!this.manualToken) return;
    this.verifyReceiptToken(this.manualToken);
  }

  private verifyReceiptToken(token: string) {
    this.verifying = true;
    this.scannerEnabled = false;

    this.guardService.verifyReceipt(token, this.activeStoreId).subscribe({
      next: (res) => {
        this.verifying = false;
        this.response = res;
      },
      error: (err) => {
        this.verifying = false;
        this.response = {
          valid: false,
          message: err.error?.message || 'Exit Denied: Verification service reported database lookup failure.'
        };
      }
    });
  }

  resetVerification() {
    this.response = null;
    this.manualToken = '';
    
    setTimeout(() => {
      this.scannerEnabled = true;
    }, 200);
  }
}
