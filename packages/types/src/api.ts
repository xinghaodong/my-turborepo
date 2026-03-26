export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  totalPages: number;
}
