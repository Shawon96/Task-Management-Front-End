import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User, UserRole } from '../models';

const REFRESH_KEY = 'stm.refreshToken';

/**
 * Holds the session. The short-lived access token lives only in memory; the refresh token is kept
 * in localStorage so the session survives a reload (trade-off documented in the README).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly _user = signal<User | null>(null);
  private accessToken: string | null = null;
  private refreshInFlight$: Observable<string> | null = null;

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly role = computed(() => this._user()?.role ?? null);
  readonly canManage = computed(() => this.role() === 'Admin' || this.role() === 'ProjectManager');

  getAccessToken(): string | null {
    return this.accessToken;
  }

  hasRole(...roles: UserRole[]): boolean {
    const role = this.role();
    return role !== null && roles.includes(role);
  }

  login(request: LoginRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request).pipe(map((r) => this.startSession(r)));
  }

  register(request: RegisterRequest): Observable<User> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request).pipe(map((r) => this.startSession(r)));
  }

  /** Called once at app start: restores the session from the stored refresh token. */
  restoreSession(): Observable<boolean> {
    if (!this.readRefreshToken()) {
      return of(false);
    }
    return this.refresh().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /** Rotates the refresh token. Concurrent callers share one request. */
  refresh(): Observable<string> {
    const token = this.readRefreshToken();
    if (!token) {
      return throwError(() => new Error('No refresh token'));
    }
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, { refreshToken: token }).pipe(
        map((r) => {
          this.startSession(r);
          return r.accessToken;
        }),
        finalize(() => (this.refreshInFlight$ = null)),
        shareReplay(1)
      );
    }
    return this.refreshInFlight$;
  }

  logout(): void {
    const token = this.readRefreshToken();
    if (token && this.accessToken) {
      // Best effort: revoke server-side, but never block the local sign-out.
      this.http.post(`${this.baseUrl}/logout`, { refreshToken: token }).pipe(catchError(() => of(null))).subscribe();
    }
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  /** Clears local state without calling the API (used when a refresh fails). */
  clearSession(): void {
    this.accessToken = null;
    this._user.set(null);
    try {
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      /* storage unavailable */
    }
  }

  private startSession(response: AuthResponse): User {
    this.accessToken = response.accessToken;
    this._user.set(response.user);
    try {
      localStorage.setItem(REFRESH_KEY, response.refreshToken);
    } catch {
      /* storage unavailable: session lasts until reload */
    }
    return response.user;
  }

  private readRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  }
}
