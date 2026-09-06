export interface ApiResponse<T> {
  data: T;
  error: string | null;
  message: string;
  statusCode: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
