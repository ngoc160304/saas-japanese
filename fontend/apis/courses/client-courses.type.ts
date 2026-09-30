import type { ApiResponse } from '@/types/api';
import type { PageResponse } from '@/types/pagination';

export interface ClientCourse {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  categoryName: string | null;
  lessonCount: number;
  price: number;
  // Keep the exact spelling used by the public backend contract.
  thumnailURL: string | null;
}

export interface ClientCoursesQuery {
  page: number;
  size: number;
}

export type GetClientCoursesResponse = ApiResponse<PageResponse<ClientCourse>>;
