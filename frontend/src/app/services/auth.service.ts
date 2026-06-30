import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../config';

export interface JwtResponse {
  token: string;
  refreshToken: string;
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/auth';
  private redirectUrl: string | null = null;

  login(usernameOrEmail: string, password: String): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/login`, { usernameOrEmail, password }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  register(username: string, email: string, password: String, role: string = 'customer'): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/register`, { username, email, password, role }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  refreshToken(): Observable<TokenRefreshResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post<TokenRefreshResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap(res => {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('refresh_token', res.refreshToken);
      })
    );
  }

  logout(): void {
    localStorage.clear();
    window.location.href = '/login';
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getUserRole(): string {
    return localStorage.getItem('user_role') || 'ROLE_CUSTOMER';
  }

  getUsername(): string {
    return localStorage.getItem('user_name') || '';
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  setRedirectUrl(url: string): void {
    this.redirectUrl = url;
  }

  getRedirectUrl(): string | null {
    const url = this.redirectUrl;
    this.redirectUrl = null;
    return url;
  }

  private saveSession(res: JwtResponse): void {
    localStorage.setItem('access_token', res.token);
    localStorage.setItem('refresh_token', res.refreshToken);
    localStorage.setItem('user_id', res.id);
    localStorage.setItem('user_name', res.username);
    localStorage.setItem('user_email', res.email);
    localStorage.setItem('user_role', res.role);
  }
}
