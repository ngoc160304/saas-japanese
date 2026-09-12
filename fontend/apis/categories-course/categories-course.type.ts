import { ApiResponse } from '@/types/api';
import { PageResponse } from '@/types/pagination';

export interface CourseCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  mediaId: number;
  mediaUrl: string;
  courseCount: number;
  createdAt: string;
  updatedAt: string;
}

export type GetCoursesResponse = ApiResponse<PageResponse<CourseCategory>>;
