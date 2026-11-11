import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../../core/models';

export function extractErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as Partial<ApiError> | null;
    if (body?.errors) {
      const first = Object.values(body.errors).flat()[0];
      if (first) return first;
    }
    if (body?.message) return body.message;
  }
  return fallback;
}

/** Field-level errors from a 400 response, keyed by camelCase field name. */
export function extractFieldErrors(error: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (error instanceof HttpErrorResponse) {
    const errors = (error.error as Partial<ApiError> | null)?.errors;
    for (const [field, messages] of Object.entries(errors ?? {})) {
      result[field] = messages[0];
    }
  }
  return result;
}
