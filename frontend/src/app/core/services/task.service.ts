import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateTaskPayload, EntityId, PagedQuery, PaginatedResponse, Task, TaskQuery, TaskStatus, UpdateTaskPayload
} from '../models';
import { toParams } from './api-params';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/tasks`;

  search(query: PagedQuery & TaskQuery): Observable<PaginatedResponse<Task>> {
    return this.http.get<PaginatedResponse<Task>>(this.url, { params: toParams(query) });
  }

  get(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.url}/${id}`);
  }

  create(payload: CreateTaskPayload): Observable<EntityId> {
    return this.http.post<EntityId>(this.url, payload);
  }

  update(id: number, payload: UpdateTaskPayload): Observable<EntityId> {
    return this.http.put<EntityId>(`${this.url}/${id}`, payload);
  }

  assign(id: number, assigneeId: number | null): Observable<void> {
    return this.http.patch<void>(`${this.url}/${id}/assignee`, { assigneeId });
  }

  updateStatus(id: number, status: TaskStatus): Observable<void> {
    return this.http.patch<void>(`${this.url}/${id}/status`, { status });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
