import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Project, ProjectPayload } from '../../core/models';
import { NotificationService } from '../../core/services/notification.service';
import { ProjectService } from '../../core/services/project.service';
import { extractErrorMessage, extractFieldErrors } from '../../shared/utils/error.util';

function endAfterStart(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value as string;
  const end = group.get('endDate')?.value as string;
  return start && end && end < start ? { dateRange: true } : null;
}

const toDateInput = (value?: string | null) => (value ? value.substring(0, 10) : '');

@Component({
  selector: 'app-project-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './project-form.component.html'
})
export class ProjectFormComponent {
  /** Route param (`withComponentInputBinding`). Undefined when creating. */
  readonly id = input<string>();

  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly service = inject(ProjectService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly saving = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly serverErrors = signal<Record<string, string>>({});

  protected readonly form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.maxLength(150)]],
      description: ['', [Validators.maxLength(2000)]],
      startDate: [''],
      endDate: ['']
    },
    { validators: endAfterStart }
  );

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;
    this.loading.set(true);
    this.service.get(+id).subscribe({
      next: (p: Project) => {
        this.form.patchValue({
          name: p.name,
          description: p.description ?? '',
          startDate: toDateInput(p.startDate),
          endDate: toDateInput(p.endDate)
        });
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(extractErrorMessage(e, 'Unable to load the project.'));
        this.loading.set(false);
      }
    });
  }

  protected invalid(name: 'name' | 'description'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: ProjectPayload = {
      name: v.name.trim(),
      description: v.description.trim() || null,
      startDate: v.startDate || null,
      endDate: v.endDate || null
    };

    this.saving.set(true);
    this.error.set(null);
    this.serverErrors.set({});

    const request$ = this.isEdit() ? this.service.update(+this.id()!, payload) : this.service.create(payload);
    request$.subscribe({
      next: ({ id }) => {
        this.notifications.success(this.isEdit() ? 'Project updated.' : 'Project created.');
        void this.router.navigate(['/projects', id]);
      },
      error: (e) => {
        this.serverErrors.set(extractFieldErrors(e));
        this.error.set(extractErrorMessage(e, 'Unable to save the project.'));
        this.saving.set(false);
      }
    });
  }
}
