import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EntityId, PagedQuery, PaginatedResponse, Project, ProjectPayload } from '../models';
import { toParams } from './api-params';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/projects`;

  search(query: PagedQuery): Observable<PaginatedResponse<Project>> {
    return this.http.get<PaginatedResponse<Project>>(this.url, { params: toParams(query) });
  }

  get(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.url}/${id}`);
  }

  create(payload: ProjectPayload): Observable<EntityId> {
    return this.http.post<EntityId>(this.url, payload);
  }

  update(id: number, payload: ProjectPayload): Observable<EntityId> {
    return this.http.put<EntityId>(`${this.url}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
