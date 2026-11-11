import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ImproveDescriptionResult {
  originalDescription: string;
  improvedDescription: string;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);

  improveDescription(description: string, title?: string): Observable<ImproveDescriptionResult> {
    return this.http.post<ImproveDescriptionResult>(`${environment.apiUrl}/ai/improve-description`, {
      title: title || null,
      description
    });
  }
}
