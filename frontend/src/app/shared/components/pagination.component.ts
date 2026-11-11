import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalCount() > 0) {
      <nav class="pagination" aria-label="Pagination">
        <span class="muted">{{ from() }}–{{ to() }} of {{ totalCount() }}</span>
        <div class="pagination__controls">
          <button class="btn btn--ghost btn--sm" type="button" [disabled]="page() <= 1" (click)="pageChange.emit(page() - 1)">
            Previous
          </button>
          <span class="pagination__page">Page {{ page() }} / {{ totalPages() }}</span>
          <button class="btn btn--ghost btn--sm" type="button" [disabled]="page() >= totalPages()" (click)="pageChange.emit(page() + 1)">
            Next
          </button>
        </div>
      </nav>
    }
  `,
  styles: `
    .pagination { display: flex; flex-wrap: wrap; gap: .75rem; align-items: center; justify-content: space-between; margin-top: 1rem; }
    .pagination__controls { display: flex; gap: .5rem; align-items: center; }
    .pagination__page { font-size: .875rem; }
  `
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalCount = input.required<number>();
  readonly pageChange = output<number>();

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));
  readonly from = computed(() => (this.page() - 1) * this.pageSize() + 1);
  readonly to = computed(() => Math.min(this.page() * this.pageSize(), this.totalCount()));
}
