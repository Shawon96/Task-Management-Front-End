import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';

const managers = roleGuard('Admin', 'ProjectManager');

export const PROJECT_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./project-list.component').then((m) => m.ProjectListComponent) },
  { path: 'new', canActivate: [managers], loadComponent: () => import('./project-form.component').then((m) => m.ProjectFormComponent) },
  { path: ':id', loadComponent: () => import('./project-detail.component').then((m) => m.ProjectDetailComponent) },
  { path: ':id/edit', canActivate: [managers], loadComponent: () => import('./project-form.component').then((m) => m.ProjectFormComponent) }
];
