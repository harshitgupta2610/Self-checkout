import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'store-session',
    pathMatch: 'full'
  },
  {
    path: 'store-session',
    loadComponent: () => import('./components/store-session/store-session.component').then(c => c.StoreSessionComponent)
  },
  {
    path: 'store-session/:qrIdentifier',
    loadComponent: () => import('./components/store-session/store-session.component').then(c => c.StoreSessionComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(c => c.RegisterComponent)
  },
  {
    path: 'customer',
    canActivate: [authGuard],
    data: { role: 'ROLE_CUSTOMER' },
    children: [
      {
        path: '',
        redirectTo: 'scanner',
        pathMatch: 'full'
      },
      {
        path: 'scanner',
        loadComponent: () => import('./components/scanner/scanner.component').then(c => c.ScannerComponent)
      },
      {
        path: 'cart',
        loadComponent: () => import('./components/cart/cart.component').then(c => c.CartComponent)
      },
      {
        path: 'receipt/:orderNumber',
        loadComponent: () => import('./components/receipt/receipt.component').then(c => c.ReceiptComponent)
      },
      {
        path: 'payment-status',
        loadComponent: () => import('./components/payment-status/payment-status.component').then(c => c.PaymentStatusComponent)
      }
    ]
  },
  {
    path: 'guard',
    canActivate: [authGuard],
    data: { role: 'ROLE_GUARD' },
    loadComponent: () => import('./components/guard-verify/guard-verify.component').then(c => c.GuardVerifyComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { role: 'ROLE_ADMIN' },
    loadComponent: () => import('./components/admin/admin.component').then(c => c.AdminComponent)
  },
  {
    path: '**',
    redirectTo: 'store-session'
  }
];
