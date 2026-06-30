import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentService, OrderDto } from '../../services/payment.service';

@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="mobile-shell receipt-shell">
      <!-- Loading spinner -->
      <div class="glass-panel loading-card" *ngIf="loading">
        <mat-spinner diameter="40" color="primary"></mat-spinner>
        <p>Generating secure receipt invoice...</p>
      </div>

      <!-- Success Receipt details -->
      <div class="receipt-success-flow" *ngIf="!loading && order">
        <div class="glass-panel success-header-card">
          <div class="success-glowing-ring">
            <mat-icon>check_circle</mat-icon>
          </div>
          <h2 class="neon-text-accent">Payment Success!</h2>
          <p class="success-subtitle">Order #{{ order.orderNumber }} is confirmed</p>
        </div>

        <!-- Secure exit QR Code -->
        <div class="glass-panel qr-display-card">
          <h3 class="qr-title">Exit Gate Pass</h3>
          <p class="qr-info-text">Show this QR code to the security guard at the store exit gate for check out validation.</p>
          
          <div class="qr-frame">
            <img [src]="getQrCodeUrl(order.receiptQrToken)" alt="Gate Pass Receipt QR Code">
          </div>
          
          <div class="qr-badge" [ngClass]="order.status.toLowerCase()">
            <mat-icon>security</mat-icon>
            <span>Status: {{ order.status }}</span>
          </div>
        </div>

        <!-- Printable Invoice Summary -->
        <div class="glass-panel invoice-card">
          <div class="invoice-header">
            <span class="store-nme">{{ order.storeName }}</span>
            <span class="store-adr">{{ order.storeAddress }}</span>
            <span class="bill-time">{{ order.createdAt | date:'medium' }}</span>
          </div>

          <div class="invoice-divider"></div>

          <div class="invoice-items">
            <div class="invoice-item-row" *ngFor="let item of order.items">
              <div class="item-meta">
                <span class="item-nme">{{ item.productName }}</span>
                <span class="item-qty-rate">{{ item.quantity }} x ₹{{ item.unitPrice | number:'1.2-2' }}</span>
              </div>
              <span class="item-total-cost">₹{{ item.finalAmount | number:'1.2-2' }}</span>
            </div>
          </div>

          <div class="invoice-divider"></div>

          <div class="invoice-bill-breakdown">
            <div class="breakdown-row">
              <span>Subtotal (Excl. Tax)</span>
              <span>₹{{ order.subtotal | number:'1.2-2' }}</span>
            </div>
            <div class="breakdown-row">
              <span>GST Charged</span>
              <span>₹{{ order.taxAmount | number:'1.2-2' }}</span>
            </div>
            <div class="breakdown-row discount-saving" *ngIf="order.discountAmount > 0">
              <span>Coupon Discount Saved</span>
              <span>- ₹{{ order.discountAmount | number:'1.2-2' }}</span>
            </div>
            <div class="breakdown-row invoice-grand-total">
              <span>Total Paid</span>
              <span>₹{{ order.finalAmount | number:'1.2-2' }}</span>
            </div>
          </div>

          <div class="invoice-footer">
            <mat-icon>favorite</mat-icon>
            <span>Thank you for shopping with us!</span>
          </div>
        </div>

        <button class="primary-button shop-more-btn" routerLink="/customer/scanner">
          <mat-icon>shopping_bag</mat-icon> Shop Again
        </button>
      </div>

      <!-- Error State -->
      <div class="glass-panel err-card" *ngIf="!loading && !order">
        <mat-icon class="err-icon">warning</mat-icon>
        <h3>Failed to fetch receipt</h3>
        <p>No confirmed order matching the code was found.</p>
        <button class="glass-button" routerLink="/">Return Home</button>
      </div>
    </div>
  `,
  styles: [`
    .receipt-shell {
      padding-top: 16px;
      gap: 16px;
    }

    .loading-card, .err-card {
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
    }

    .err-icon {
      font-size: 3.5rem;
      width: auto;
      height: auto;
      color: var(--danger);
    }

    .receipt-success-flow {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .success-header-card {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .success-glowing-ring {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid var(--accent-glow);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px 0 rgba(16, 185, 129, 0.2);
      margin-bottom: 8px;
      
      mat-icon {
        font-size: 2.2rem;
        width: auto;
        height: auto;
        color: var(--accent);
      }
    }

    .success-subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    /* QR Code exit card */
    .qr-display-card {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .qr-title {
      font-size: 1.05rem;
      color: var(--text-primary);
    }

    .qr-info-text {
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.4;
      max-width: 320px;
    }

    .qr-frame {
      background: white;
      padding: 16px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--card-shadow);
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin: 8px 0;
      
      img {
        width: 180px;
        height: 180px;
        display: block;
      }
    }

    .qr-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 50px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      
      mat-icon {
        font-size: 1rem;
        width: auto;
        height: auto;
      }
      
      &.paid {
        background: rgba(16, 185, 129, 0.08);
        color: var(--accent);
        border: 1px solid var(--accent-glow);
      }
      
      &.verified {
        background: rgba(99, 102, 241, 0.08);
        color: var(--primary);
        border: 1px solid var(--border-color-glow);
      }
    }

    /* Invoice styles */
    .invoice-card {
      display: flex;
      flex-direction: column;
      gap: 14px;
      font-family: monospace;
      color: var(--text-primary);
      background: rgba(17, 22, 34, 0.95);
      border-style: dashed; // looks like receipt tear edge
    }

    .invoice-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 2px;
    }

    .store-nme {
      font-family: 'Outfit', sans-serif;
      font-size: 1rem;
      font-weight: 700;
    }

    .store-adr {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .bill-time {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .invoice-divider {
      border-top: 1px dashed var(--border-color);
      width: 100%;
    }

    .invoice-items {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .invoice-item-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 0.8rem;
    }

    .item-meta {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .item-nme {
      font-weight: 600;
    }

    .item-qty-rate {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .item-total-cost {
      font-weight: 700;
    }

    .invoice-bill-breakdown {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .breakdown-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .discount-saving {
      color: var(--accent);
      font-weight: 600;
    }

    .invoice-grand-total {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-top: 6px;
    }

    .invoice-footer {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: var(--text-muted);
      font-size: 0.75rem;
      gap: 4px;
      margin-top: 8px;
      
      mat-icon {
        font-size: 1rem;
        width: auto;
        height: auto;
        color: var(--danger);
      }
    }

    .shop-more-btn {
      width: 100%;
      height: 48px;
      margin-top: 8px;
    }
  `]
})
export class ReceiptComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private paymentService = inject(PaymentService);

  loading = true;
  order: OrderDto | null = null;

  ngOnInit() {
    const orderNumber = this.route.snapshot.paramMap.get('orderNumber');
    if (orderNumber) {
      this.fetchOrderReceipt(orderNumber);
    }
  }

  fetchOrderReceipt(orderNumber: string) {
    this.loading = true;
    this.paymentService.getOrderDetailsByNumber(orderNumber).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  getQrCodeUrl(token: string): string {
    // Generate secure dynamic QR code URL
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(token)}`;
  }
}
