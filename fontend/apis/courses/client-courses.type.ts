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
  title?: string;
  search?: string;
  categoryId?: number;
  published?: boolean;
  pricing?: 'free' | 'paid';
  page: number;
  size: number;
  sortKey?: 'id' | 'title' | 'price' | 'categoryName' | 'createdAt' | 'updatedAt' | 'isPublished';
  sortType?: 'ASC' | 'DESC';
}

export type GetClientCoursesResponse = ApiResponse<PageResponse<ClientCourse>>;

export interface ClientCourseDetail extends ClientCourse {
  updatedAt: string;
  totalDurationMinutes: number;
}

export interface ClientCourseLesson {
  id: number;
  title: string;
  slug: string;
  durationMinutes: number | null;
}

export type GetClientCourseResponse = ApiResponse<ClientCourseDetail>;
export type GetClientCourseLessonsResponse = ApiResponse<ClientCourseLesson[]>;
