import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { CatalogService, ProductDto } from '../../services/catalog.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ZXingScannerModule
  ],
  template: `
    <div class="mobile-shell scanner-shell">
      <!-- Top Session Info -->
      <div class="glass-panel session-info-banner">
        <div class="banner-text">
          <span class="active-lbl">Shopping Active</span>
          <span class="store-lbl">{{ storeName }}</span>
        </div>
        <button mat-flat-button class="view-cart-shortcut" routerLink="/customer/cart">
          <mat-icon>shopping_cart</mat-icon> Cart
        </button>
      </div>

      <!-- Scanner Frame -->
      <div class="scanner-container glass-panel">
        <div class="scanner-camera-window" *ngIf="scannerEnabled && !scannedProduct">
          <!-- Laser scanning overlay animation line -->
          <div class="scan-laser-line"></div>
          <div class="scanner-corner corner-tl"></div>
          <div class="scanner-corner corner-tr"></div>
          <div class="scanner-corner corner-bl"></div>
          <div class="scanner-corner corner-br"></div>
          
          <zxing-scanner
            [formats]="allowedFormats"
            (scanSuccess)="onScanSuccess($event)"
            (scanError)="onScanError($event)"
            (permissionResponse)="onPermissionResponse($event)"
            [enable]="scannerEnabled">
          </zxing-scanner>
        </div>

        <div class="camera-blocked-card" *ngIf="!cameraHasPermission && !scannedProduct">
          <mat-icon class="camera-err-icon">videocam_off</mat-icon>
          <h3>Camera Permission Blocked</h3>
          <p>Enable camera permissions in your browser or type the barcode number manually below.</p>
        </div>

        <!-- Scanned Product Dynamic Preview Sheet -->
        <div class="scanned-product-sheet" *ngIf="scannedProduct">
          <div class="product-img-frame">
            <img [src]="scannedProduct.imageUrl || 'assets/placeholder-soap.webp'" alt="Product Image" (error)="setDefaultImage($event)">
          </div>
          
          <div class="product-details">
            <h3 class="prod-name">{{ scannedProduct.name }}</h3>
            <span class="prod-barcode">EAN: {{ scannedProduct.barcode }}</span>
            <div class="prod-price-tag">
              <span class="price-mrp">₹{{ scannedProduct.price | number:'1.2-2' }}</span>
              <span class="price-tax">Includes {{ scannedProduct.gstPercentage }}% GST</span>
            </div>
            
            <div class="inventory-status" [ngClass]="{'low-stock': scannedProduct.stockQuantity < 10}">
              <mat-icon>inventory_2</mat-icon>
              <span>{{ scannedProduct.stockQuantity }} units available</span>
            </div>
          </div>

          <div class="quantity-controller">
            <button mat-icon-button class="qty-btn" (click)="adjustQty(-1)" aria-label="Decrease Quantity">
              <mat-icon>remove</mat-icon>
            </button>
            <span class="qty-num">{{ scanQuantity }}</span>
            <button mat-icon-button class="qty-btn" (click)="adjustQty(1)" aria-label="Increase Quantity">
              <mat-icon>add</mat-icon>
            </button>
          </div>

          <div class="sheet-actions">
            <button class="glass-button cancel-sheet-btn" (click)="resetScanner()">
              <mat-icon>replay</mat-icon> Scan Again
            </button>
            <button class="primary-button add-cart-btn" (click)="addToCart()" [disabled]="addingToCart">
              <mat-spinner diameter="18" color="accent" *ngIf="addingToCart"></mat-spinner>
              <span *ngIf="!addingToCart">Add to Cart</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Manual Barcode Entry Panel -->
      <div class="glass-panel manual-entry-card" *ngIf="!scannedProduct">
        <h4 class="card-title">Manual Product Barcode</h4>
        <div class="manual-form">
          <mat-form-field appearance="fill" class="manual-input">
            <mat-label>Enter Barcode (EAN-13)</mat-label>
            <input matInput [(ngModel)]="manualBarcode" placeholder="e.g. 8901030752185" (keyup.enter)="simulateScan()">
            <mat-icon matSuffix>edit</mat-icon>
          </mat-form-field>
          <button class="accent-button lookup-btn" (click)="simulateScan()" [disabled]="!manualBarcode || lookingUp">
            <mat-icon *ngIf="!lookingUp">search</mat-icon>
            <mat-spinner diameter="18" color="accent" *ngIf="lookingUp"></mat-spinner>
          </button>
        </div>
        
        <div class="manual-hints">
          <span class="hint-lbl">Test barcode:</span>
          <span class="hint-code" (click)="manualBarcode='8901030752185'">8901030752185</span>
        </div>

        <div class="scanner-error" *ngIf="scannerError">
          <mat-icon>warning</mat-icon>
          <span>{{ scannerError }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scanner-shell {
      padding-top: 16px;
      gap: 16px;
    }

    .session-info-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      border-radius: 14px;
    }

    .banner-text {
      display: flex;
      flex-direction: column;
    }

    .active-lbl {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--accent);
    }

    .store-lbl {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .view-cart-shortcut {
      background: rgba(99, 102, 241, 0.15) !important;
      color: var(--primary) !important;
      border: 1px solid rgba(99, 102, 241, 0.25) !important;
      border-radius: 10px !important;
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      
      &:hover {
        background: rgba(99, 102, 241, 0.25) !important;
      }
    }

    .scanner-container {
      position: relative;
      overflow: hidden;
      padding: 12px;
      border-radius: 20px;
      min-height: 280px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
    }

    .scanner-camera-window {
      position: relative;
      width: 100%;
      height: 280px;
      border-radius: 16px;
      overflow: hidden;
      
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
      width: 20px;
      height: 20px;
      border: 3px solid var(--primary);
      z-index: 10;
      pointer-events: none;
    }
    .corner-tl { top: 12px; left: 12px; border-right: none; border-bottom: none; }
    .corner-tr { top: 12px; right: 12px; border-left: none; border-bottom: none; }
    .corner-bl { bottom: 12px; left: 12px; border-right: none; border-top: none; }
    .corner-br { bottom: 12px; right: 12px; border-left: none; border-top: none; }

    .camera-blocked-card {
      text-align: center;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: var(--text-secondary);
      
      h3 {
        color: var(--text-primary);
      }
      
      p {
        font-size: 0.8rem;
        line-height: 1.4;
      }
    }

    .camera-err-icon {
      font-size: 2.8rem;
      width: auto;
      height: auto;
      color: var(--danger);
    }

    /* Scanned Product Sheet styling */
    .scanned-product-sheet {
      width: 100%;
      background: var(--bg-surface);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
      padding: 16px;
      border-radius: 16px;
    }

    .product-img-frame {
      width: 120px;
      height: 120px;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid var(--border-color);
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      
      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    }

    .product-details {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .prod-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .prod-barcode {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: monospace;
    }

    .prod-price-tag {
      display: flex;
      flex-direction: column;
      margin-top: 4px;
    }

    .price-mrp {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--accent);
    }

    .price-tax {
      font-size: 0.7rem;
      color: var(--text-secondary);
    }

    .inventory-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: var(--accent);
      background: rgba(16, 185, 129, 0.08);
      padding: 4px 8px;
      border-radius: 6px;
      margin-top: 4px;
      
      mat-icon {
        font-size: 0.9rem;
        width: auto;
        height: auto;
      }
      
      &.low-stock {
        color: var(--warning);
        background: rgba(245, 158, 11, 0.08);
      }
    }

    .quantity-controller {
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      padding: 4px 8px;
      border-radius: 50px;
    }

    .qty-btn {
      color: var(--text-secondary);
      background: rgba(255, 255, 255, 0.05);
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
      }
    }

    .qty-num {
      font-family: 'Outfit', sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
      width: 24px;
      text-align: center;
    }

    .sheet-actions {
      display: flex;
      gap: 12px;
      width: 100%;
      margin-top: 8px;
    }

    .cancel-sheet-btn {
      flex: 1;
      justify-content: center;
    }

    .add-cart-btn {
      flex: 1.5;
    }

    /* Manual entry container */
    .manual-entry-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .card-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .manual-form {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .manual-input {
      flex: 1;
    }

    .lookup-btn {
      height: 56px;
      width: 56px;
      padding: 0;
      border-radius: 12px;
    }

    .manual-hints {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
    }

    .hint-lbl {
      color: var(--text-muted);
    }

    .hint-code {
      color: var(--primary);
      text-decoration: underline;
      cursor: pointer;
      font-family: monospace;
    }

    .scanner-error {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--danger);
      font-size: 0.8rem;
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.1);
      padding: 8px 12px;
      border-radius: 8px;
      margin-top: 4px;
      
      mat-icon {
        font-size: 1rem;
        width: auto;
        height: auto;
      }
    }
  `]
})
export class ScannerComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private cartService = inject(CartService);
  private router = inject(Router);

  storeId = '';
  storeName = 'Default Branch';
  scannerEnabled = true;
  cameraHasPermission = true;
  lookingUp = false;
  addingToCart = false;
  
  manualBarcode = '';
  scannerError = '';
  
  scannedProduct: ProductDto | null = null;
  scanQuantity = 1;

  // Scan Code-128, EAN-13, UPC-A, QR codes
  allowedFormats = [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.EAN_13,
    BarcodeFormat.UPC_A,
    BarcodeFormat.CODE_128
  ];

  ngOnInit() {
    const localStoreId = localStorage.getItem('active_store_id');
    const localStoreName = localStorage.getItem('active_store_name');
    
    if (localStoreId) {
      this.storeId = localStoreId;
      this.storeName = localStoreName || 'Supermart Branch';
    } else {
      // Force store QR session redirection if not initialized
      this.router.navigate(['/store-session']);
    }
  }

  onScanSuccess(barcode: string) {
    if (!barcode || this.scannedProduct) return;
    this.processBarcodeLookup(barcode);
  }

  onScanError(err: any) {
    console.error(err);
  }

  onPermissionResponse(permission: boolean) {
    this.cameraHasPermission = permission;
    this.scannerEnabled = permission;
  }

  simulateScan() {
    if (!this.manualBarcode) return;
    this.processBarcodeLookup(this.manualBarcode);
  }

  processBarcodeLookup(barcode: string) {
    this.lookingUp = true;
    this.scannerError = '';
    this.scannedProduct = null;
    this.scannerEnabled = false;

    this.catalogService.getProductByBarcode(barcode).subscribe({
      next: (product) => {
        this.lookingUp = false;
        this.scannedProduct = product;
        this.scanQuantity = 1;
      },
      error: (err) => {
        this.lookingUp = false;
        this.scannerEnabled = true;
        this.scannerError = err.error?.message || 'Product barcode not recognized. Please scan a valid EAN-13 tag.';
      }
    });
  }

  adjustQty(offset: number) {
    const target = this.scanQuantity + offset;
    if (target > 0 && this.scannedProduct && target <= this.scannedProduct.stockQuantity) {
      this.scanQuantity = target;
    }
  }

  addToCart() {
    if (!this.scannedProduct || !this.storeId) return;

    this.addingToCart = true;
    this.cartService.addItem(this.storeId, this.scannedProduct.barcode, this.scanQuantity).subscribe({
      next: () => {
        this.addingToCart = false;
        this.resetScanner();
        // Redirect to cart
        this.router.navigate(['/customer/cart']);
      },
      error: (err) => {
        this.addingToCart = false;
        this.scannerError = err.error?.message || 'Failed to add item to cart. Try again.';
      }
    });
  }

  resetScanner() {
    this.scannedProduct = null;
    this.scanQuantity = 1;
    this.manualBarcode = '';
    this.scannerError = '';
    
    // Resume camera tracking after short delay
    setTimeout(() => {
      this.scannerEnabled = true;
    }, 200);
  }

  setDefaultImage(event: any) {
    // Falls back to a clean mock icon representation
    event.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="%236366f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>';
  }
}
