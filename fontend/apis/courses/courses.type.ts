import type { ApiResponse } from '@/types/api';
import type { PageResponse } from '@/types/pagination';

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  published: boolean;
  categoryName: string | null;
  lessonCount: number | null;
  price: number | null;
  // Keep the spelling used by CourseResponse.java.
  thumnailURL: string | null;
  // The current mapper does not populate this field.
  createdAt: string | null;
}

export interface CourseQuery {
  search: string;
  page: number;
  size: number;
}

export type GetCoursesResponse = ApiResponse<PageResponse<Course>>;
