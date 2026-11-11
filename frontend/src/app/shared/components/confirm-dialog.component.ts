import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop" (click)="cancelled.emit()">
      <div class="dialog card" role="alertdialog" aria-modal="true" [attr.aria-label]="title()" (click)="$event.stopPropagation()">
        <h2>{{ title() }}</h2>
        <p class="muted">{{ message() }}</p>
        <div class="dialog__actions">
          <button type="button" class="btn btn--ghost" (click)="cancelled.emit()">Cancel</button>
          <button type="button" class="btn btn--danger" (click)="confirmed.emit()">{{ confirmLabel() }}</button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); display: grid; place-items: center; z-index: 900; padding: 1rem; }
    .dialog { width: min(26rem, 100%); }
    .dialog__actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1.25rem; }
  `
})
export class ConfirmDialogComponent {
  readonly title = input('Are you sure?');
  readonly message = input.required<string>();
  readonly confirmLabel = input('Delete');
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
