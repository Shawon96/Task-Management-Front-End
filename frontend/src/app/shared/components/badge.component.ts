import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { STATUS_LABELS, TaskStatus } from '../../core/models';

/** Colour-coded badge for task status or priority. */
@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="'badge badge--' + value().toLowerCase()">{{ label() }}</span>`
})
export class BadgeComponent {
  readonly value = input.required<string>();
  readonly label = computed(() => STATUS_LABELS[this.value() as TaskStatus] ?? this.value());
}
