import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PaymentService } from '../../services/payment.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-payment-status',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule, MatButtonModule],
  template: `
    <div class="mobile-shell status-shell">
      <div class="glass-panel status-card">
        <!-- Verifying State -->
        <div class="state-container" *ngIf="state === 'verifying'">
          <mat-spinner diameter="60" color="primary"></mat-spinner>
          <h3>Verifying Payment...</h3>
          <p>Please wait while we confirm your payment status with PhonePe.</p>
        </div>

        <!-- Success State -->
        <div class="state-container success-state" *ngIf="state === 'success'">
          <div class="glow-icon-success">
            <mat-icon>check_circle</mat-icon>
          </div>
          <h2 class="neon-text-accent">Payment Successful!</h2>
          <p>Your payment has been successfully verified. Loading your digital receipt...</p>
        </div>

        <!-- Failure State -->
        <div class="state-container failure-state" *ngIf="state === 'error'">
          <div class="glow-icon-error">
            <mat-icon>error</mat-icon>
          </div>
          <h2 class="neon-text-primary">Payment Failed</h2>
          <p class="error-msg">{{ errorMessage }}</p>
          <button class="primary-button back-btn" (click)="goBackToCart()">
            <mat-icon>shopping_cart</mat-icon> Return to Cart
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .status-shell {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 64px);
    }
    .status-card {
      width: 100%;
      text-align: center;
      padding: 48px 24px;
    }
    .state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      
      h2, h3 {
        margin: 0;
      }
      p {
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.5;
        max-width: 300px;
      }
    }
    .glow-icon-success {
      font-size: 4rem;
      width: auto;
      height: auto;
      color: var(--accent);
      filter: drop-shadow(0 0 15px var(--accent-glow));
      mat-icon {
        font-size: 4rem;
        width: auto;
        height: auto;
      }
    }
    .glow-icon-error {
      font-size: 4rem;
      width: auto;
      height: auto;
      color: var(--danger);
      filter: drop-shadow(0 0 15px rgba(239, 68, 68, 0.4));
      mat-icon {
        font-size: 4rem;
        width: auto;
        height: auto;
      }
    }
    .error-msg {
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.15);
      color: var(--danger) !important;
      padding: 12px 18px;
      border-radius: 12px;
      font-size: 0.85rem !important;
    }
    .back-btn {
      margin-top: 12px;
    }
  `]
})
export class PaymentStatusComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentService = inject(PaymentService);
  private cartService = inject(CartService);

  state: 'verifying' | 'success' | 'error' = 'verifying';
  errorMessage = '';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const orderNumber = params['orderNumber'] || params['transactionId'];
      if (!orderNumber) {
        this.state = 'error';
        this.errorMessage = 'No transaction/order identifier was found in the redirection parameters.';
        return;
      }

      this.verifyPayment(orderNumber);
    });
  }

  retryCount = 0;
  maxRetries = 15; // 15 attempts * 3 seconds = 45 seconds polling window

  verifyPayment(orderNumber: string) {
    this.paymentService.verifyPhonePeStatus(orderNumber).subscribe({
      next: (order) => {
        this.state = 'success';
        this.cartService.clearCart().subscribe();
        
        setTimeout(() => {
          this.router.navigate(['/customer/receipt', order.orderNumber]);
        }, 1500);
      },
      error: (err) => {
        const errorMsg = err.error?.message;
        if (errorMsg === 'PAYMENT_PENDING' && this.retryCount < this.maxRetries) {
          this.retryCount++;
          setTimeout(() => {
            this.verifyPayment(orderNumber);
          }, 3000);
        } else {
          this.state = 'error';
          this.errorMessage = errorMsg === 'PAYMENT_PENDING'
            ? 'Verification timeout. PhonePe is taking longer than expected to process your payment. Please contact support or check your app.'
            : (errorMsg || 'Payment status verification failed. PhonePe reported incomplete transaction or error.');
        }
      }
    });
  }

  goBackToCart() {
    this.router.navigate(['/customer/cart']);
  }
}
