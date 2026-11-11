import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { extractErrorMessage } from '../../shared/utils/error.util';
import { TaskListComponent } from '../tasks/task-list.component';

@Component({
  selector: 'app-project-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, TaskListComponent],
  template: `
    @if (error()) {
      <div class="form-error" role="alert">{{ error() }}</div>
      <a class="btn btn--ghost" routerLink="/projects">Back to projects</a>
    } @else if (project(); as p) {
      <div class="page-header">
        <div>
          <h1>{{ p.name }}</h1>
          <span class="muted">Owner: {{ p.ownerName }}</span>
        </div>
        <div style="display:flex; gap:.5rem">
          <a class="btn btn--ghost" routerLink="/projects">Back</a>
          @if (canManage()) {
            <a class="btn btn--ghost" [routerLink]="['/projects', p.id, 'edit']">Edit</a>
            <a class="btn" [routerLink]="['/tasks/new']" [queryParams]="{ projectId: p.id }">+ Add task</a>
          }
        </div>
      </div>

      <section class="card" style="margin-bottom:1rem">
        <p>{{ p.description || 'No description provided.' }}</p>
        <p class="muted">
          @if (p.startDate || p.endDate) {
            {{ p.startDate ? (p.startDate | date: 'mediumDate' : 'UTC') : '…' }} → {{ p.endDate ? (p.endDate | date: 'mediumDate' : 'UTC') : '…' }} ·
          }
          {{ p.completedTaskCount }} of {{ p.taskCount }} tasks completed
        </p>
      </section>

      <h2>Tasks</h2>
      <app-task-list [projectId]="p.id" [embedded]="true" />
    } @else {
      <div class="spinner">Loading…</div>
    }
  `
})
export class ProjectDetailComponent {
  readonly id = input.required<string>();

  private readonly service = inject(ProjectService);
  private readonly auth = inject(AuthService);

  protected readonly project = signal<Project | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.service.get(+this.id()).subscribe({
      next: (p) => this.project.set(p),
      error: (e) => this.error.set(extractErrorMessage(e, 'Unable to load the project.'))
    });
  }

  protected canManage(): boolean {
    const user = this.auth.user();
    const p = this.project();
    return !!user && !!p && (user.role === 'Admin' || (user.role === 'ProjectManager' && p.ownerId === user.id));
  }
}
