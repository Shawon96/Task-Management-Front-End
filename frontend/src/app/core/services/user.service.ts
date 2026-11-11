import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedQuery, PaginatedResponse, User, UserRole } from '../models';
import { toParams } from './api-params';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/users`;

  search(query: Partial<PagedQuery> = {}): Observable<PaginatedResponse<User>> {
    return this.http.get<PaginatedResponse<User>>(this.url, {
      params: toParams({ pageNumber: 1, pageSize: 100, sortBy: 'fullName', sortDirection: 'asc', ...query })
    });
  }

  updateRole(id: number, role: UserRole): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}/role`, { role });
  }
}
