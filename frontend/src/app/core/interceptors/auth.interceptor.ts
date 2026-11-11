import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

const isAuthEndpoint = (url: string) => /\/auth\/(login|register|refresh)$/.test(url);
const isApiRequest = (url: string) => url.startsWith(environment.apiUrl);

const withToken = (req: HttpRequest<unknown>, token: string | null) =>
  token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

/** Attaches the bearer token and transparently refreshes it once when the API answers 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  if (!isApiRequest(req.url) || isAuthEndpoint(req.url)) {
    return next(req);
  }

  return next(withToken(req, auth.getAccessToken())).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }
      return auth.refresh().pipe(
        switchMap((token) => next(withToken(req, token))),
        catchError((refreshError) => {
          auth.clearSession();
          auth.logout();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
