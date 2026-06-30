import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If unauthorized and it's not a login/refresh request, trigger token refresh
      if (error.status === 401 && !req.url.includes('/api/auth/login') && !req.url.includes('/api/auth/refresh')) {
        return authService.refreshToken().pipe(
          switchMap((refreshRes) => {
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${refreshRes.accessToken}`
              }
            });
            return next(retryReq);
          }),
          catchError((refreshErr) => {
            authService.logout(); // Refresh failed, clear session
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
