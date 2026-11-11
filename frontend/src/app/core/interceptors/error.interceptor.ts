import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { extractErrorMessage } from '../../shared/utils/error.util';

/**
 * Surfaces infrastructure-level failures globally (network down, 403, 429, 5xx).
 * Validation / business errors (400, 404, 409, 422) are left to the calling component.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 0) {
          notifications.error('Cannot reach the server. Check your connection.');
        } else if ([403, 429].includes(error.status) || error.status >= 500) {
          notifications.error(extractErrorMessage(error));
        }
      }
      return throwError(() => error);
    })
  );
};
