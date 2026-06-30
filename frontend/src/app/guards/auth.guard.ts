import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const requiredRole = route.data['role'] as string;
    const userRole = authService.getUserRole();

    // Admins can access everything, otherwise verify specific role
    if (!requiredRole || userRole === 'ROLE_ADMIN' || userRole === requiredRole) {
      return true;
    }

    // Role mismatch, redirect to appropriate home screens
    if (userRole === 'ROLE_GUARD') {
      router.navigate(['/guard']);
    } else if (userRole === 'ROLE_ADMIN') {
      router.navigate(['/admin']);
    } else {
      router.navigate(['/customer']);
    }
    return false;
  }

  // Not authenticated, redirect to login page
  authService.setRedirectUrl(state.url);
  router.navigate(['/login']);
  return false;
};
