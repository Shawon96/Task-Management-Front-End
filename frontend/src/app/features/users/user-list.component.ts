import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { PaginatedResponse, USER_ROLES, User, UserRole } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserService } from '../../core/services/user.service';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { extractErrorMessage } from '../../shared/utils/error.util';

/** Admin-only screen: browse users and change their role. */
@Component({
  selector: 'app-user-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PaginationComponent],
  template: `
    <div class="page-header"><h1>Users</h1></div>

    <form class="toolbar" [formGroup]="filters" role="search">
      <input class="input" type="search" placeholder="Search by name or email…" aria-label="Search users" formControlName="keyword" />
    </form>

    @if (error()) {
      <div class="form-error" role="alert">{{ error() }}</div>
    }

    <div class="card">
      @if (loading() && !result()) {
        <div class="spinner">Loading…</div>
      } @else if (result()?.items?.length === 0) {
        <p class="empty">No users found.</p>
      } @else if (result(); as r) {
        <table class="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>
            @for (u of r.items; track u.id) {
              <tr>
                <td data-label="Name"><strong>{{ u.fullName }}</strong></td>
                <td data-label="Email">{{ u.email }}</td>
                <td data-label="Role">
                  <select
                    class="input"
                    [attr.aria-label]="'Role for ' + u.fullName"
                    [disabled]="u.id === auth.user()?.id"
                    [value]="u.role"
                    (change)="changeRole(u, $any($event.target).value)">
                    @for (role of roles; track role) {
                      <option [value]="role" [selected]="role === u.role">{{ role }}</option>
                    }
                  </select>
                </td>
              </tr>
            }
          </tbody>
        </table>
        <app-pagination [page]="page()" [pageSize]="pageSize" [totalCount]="r.totalCount" (pageChange)="goTo($event)" />
      }
    </div>
  `
})
export class UserListComponent {
  private readonly service = inject(UserService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);

  protected readonly roles = USER_ROLES;
  protected readonly result = signal<PaginatedResponse<User> | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly page = signal(1);
  protected readonly pageSize = 10;
  protected readonly filters = new FormGroup({ keyword: new FormControl('', { nonNullable: true }) });

  constructor() {
    this.filters.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged((a, b) => a.keyword === b.keyword), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(1);
        this.load();
      });
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.service
      .search({ pageNumber: this.page(), pageSize: this.pageSize, keyword: this.filters.controls.keyword.value.trim() })
      .subscribe({
        next: (r) => {
          this.result.set(r);
          this.error.set(null);
          this.loading.set(false);
        },
        error: (e) => {
          this.error.set(extractErrorMessage(e, 'Unable to load users.'));
          this.loading.set(false);
        }
      });
  }

  protected goTo(page: number): void {
    this.page.set(page);
    this.load();
  }

  protected changeRole(user: User, role: UserRole): void {
    if (role === user.role) return;
    this.service.updateRole(user.id, role).subscribe({
      next: () => {
        this.notifications.success(`${user.fullName} is now ${role}.`);
        this.load();
      },
      error: (e) => {
        this.notifications.error(extractErrorMessage(e, 'Unable to change the role.'));
        this.load();
      }
    });
  }
}
