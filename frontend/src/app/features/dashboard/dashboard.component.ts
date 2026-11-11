import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CountItem, Dashboard } from '../../core/models';
import { DashboardService } from '../../core/services/dashboard.service';
import { BadgeComponent } from '../../shared/components/badge.component';
import { extractErrorMessage } from '../../shared/utils/error.util';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, BadgeComponent],
  styleUrl: './dashboard.component.scss',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  private readonly service = inject(DashboardService);

  protected readonly data = signal<Dashboard | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly completionRate = computed(() => {
    const d = this.data();
    return d && d.totalTasks > 0 ? Math.round((d.completedTasks / d.totalTasks) * 100) : 0;
  });

  constructor() {
    this.service.get().subscribe({
      next: (d) => this.data.set(d),
      error: (e) => this.error.set(extractErrorMessage(e, 'Unable to load the dashboard.'))
    });
  }

  protected width(item: CountItem, items: CountItem[]): number {
    const max = Math.max(...items.map((i) => i.count), 1);
    return Math.round((item.count / max) * 100);
  }
}
