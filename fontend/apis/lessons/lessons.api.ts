import authorizeAxiosInstance from '@/lib/authorize-axios';
import type { ApiResponse } from '@/types/api';
import type { PageResponse } from '@/types/pagination';
import type { CreateLessonRequest, Lesson, LessonQuery } from './lessons.type';

async function getLessons({ courseId, page, size, search }: LessonQuery) {
  const response = await authorizeAxiosInstance.get<ApiResponse<PageResponse<Lesson>>>('/lessons', {
    params: { courseId, page: page - 1, size, search: search?.trim() || undefined },
    localErrorHandling: true,
  });
  return response.data.data;
}

async function create(data: CreateLessonRequest) {
  const response = await authorizeAxiosInstance.post<ApiResponse<Lesson>>('/lessons', data, {
    localErrorHandling: true,
  });
  return response.data.data;
}

async function deleteById(id: number) {
  await authorizeAxiosInstance.delete(`/lessons/${id}`, { localErrorHandling: true });
}

export const lessonAPI = { getLessons, create, deleteById };
