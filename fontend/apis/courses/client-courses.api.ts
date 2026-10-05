import authorizeAxiosInstance, { waitForSessionRefresh } from '@/lib/authorize-axios';
import type {
  ClientCoursesQuery,
  GetClientCoursesResponse,
  GetClientCourseResponse,
  GetClientCourseLessonsResponse,
} from './client-courses.type';
import type { ApiResponse } from '@/types/api';
import type { PageResponse } from '@/types/pagination';

export interface CourseEnrollment {
  Id: number;
  userId: number;
  courseId: number;
  courseTitle: string;
  enrollAt: string;
  completedAt: string | null;
  progressPercent: number;
}

export type EnrollCourseResponse = ApiResponse<CourseEnrollment | null>;
export type MyCoursesResponse = ApiResponse<PageResponse<CourseEnrollment>>;

async function getClientCourses(params: ClientCoursesQuery, signal?: AbortSignal) {
  // Public requests must not be rejected by an anonymous session bootstrap in progress.
  await waitForSessionRefresh();
  const response = await authorizeAxiosInstance.get<GetClientCoursesResponse>('/client/courses', {
    params,
    signal,
    localErrorHandling: true,
  });
  return response.data.data;
}

async function getDetail(courseId: number, signal?: AbortSignal) {
  await waitForSessionRefresh();
  const response = await authorizeAxiosInstance.get<GetClientCourseResponse>(
    `/client/courses/${courseId}`,
    {
      signal,
      localErrorHandling: true,
    },
  );
  return response.data.data;
}

async function getLessons(courseId: number, signal?: AbortSignal) {
  await waitForSessionRefresh();
  const response = await authorizeAxiosInstance.get<GetClientCourseLessonsResponse>(
    `/client/courses/${courseId}/lessons`,
    { signal, localErrorHandling: true },
  );
  return response.data.data;
}

async function enrollCourse(courseId: number) {
  const response = await authorizeAxiosInstance.post<EnrollCourseResponse | '' | null>(
    `/courses/${courseId}/enroll`,
    undefined,
    { localErrorHandling: true },
  );
  // The current controller also sends an empty 200 body for paid courses.
  return response.data === '' || response.data === null ? null : response.data.data;
}

async function getMyCourses(page: number, signal?: AbortSignal) {
  const response = await authorizeAxiosInstance.get<MyCoursesResponse>('/courses/my-courses', {
    params: { page, size: 12 },
    signal,
    localErrorHandling: true,
  });
  return response.data.data;
}

async function getAllMyCourseIds(signal?: AbortSignal) {
  const first = await getMyCourses(0, signal);
  const ids = first.content.map((enrollment) => enrollment.courseId);
  for (let page = 1; page < first.totalPages; page += 1) {
    const result = await getMyCourses(page, signal);
    ids.push(...result.content.map((enrollment) => enrollment.courseId));
  }
  return ids;
}

export const clientCoursesQueryKeys = {
  all: ['client-courses'] as const,
  list: (params: ClientCoursesQuery) => [...clientCoursesQueryKeys.all, params] as const,
  detail: (courseId: number) => [...clientCoursesQueryKeys.all, 'detail', courseId] as const,
  lessons: (courseId: number) =>
    [...clientCoursesQueryKeys.all, 'detail', courseId, 'lessons'] as const,
  enrollments: (userId: number) => ['course-enrollments', userId] as const,
};

export const clientCoursesAPI = {
  getClientCourses,
  getDetail,
  getLessons,
  enrollCourse,
  getMyCourses,
  getAllMyCourseIds,
};
