import { ApiResponse } from '@/types/api';
import { PageResponse } from '@/types/pagination';

export interface CourseCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  mediaId: number | null;
  mediaUrl: string | null;
  courseCount: number;
  createdAt: string;
  updatedAt: string;
}
export interface ReqCreateCourseCategory {
  name: string;
  description?: string;
  mediaId?: number | null;
}

export interface CourseCategoryResponse {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  mediaId?: number | null;
  mediaUrl?: string | null;
  createdAt: string; // ISO Date String
  courseCount?: number | null;
  updatedAt: string; // ISO Date String
}

export type GetCoursesResponse = ApiResponse<PageResponse<CourseCategory>>;

export interface CourseCategoryDetail extends CourseCategory {
  lessonCount: number;
}
