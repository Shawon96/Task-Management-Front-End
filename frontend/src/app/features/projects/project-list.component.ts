import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { PaginatedResponse, Project } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProjectService } from '../../core/services/project.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { extractErrorMessage } from '../../shared/utils/error.util';

@Component({
  selector: 'app-project-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, PaginationComponent, ConfirmDialogComponent],
  templateUrl: './project-list.component.html'
})
export class ProjectListComponent {
  private readonly service = inject(ProjectService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);

  protected readonly result = signal<PaginatedResponse<Project> | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly toDelete = signal<Project | null>(null);
  protected readonly page = signal(1);
  protected readonly pageSize = 10;

  protected readonly filters = new FormGroup({
    keyword: new FormControl('', { nonNullable: true }),
    sort: new FormControl('createdDate:desc', { nonNullable: true })
  });

  constructor() {
    this.filters.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged((a, b) => a.keyword === b.keyword && a.sort === b.sort), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(1);
        this.load();
      });
    this.load();
  }

  protected load(): void {
    const [sortBy, sortDirection] = this.filters.controls.sort.value.split(':');
    this.loading.set(true);
    this.service
      .search({
        pageNumber: this.page(),
        pageSize: this.pageSize,
        keyword: this.filters.controls.keyword.value.trim(),
        sortBy,
        sortDirection: sortDirection as 'asc' | 'desc'
      })
      .subscribe({
        next: (r) => {
          this.result.set(r);
          this.error.set(null);
          this.loading.set(false);
        },
        error: (e) => {
          this.error.set(extractErrorMessage(e, 'Unable to load projects.'));
          this.loading.set(false);
        }
      });
  }

  protected goTo(page: number): void {
    this.page.set(page);
    this.load();
  }

  protected canManage(project: Project): boolean {
    const user = this.auth.user();
    return !!user && (user.role === 'Admin' || (user.role === 'ProjectManager' && project.ownerId === user.id));
  }

  protected confirmDelete(): void {
    const project = this.toDelete();
    if (!project) return;
    this.toDelete.set(null);
    this.service.delete(project.id).subscribe({
      next: () => {
        this.notifications.success('Project deleted.');
        this.load();
      },
      error: (e) => this.notifications.error(extractErrorMessage(e, 'Unable to delete the project.'))
    });
  }
}
