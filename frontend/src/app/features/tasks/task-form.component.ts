import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { Project, STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES, Task, TaskPriority, TaskStatus, User } from '../../core/models';
import { AiService } from '../../core/services/ai.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProjectService } from '../../core/services/project.service';
import { TaskService } from '../../core/services/task.service';
import { UserService } from '../../core/services/user.service';
import { extractErrorMessage } from '../../shared/utils/error.util';

const toDateInput = (value?: string | null) => (value ? value.substring(0, 10) : '');

@Component({
  selector: 'app-task-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './task-form.component.html'
})
export class TaskFormComponent implements OnInit {
  /** Route param `:id` (edit) and query param `?projectId=` (create pre-selection). */
  readonly id = input<string>();
  readonly projectId = input<string>();

  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly tasks = inject(TaskService);
  private readonly projects = inject(ProjectService);
  private readonly users = inject(UserService);
  private readonly ai = inject(AiService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  protected readonly auth = inject(AuthService);

  protected readonly statuses = TASK_STATUSES;
  protected readonly priorities = TASK_PRIORITIES;
  protected readonly statusLabels = STATUS_LABELS;

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly projectOptions = signal<Project[]>([]);
  protected readonly userOptions = signal<User[]>([]);
  protected readonly originalAssigneeId = signal<number | null>(null);
  protected readonly readOnly = signal(false);
  protected readonly projectName = signal('');

  protected readonly improving = signal(false);
  protected readonly suggestion = signal<string | null>(null);

  protected readonly form = this.fb.group({
    projectId: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(4000)]],
    priority: ['Medium' as TaskPriority],
    status: ['ToDo' as TaskStatus],
    dueDate: [''],
    assigneeId: ['']
  });

  ngOnInit(): void {
    const canManage = this.auth.canManage();
    this.loading.set(true);

    if (canManage) {
      this.projects.search({ pageNumber: 1, pageSize: 100, sortBy: 'name', sortDirection: 'asc' })
        .subscribe((r) => this.projectOptions.set(r.items));
      this.users.search().subscribe((r) => this.userOptions.set(r.items));
    }

    const id = this.id();
    if (!id) {
      if (this.projectId()) this.form.controls.projectId.setValue(this.projectId()!);
      this.loading.set(false);
      return;
    }

    this.tasks.get(+id).subscribe({
      next: (t: Task) => {
        this.form.patchValue({
          projectId: String(t.projectId),
          title: t.title,
          description: t.description ?? '',
          priority: t.priority,
          status: t.status,
          dueDate: toDateInput(t.dueDate),
          assigneeId: t.assigneeId ? String(t.assigneeId) : ''
        });
        this.originalAssigneeId.set(t.assigneeId ?? null);
        this.projectName.set(t.projectName);
        if (!canManage) {
          this.readOnly.set(true);
          this.form.disable();
        } else {
          this.form.controls.projectId.disable(); // a task cannot move between projects
        }
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(extractErrorMessage(e, 'Unable to load the task.'));
        this.loading.set(false);
      }
    });
  }

  protected invalid(name: 'projectId' | 'title' | 'description'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }

  protected improveWithAi(): void {
    const { title, description } = this.form.getRawValue();
    if (!description.trim()) {
      this.notifications.info('Write a short description first, then let the AI improve it.');
      return;
    }
    this.improving.set(true);
    this.suggestion.set(null);
    this.ai.improveDescription(description.trim(), title.trim()).subscribe({
      next: (r) => {
        this.suggestion.set(r.improvedDescription);
        this.improving.set(false);
      },
      error: (e) => {
        this.notifications.error(extractErrorMessage(e, 'The AI assistant is unavailable right now.'));
        this.improving.set(false);
      }
    });
  }

  protected acceptSuggestion(): void {
    const text = this.suggestion();
    if (text) {
      this.form.controls.description.setValue(text.slice(0, 4000));
      this.form.controls.description.markAsDirty();
    }
    this.suggestion.set(null);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const description = v.description.trim() || null;
    const dueDate = v.dueDate || null;
    const assigneeId = v.assigneeId ? Number(v.assigneeId) : null;

    this.saving.set(true);
    this.error.set(null);

    const request$ = this.isEdit()
      ? this.tasks
          .update(+this.id()!, { title: v.title.trim(), description, priority: v.priority, status: v.status, dueDate })
          .pipe(
            switchMap(({ id }) =>
              assigneeId !== this.originalAssigneeId() ? this.tasks.assign(id, assigneeId) : of(undefined)
            )
          )
      : this.tasks
          .create({ projectId: Number(v.projectId), title: v.title.trim(), description, priority: v.priority, dueDate, assigneeId })
          .pipe(switchMap(() => of(undefined)));

    request$.subscribe({
      next: () => {
        this.notifications.success(this.isEdit() ? 'Task updated.' : 'Task created.');
        void this.router.navigate(['/projects', this.form.getRawValue().projectId || this.projectId()]);
      },
      error: (e) => {
        this.error.set(extractErrorMessage(e, 'Unable to save the task.'));
        this.saving.set(false);
      }
    });
  }
}
