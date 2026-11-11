import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthResponse } from '../models';
import { AuthService } from './auth.service';

const response: AuthResponse = {
  accessToken: 'access-1',
  accessTokenExpiresAt: new Date().toISOString(),
  refreshToken: 'refresh-1',
  user: { id: 1, fullName: 'Pat', email: 'pat@example.com', role: 'ProjectManager', isActive: true }
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('stores the session after login', () => {
    service.login({ email: 'pat@example.com', password: 'x' }).subscribe();
    http.expectOne((r) => r.url.endsWith('/auth/login')).flush(response);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.getAccessToken()).toBe('access-1');
    expect(service.canManage()).toBe(true);
    expect(localStorage.getItem('stm.refreshToken')).toBe('refresh-1');
  });

  it('shares a single refresh request between concurrent callers', () => {
    localStorage.setItem('stm.refreshToken', 'refresh-0');
    service.refresh().subscribe();
    service.refresh().subscribe();

    http.expectOne((r) => r.url.endsWith('/auth/refresh')).flush(response);
    expect(service.getAccessToken()).toBe('access-1');
  });

  it('clears the session', () => {
    service.login({ email: 'a', password: 'b' }).subscribe();
    http.expectOne((r) => r.url.endsWith('/auth/login')).flush(response);

    service.clearSession();

    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('stm.refreshToken')).toBeNull();
  });
});
