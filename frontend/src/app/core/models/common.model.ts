export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface PagedQuery {
  pageNumber: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  keyword?: string;
}

export interface EntityId {
  id: number;
}

export interface CountItem {
  label: string;
  count: number;
}

/** Uniform error envelope returned by the API. */
export interface ApiError {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
  traceId?: string;
}
