import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import {
  PaginatedResponse, Project, STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES, Task, TaskPriority, TaskStatus
} from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProjectService } from '../../core/services/project.service';
import { TaskService } from '../../core/services/task.service';
import { BadgeComponent } from '../../shared/components/badge.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { extractErrorMessage } from '../../shared/utils/error.util';

@Component({
  selector: 'app-task-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, BadgeComponent, PaginationComponent, ConfirmDialogComponent],
  templateUrl: './task-list.component.html'
})
export class TaskListComponent implements OnInit {
  /** Restricts the list to one project (also bound from the `?projectId=` query param). */
  readonly projectId = input<number | string | undefined>();
  /** Embedded inside the project page: hides the page header and the project filter. */
  readonly embedded = input(false);

  private readonly service = inject(TaskService);
  private readonly projects = inject(ProjectService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);

  protected readonly statuses = TASK_STATUSES;
  protected readonly priorities = TASK_PRIORITIES;
  protected readonly statusLabels = STATUS_LABELS;

  protected readonly result = signal<PaginatedResponse<Task> | null>(null);
  protected readonly projectOptions = signal<Project[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly toDelete = signal<Task | null>(null);
  protected readonly page = signal(1);
  protected readonly pageSize = 10;
  protected readonly effectiveProjectId = computed(() => {
    const id = this.projectId();
    return id ? Number(id) : null;
  });

  protected readonly filters = new FormGroup({
    keyword: new FormControl('', { nonNullable: true }),
    projectId: new FormControl('', { nonNullable: true }),
    status: new FormControl('', { nonNullable: true }),
    priority: new FormControl('', { nonNullable: true }),
    sort: new FormControl('createdDate:desc', { nonNullable: true })
  });

  ngOnInit(): void {
    const fixed = this.effectiveProjectId();
    if (fixed) {
      this.filters.controls.projectId.setValue(String(fixed), { emitEvent: false });
    } else {
      this.projects.search({ pageNumber: 1, pageSize: 100, sortBy: 'name', sortDirection: 'asc' })
        .subscribe((r) => this.projectOptions.set(r.items));
    }

    this.filters.valueChanges.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.page.set(1);
      this.load();
    });
    this.load();
  }

  protected load(): void {
    const f = this.filters.getRawValue();
    const [sortBy, sortDirection] = f.sort.split(':');
    this.loading.set(true);
    this.service
      .search({
        pageNumber: this.page(),
        pageSize: this.pageSize,
        keyword: f.keyword.trim(),
        sortBy,
        sortDirection: sortDirection as 'asc' | 'desc',
        projectId: f.projectId ? Number(f.projectId) : undefined,
        status: (f.status || undefined) as TaskStatus | undefined,
        priority: (f.priority || undefined) as TaskPriority | undefined
      })
      .subscribe({
        next: (r) => {
          this.result.set(r);
          this.error.set(null);
          this.loading.set(false);
        },
        error: (e) => {
          this.error.set(extractErrorMessage(e, 'Unable to load tasks.'));
          this.loading.set(false);
        }
      });
  }

  protected goTo(page: number): void {
    this.page.set(page);
    this.load();
  }

  /** Managers (server limits them to their own projects) and the assignee may change the status. */
  protected canChangeStatus(task: Task): boolean {
    const user = this.auth.user();
    return !!user && (user.role !== 'TeamMember' || task.assigneeId === user.id);
  }

  protected changeStatus(task: Task, status: string): void {
    this.service.updateStatus(task.id, status as TaskStatus).subscribe({
      next: () => {
        this.notifications.success('Status updated.');
        this.load();
      },
      error: (e) => {
        this.notifications.error(extractErrorMessage(e, 'Unable to update the status.'));
        this.load();
      }
    });
  }

  protected confirmDelete(): void {
    const task = this.toDelete();
    if (!task) return;
    this.toDelete.set(null);
    this.service.delete(task.id).subscribe({
      next: () => {
        this.notifications.success('Task deleted.');
        this.load();
      },
      error: (e) => this.notifications.error(extractErrorMessage(e, 'Unable to delete the task.'))
    });
  }
}
