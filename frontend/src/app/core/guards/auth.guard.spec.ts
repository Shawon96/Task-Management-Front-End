import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { roleGuard } from './auth.guard';

describe('roleGuard', () => {
  const run = (hasRole: boolean) => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { hasRole: () => hasRole } }]
    });
    return TestBed.runInInjectionContext(() => roleGuard('Admin')({} as never, {} as never));
  };

  it('allows users with a permitted role', () => {
    expect(run(true)).toBe(true);
  });

  it('redirects other users to the dashboard', () => {
    const result = run(false);
    expect(result instanceof UrlTree).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/dashboard');
  });
});
