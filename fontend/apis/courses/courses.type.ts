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
  createdAt: string | null;
}

export interface CourseQuery {
  title?: string;
  categoryId?: number;
  published?: boolean;
  pricing?: 'free' | 'paid';
  search: string;
  page: number;
  size: number;
}

export type GetCoursesResponse = ApiResponse<PageResponse<Course>>;

export interface CreateCourseRequest {
  title: string;
  categoryId: number;
  description: string;
  thumbnailId: number | null;
  isPublished: boolean;
  price: number;
}

export interface UpdateCourseRequest {
  title: string;
  categoryId: number;
  description: string;
  published: boolean;
  thumbnailId: number | null;
  levelId: number;
}

export type CourseResponse = ApiResponse<Course>;
