import authorizeAxiosInstance from '@/lib/authorize-axios';
import type { ApiResponse } from '@/types/api';
import type { QueryParams } from '@/types/query';
import type {
  CourseCategoryResponse,
  CourseCategoryDetail,
  GetCoursesResponse,
  ReqCreateCourseCategory,
} from './categories-course.type';

const getCategoriesCourse = async ({ page, size = 10, search }: QueryParams) => {
  const response = await authorizeAxiosInstance.get<GetCoursesResponse>('/course-categories', {
    params: {
      page: page - 1,
      size: Math.min(12, Math.max(1, size)),
      search: search?.trim() || undefined,
    },
  });
  return response.data;
};
const getById = async (id: number) => {
  const response = await authorizeAxiosInstance.get<ApiResponse<CourseCategoryDetail>>(
    `/course-categories/${id}`,
  );
  return response.data.data;
};
const create = async (data: ReqCreateCourseCategory) => {
  const response = await authorizeAxiosInstance.post<ApiResponse<CourseCategoryResponse>>(
    '/course-categories',
    data,
    { localErrorHandling: true },
  );
  return response.data.data;
};
const update = async (id: string | number, data: ReqCreateCourseCategory) => {
  const response = await authorizeAxiosInstance.put<ApiResponse<CourseCategoryResponse>>(
    `/course-categories/${id}`,
    data,
    { localErrorHandling: true },
  );
  return response.data.data;
};
const deleteByid = async (id: string | number) => {
  const response = await authorizeAxiosInstance.delete(`/course-categories/${id}`, {
    localErrorHandling: true,
  });
  return response.data;
};
export const categoryCourseAPI = { getCategoriesCourse, getById, create, update, deleteByid };
