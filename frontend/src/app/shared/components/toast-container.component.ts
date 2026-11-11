import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of notifications.toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast--' + toast.type" role="status">
          <span>{{ toast.message }}</span>
          <button type="button" class="toast__close" aria-label="Dismiss" (click)="notifications.dismiss(toast.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts { position: fixed; right: 1rem; bottom: 1rem; display: grid; gap: .5rem; z-index: 1000; max-width: min(24rem, calc(100vw - 2rem)); }
    .toast { display: flex; gap: .75rem; justify-content: space-between; align-items: start; padding: .75rem 1rem; border-radius: .5rem;
      color: #fff; box-shadow: 0 6px 20px rgba(0,0,0,.2); background: #334155; }
    .toast--success { background: #15803d; }
    .toast--error { background: #b91c1c; }
    .toast__close { background: none; border: 0; color: inherit; font-size: 1.25rem; line-height: 1; cursor: pointer; }
  `
})
export class ToastContainerComponent {
  protected readonly notifications = inject(NotificationService);
}
