import authorizeAxiosInstance from '@/lib/authorize-axios';
import type {
  CourseQuery,
  CourseResponse,
  CreateCourseRequest,
  GetCoursesResponse,
  UpdateCourseRequest,
} from './courses.type';

async function getCourses({ search, title, page, size, categoryId, published, pricing }: CourseQuery) {
  const response = await authorizeAxiosInstance.get<GetCoursesResponse>('/courses', {
    params: { search, title, page: page - 1, size, categoryId, published, pricing },
  });
  return response.data;
}

async function getById(id: number) {
  const response = await authorizeAxiosInstance.get<CourseResponse>(`/courses/${id}`);
  return response.data.data;
}

async function create(data: CreateCourseRequest) {
  const response = await authorizeAxiosInstance.post<CourseResponse>('/courses', data, {
    localErrorHandling: true,
  });
  return response.data.data;
}

async function update(id: string | number, data: UpdateCourseRequest) {
  const response = await authorizeAxiosInstance.put<CourseResponse>(`/courses/${id}`, data, {
    localErrorHandling: true,
  });
  return response.data.data;
}

async function deleteById(id: number) {
  await authorizeAxiosInstance.delete(`/courses/${id}`, { localErrorHandling: true });
}

export const courseAPI = { getCourses, getById, create, update, deleteById };
