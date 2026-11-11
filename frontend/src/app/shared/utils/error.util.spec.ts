import { HttpErrorResponse } from '@angular/common/http';
import { extractErrorMessage, extractFieldErrors } from './error.util';

describe('error.util', () => {
  it('prefers the first validation message', () => {
    const error = new HttpErrorResponse({ status: 400, error: { message: 'invalid', errors: { title: ['Title is required.'] } } });
    expect(extractErrorMessage(error)).toBe('Title is required.');
  });

  it('falls back to the API message, then the default', () => {
    expect(extractErrorMessage(new HttpErrorResponse({ status: 409, error: { message: 'Conflict!' } }))).toBe('Conflict!');
    expect(extractErrorMessage(new Error('boom'), 'default')).toBe('default');
  });

  it('extracts field errors', () => {
    const error = new HttpErrorResponse({ status: 400, error: { errors: { name: ['Required'] } } });
    expect(extractFieldErrors(error)).toEqual({ name: 'Required' });
  });
});
