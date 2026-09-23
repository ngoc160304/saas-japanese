import authorizeAxiosInstance from '@/lib/authorize-axios';
import type { CourseQuery, GetCoursesResponse } from './courses.type';

async function getCourses({ search, page, size, categoryId, published, pricing }: CourseQuery) {
  const response = await authorizeAxiosInstance.get<GetCoursesResponse>('/courses', {
    params: { search, page: page - 1, size, categoryId, published, pricing },
  });
  return response.data;
}

export const courseAPI = { getCourses };
