import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { CatalogService, StoreDto } from './services/catalog.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule
  ],
  template: `
    <div class="app-container">
      <mat-toolbar class="nav-header">
        <span class="logo-text" routerLink="/">
          <span class="gradient-text">Smart</span>Scan
        </span>
        
        <div class="store-badge" *ngIf="activeStore">
          <mat-icon class="store-icon">storefront</mat-icon>
          <span class="store-name">{{ activeStore.name }}</span>
        </div>

        <span class="spacer"></span>

        <div class="nav-actions">
          <!-- Customer Cart Icon -->
          <button mat-icon-button class="nav-btn" routerLink="/customer/cart" *ngIf="showCustomerNav()" aria-label="View Cart">
            <mat-icon matBadge="{{ getCartItemCount() }}" matBadgeColor="accent" class="nav-icon">shopping_cart</mat-icon>
          </button>
          
          <button mat-icon-button class="nav-btn" routerLink="/customer/scanner" *ngIf="showCustomerNav()" aria-label="Scan Product">
            <mat-icon class="nav-icon">qr_code_scanner</mat-icon>
          </button>

          <!-- Guard Nav -->
          <button mat-button class="nav-link" routerLink="/guard" *ngIf="isGuard()">
            <mat-icon>security</mat-icon> Guard Verify
          </button>

          <!-- Admin Nav -->
          <button mat-button class="nav-link" routerLink="/admin" *ngIf="isAdmin()">
            <mat-icon>dashboard</mat-icon> Admin Console
          </button>

          <!-- Session Controls -->
          <span class="user-greeting" *ngIf="isAuthenticated()">Hi, {{ getUsername() }}</span>
          <button mat-flat-button class="logout-btn" (click)="logout()" *ngIf="isAuthenticated()">
            <mat-icon>logout</mat-icon> Sign Out
          </button>
        </div>
      </mat-toolbar>

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
    }

    .nav-header {
      background: rgba(18, 20, 32, 0.7) !important;
      backdrop-filter: var(--glass-blur);
      -webkit-backdrop-filter: var(--glass-blur);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 1000;
      height: 64px;
      padding: 0 24px;
      display: flex;
      align-items: center;
    }

    .logo-text {
      font-family: 'Outfit', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      cursor: pointer;
      color: var(--text-primary);
      margin-right: 20px;
    }

    .gradient-text {
      background: linear-gradient(135deg, #a5b4fc 0%, var(--primary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .store-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-color);
      padding: 6px 12px;
      border-radius: 50px;
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-left: 12px;
    }

    .store-icon {
      font-size: 1.1rem;
      width: auto;
      height: auto;
      color: var(--primary);
    }

    .spacer {
      flex: 1 1 auto;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .nav-btn {
      color: var(--text-secondary) !important;
      transition: var(--transition-smooth);

      &:hover {
        color: var(--text-primary) !important;
        background: rgba(255, 255, 255, 0.05);
      }
    }

    .nav-icon {
      font-size: 1.5rem;
    }

    .nav-link {
      color: var(--text-secondary) !important;
      font-family: 'Outfit', sans-serif;
      font-weight: 500;
      
      &:hover {
        color: var(--text-primary) !important;
        background: rgba(255, 255, 255, 0.05);
      }
    }

    .user-greeting {
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .logout-btn {
      background: rgba(239, 68, 68, 0.1) !important;
      color: var(--danger) !important;
      border: 1px solid rgba(239, 68, 68, 0.2) !important;
      border-radius: 12px !important;
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      
      &:hover {
        background: rgba(239, 68, 68, 0.2) !important;
      }
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    @media (max-width: 768px) {
      .nav-header {
        padding: 0 12px;
      }
      .user-greeting {
        display: none;
      }
      .store-name {
        max-width: 100px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  authService = inject(AuthService);
  cartService = inject(CartService);
  catalogService = inject(CatalogService);
  router = inject(Router);

  activeStore: StoreDto | null = null;
  cartItemCount = 0;

  ngOnInit() {
    // Sync cart details and store session details if logged in as customer
    if (this.isAuthenticated() && this.getUserRole() === 'ROLE_CUSTOMER') {
      this.cartService.fetchCart().subscribe({
        next: (cart) => {
          this.cartItemCount = this.calculateItems(cart);
          if (cart.storeId) {
            this.loadStoreDetails(cart.storeId);
          }
        },
        error: () => console.log('Cart fetch failed (probably fresh login required).')
      });
    }

    this.cartService.cart$.subscribe(cart => {
      if (cart) {
        this.cartItemCount = this.calculateItems(cart);
        if (cart.storeId && (!this.activeStore || this.activeStore.id !== cart.storeId)) {
          this.loadStoreDetails(cart.storeId);
        }
      } else {
        this.cartItemCount = 0;
        this.activeStore = null;
      }
    });
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  getUserRole(): string {
    return this.authService.getUserRole();
  }

  getUsername(): string {
    return this.authService.getUsername();
  }

  showCustomerNav(): boolean {
    return this.isAuthenticated() && this.getUserRole() === 'ROLE_CUSTOMER';
  }

  isGuard(): boolean {
    return this.isAuthenticated() && this.getUserRole() === 'ROLE_GUARD';
  }

  isAdmin(): boolean {
    return this.isAuthenticated() && this.getUserRole() === 'ROLE_ADMIN';
  }

  getCartItemCount(): number {
    return this.cartItemCount;
  }

  logout(): void {
    this.authService.logout();
  }

  private calculateItems(cart: any): number {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((acc: number, item: any) => acc + item.quantity, 0);
  }

  private loadStoreDetails(storeId: string) {
    this.catalogService.getStores().subscribe(stores => {
      const match = stores.find(s => s.id === storeId);
      if (match) {
        this.activeStore = match;
        localStorage.setItem('active_store_id', storeId);
      }
    });
  }
}
