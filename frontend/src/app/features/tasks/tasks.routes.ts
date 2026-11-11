import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';

const managers = roleGuard('Admin', 'ProjectManager');

export const TASK_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./task-list.component').then((m) => m.TaskListComponent) },
  { path: 'new', canActivate: [managers], loadComponent: () => import('./task-form.component').then((m) => m.TaskFormComponent) },
  { path: ':id/edit', loadComponent: () => import('./task-form.component').then((m) => m.TaskFormComponent) }
];
