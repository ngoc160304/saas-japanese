import authorizeAxiosInstance from '@/lib/authorize-axios';
import type { CourseQuery, GetCoursesResponse } from './courses.type';

async function getCourses({ search, page, size }: CourseQuery) {
  const response = await authorizeAxiosInstance.get<GetCoursesResponse>('/courses', {
    params: { search, page: page - 1, size },
  });
  return response.data;
}

export const courseAPI = { getCourses };
