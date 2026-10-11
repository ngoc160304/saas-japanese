import authorizeAxiosInstance from '@/lib/authorize-axios';
import type { ApiResponse } from '@/types/api';
import type { PageResponse } from '@/types/pagination';
import type { AttachLessonVideoRequest, CreateLessonRequest, Lesson, LessonQuery, UpdateLessonGrammarRequest, UpdateLessonPublicationRequest, UpdateLessonRequest } from './lessons.type';

async function getLessons({ courseId, page, size, search, sortKey, sortType }: LessonQuery) {
  const response = await authorizeAxiosInstance.get<ApiResponse<PageResponse<Lesson>>>('/lessons', {
    params: {
      courseId,
      page: page - 1,
      size,
      search: search?.trim() || undefined,
      sortKey,
      sortType,
    },
    localErrorHandling: true,
  });
  return response.data.data;
}

async function getCourseCurriculum(courseId: number) {
  const first = await getLessons({ courseId, page: 1, size: 12, sortKey: 'id', sortType: 'ASC' });
  const lessons = [...first.content];
  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = await getLessons({ courseId, page, size: 12, sortKey: 'id', sortType: 'ASC' });
    lessons.push(...next.content);
  }
  return lessons;
}

async function getById(id: number) {
  const response = await authorizeAxiosInstance.get<ApiResponse<Lesson>>(`/lessons/${id}`, {
    localErrorHandling: true,
  });
  return response.data.data;
}

async function update({ id, data }: { id: number; data: UpdateLessonRequest }) {
  const response = await authorizeAxiosInstance.put<ApiResponse<Lesson>>(`/lessons/${id}`, data, {
    localErrorHandling: true,
  });
  return response.data.data;
}

async function updateGrammar({ id, data }: { id: number; data: UpdateLessonGrammarRequest }) {
  const response = await authorizeAxiosInstance.patch<ApiResponse<Lesson>>(`/lessons/${id}/grammar`, data, {
    localErrorHandling: true,
  });
  return response.data.data;
}

async function updatePublication({ id, data }: { id: number; data: UpdateLessonPublicationRequest }) {
  const response = await authorizeAxiosInstance.patch<ApiResponse<Lesson>>(`/lessons/${id}/publication`, data, {
    localErrorHandling: true,
  });
  return response.data.data;
}

async function attachVideo({ id, data }: { id: number; data: AttachLessonVideoRequest }) {
  const response = await authorizeAxiosInstance.patch<ApiResponse<Lesson>>(`/lessons/${id}/video`, data, {
    localErrorHandling: true,
  });
  return response.data.data;
}

async function detachVideo(id: number) {
  const response = await authorizeAxiosInstance.delete<ApiResponse<Lesson>>(`/lessons/${id}/video`, {
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

export const lessonAPI = { getLessons, getCourseCurriculum, getById, update, updateGrammar, updatePublication, attachVideo, detachVideo, create, deleteById };
