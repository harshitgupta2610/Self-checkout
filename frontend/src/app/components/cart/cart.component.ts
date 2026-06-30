import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CartService, ShoppingCart } from '../../services/cart.service';
import { PaymentService, PaymentInitResponse } from '../../services/payment.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="mobile-shell cart-shell">
      <div class="cart-header">
        <h2 class="neon-text-primary">Shopping Cart</h2>
        <button mat-button class="clear-all-btn" (click)="clearCart()" *ngIf="cart && cart.items.length > 0">
          <mat-icon>delete_sweep</mat-icon> Clear
        </button>
      </div>

      <!-- Empty State -->
      <div class="glass-panel empty-cart-card" *ngIf="!cart || cart.items.length === 0">
        <mat-icon class="empty-icon">shopping_cart_off</mat-icon>
        <h3>Your cart is empty</h3>
        <p>Scan product barcodes at the shelf to build your self-checkout bag.</p>
        <button class="primary-button scan-btn" routerLink="/customer/scanner">
          <mat-icon>qr_code_scanner</mat-icon> Open Camera Scanner
        </button>
      </div>

      <!-- Active Cart List -->
      <div class="cart-items-list" *ngIf="cart && cart.items.length > 0">
        <div class="cart-item-card glass-panel" *ngFor="let item of cart.items">
          <div class="item-visual">
            <img [src]="item.imageUrl || 'assets/placeholder-soap.webp'" alt="Product Image" (error)="setDefaultImage($event)">
          </div>
          
          <div class="item-info">
            <h4 class="item-title">{{ item.name }}</h4>
            <span class="item-barcode">EAN: {{ item.barcode }}</span>
            <div class="item-prices">
              <span class="item-unit-mrp">₹{{ item.price | number:'1.2-2' }} each</span>
              <span class="item-total-mrp">₹{{ item.finalAmount | number:'1.2-2' }}</span>
            </div>
            
            <div class="item-discounts" *ngIf="item.discountAmount > 0">
              <mat-icon>local_offer</mat-icon>
              <span>Saved ₹{{ item.discountAmount | number:'1.2-2' }}</span>
            </div>
          </div>

          <div class="item-qty-panel">
            <button mat-icon-button class="qty-btn" (click)="updateQuantity(item.productId, item.quantity - 1)">
              <mat-icon>remove</mat-icon>
            </button>
            <span class="qty-count">{{ item.quantity }}</span>
            <button mat-icon-button class="qty-btn" (click)="updateQuantity(item.productId, item.quantity + 1)">
              <mat-icon>add</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Coupon application panel -->
      <div class="glass-panel coupon-card" *ngIf="cart && cart.items.length > 0">
        <h4 class="section-title">Apply Promo Coupon</h4>
        <div class="coupon-form" *ngIf="!cart.appliedCouponCode">
          <mat-form-field appearance="fill" class="coupon-input">
            <mat-label>Coupon Code</mat-label>
            <input matInput [(ngModel)]="couponCode" placeholder="Try SUPER20" (keyup.enter)="applyCoupon()">
            <mat-icon matSuffix>local_activity</mat-icon>
          </mat-form-field>
          <button class="accent-button apply-btn" (click)="applyCoupon()" [disabled]="!couponCode || applyingCoupon">
            <mat-spinner diameter="18" color="accent" *ngIf="applyingCoupon"></mat-spinner>
            <span *ngIf="!applyingCoupon">Apply</span>
          </button>
        </div>

        <div class="applied-coupon-badge" *ngIf="cart.appliedCouponCode">
          <div class="badge-text">
            <mat-icon class="coupon-check">stars</mat-icon>
            <span class="code-lbl">Coupon Applied: <strong>{{ cart.appliedCouponCode }}</strong></span>
          </div>
          <button mat-icon-button class="remove-coupon-btn" (click)="removeCoupon()" aria-label="Remove Coupon">
            <mat-icon>cancel</mat-icon>
          </button>
        </div>
      </div>

      <!-- Pricing Breakdown -->
      <div class="glass-panel pricing-breakdown-card" *ngIf="cart && cart.items.length > 0">
        <h4 class="section-title">Payment Breakdown</h4>
        <div class="bill-row">
          <span class="bill-lbl">Cart Subtotal (Net of GST)</span>
          <span class="bill-val">₹{{ cart.subtotal | number:'1.2-2' }}</span>
        </div>
        <div class="bill-row">
          <span class="bill-lbl">GST Taxes (CGST + SGST)</span>
          <span class="bill-val">₹{{ cart.taxAmount | number:'1.2-2' }}</span>
        </div>
        <div class="bill-row savings-row" *ngIf="cart.discountAmount > 0">
          <span class="bill-lbl">Coupon Discount Savings</span>
          <span class="bill-val">- ₹{{ cart.discountAmount | number:'1.2-2' }}</span>
        </div>
        
        <div class="bill-divider"></div>
        
        <div class="bill-row total-row">
          <span class="bill-lbl">Grand Total Payable</span>
          <span class="bill-val">₹{{ cart.finalAmount | number:'1.2-2' }}</span>
        </div>

        <div class="error-msg" *ngIf="errorMessage">
          <mat-icon>error_outline</mat-icon>
          <span>{{ errorMessage }}</span>
        </div>

        <button class="primary-button pay-checkout-btn" (click)="proceedToPayment()" [disabled]="checkingOut || verifyingPayment">
          <mat-spinner diameter="20" color="accent" *ngIf="checkingOut || verifyingPayment"></mat-spinner>
          <span *ngIf="!checkingOut && !verifyingPayment">Pay ₹{{ cart.finalAmount | number:'1.2-2' }} via PhonePe UPI</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .cart-shell {
      padding-top: 16px;
      gap: 16px;
    }

    .cart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .clear-all-btn {
      color: var(--danger) !important;
      font-weight: 600;
      
      &:hover {
        background: rgba(239, 68, 68, 0.08);
      }
    }

    .empty-cart-card {
      text-align: center;
      padding: 48px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: var(--text-secondary);
      
      h3 {
        color: var(--text-primary);
      }
      p {
        font-size: 0.85rem;
        line-height: 1.4;
        max-width: 280px;
      }
    }

    .empty-icon {
      font-size: 3.5rem;
      width: auto;
      height: auto;
      color: var(--text-muted);
    }

    .scan-btn {
      margin-top: 8px;
    }

    /* Cart Items */
    .cart-items-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .cart-item-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px;
      border-radius: 16px;
    }

    .item-visual {
      width: 60px;
      height: 60px;
      border-radius: 10px;
      overflow: hidden;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-color);
      
      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    }

    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .item-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .item-barcode {
      font-size: 0.7rem;
      color: var(--text-muted);
      font-family: monospace;
    }

    .item-prices {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-top: 4px;
    }

    .item-unit-mrp {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .item-total-mrp {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .item-discounts {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--accent);
      font-size: 0.75rem;
      font-weight: 600;
      
      mat-icon {
        font-size: 0.85rem;
        width: auto;
        height: auto;
      }
    }

    .item-qty-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 2px;
    }

    .qty-btn {
      width: 28px;
      height: 28px;
      line-height: 28px;
      color: var(--text-secondary);
      
      mat-icon {
        font-size: 1rem;
      }
    }

    .qty-count {
      font-size: 0.85rem;
      font-weight: 700;
      font-family: 'Outfit', sans-serif;
    }

    /* Coupon card */
    .coupon-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .section-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .coupon-form {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .coupon-input {
      flex: 1;
    }

    .apply-btn {
      height: 56px;
      padding: 0 18px;
      border-radius: 12px;
    }

    .applied-coupon-badge {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(16, 185, 129, 0.06);
      border: 1px solid var(--accent-glow);
      padding: 12px 16px;
      border-radius: 12px;
    }

    .badge-text {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--accent);
      font-size: 0.85rem;
    }

    .coupon-check {
      color: var(--accent);
    }

    .remove-coupon-btn {
      color: var(--text-muted) !important;
      
      &:hover {
        color: var(--danger) !important;
      }
    }

    /* Bill Breakdown */
    .pricing-breakdown-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .bill-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .savings-row {
      color: var(--accent);
      font-weight: 500;
    }

    .bill-divider {
      height: 1px;
      background: var(--border-color);
      margin: 4px 0;
    }

    .total-row {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      
      .bill-val {
        color: var(--accent);
      }
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
      margin-top: 8px;
    }

    .pay-checkout-btn {
      width: 100%;
      height: 52px;
      margin-top: 8px;
      font-size: 1.05rem;
    }
  `]
})
export class CartComponent implements OnInit {
  private cartService = inject(CartService);
  private paymentService = inject(PaymentService);
  private router = inject(Router);

  cart: ShoppingCart | null = null;
  couponCode = '';
  errorMessage = '';
  
  applyingCoupon = false;
  checkingOut = false;
  verifyingPayment = false;

  ngOnInit() {
    this.cartService.cart$.subscribe(cart => this.cart = cart);
    this.fetchCart();
  }

  fetchCart() {
    this.cartService.fetchCart().subscribe({
      error: (err) => this.errorMessage = err.error?.message || 'Failed to load shopping cart cache.'
    });
  }

  updateQuantity(productId: string, qty: number) {
    this.cartService.updateQuantity(productId, qty).subscribe({
      error: (err) => this.errorMessage = err.error?.message || 'Stock limits reached. Quantities locked.'
    });
  }

  clearCart() {
    this.cartService.clearCart().subscribe({
      next: () => this.cart = null,
      error: (err) => this.errorMessage = err.error?.message || 'Failed to clear cart.'
    });
  }

  applyCoupon() {
    if (!this.couponCode) return;
    this.applyingCoupon = true;
    this.errorMessage = '';
    
    this.cartService.applyCoupon(this.couponCode).subscribe({
      next: () => {
        this.applyingCoupon = false;
        this.couponCode = '';
      },
      error: (err) => {
        this.applyingCoupon = false;
        this.errorMessage = err.error?.message || 'Invalid coupon details.';
      }
    });
  }

  removeCoupon() {
    this.cartService.removeCoupon().subscribe({
      error: (err) => this.errorMessage = err.error?.message || 'Failed to remove coupon.'
    });
  }

  proceedToPayment() {
    this.checkingOut = true;
    this.errorMessage = '';

    const appliedCoupon = this.cart ? this.cart.appliedCouponCode : null;

    this.paymentService.checkout(appliedCoupon).subscribe({
      next: (initRes) => {
        this.checkingOut = false;
        if (initRes.redirectUrl) {
          window.location.href = initRes.redirectUrl;
        } else {
          this.errorMessage = 'Failed to retrieve redirect URL from PhonePe Gateway.';
        }
      },
      error: (err) => {
        this.checkingOut = false;
        this.errorMessage = err.error?.message || 'Checkout failed. Stock availability may have changed. Please review details.';
      }
    });
  }

  setDefaultImage(event: any) {
    event.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="%236366f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>';
  }
}
