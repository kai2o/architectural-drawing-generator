import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = environment.apiUrl;

  private get storage(): Storage | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage;
    }
    return null;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        // Store token and user info (only in browser)
        if (this.storage) {
          this.storage.setItem('auth_token', response.token);
          this.storage.setItem('user', JSON.stringify(response.user));
        }
      })
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, userData).pipe(
      tap(response => {
        // Store token and user info (only in browser)
        if (this.storage) {
          this.storage.setItem('auth_token', response.token);
          this.storage.setItem('user', JSON.stringify(response.user));
        }
      })
    );
  }

  logout(): void {
    if (this.storage) {
      this.storage.removeItem('auth_token');
      this.storage.removeItem('user');
    }
  }

  isAuthenticated(): boolean {
    if (!this.storage) {
      return false; // Not in browser, not authenticated
    }
    return !!this.storage.getItem('auth_token');
  }

  getCurrentUser(): User | null {
    if (!this.storage) {
      return null;
    }
    const userStr = this.storage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    if (!this.storage) {
      return null;
    }
    return this.storage.getItem('auth_token');
  }
}

