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
  id: number;
  userId: number;
  courseId: number;
  courseTitle: string;
  enrollAt: string;
  completedAt: string | null;
  progressPercent: number;
}

type CourseEnrollmentApiResponse = Omit<CourseEnrollment, 'id'> & { Id: number };

export type EnrollCourseResponse = ApiResponse<CourseEnrollmentApiResponse | null>;
export type MyCoursesResponse = ApiResponse<PageResponse<CourseEnrollmentApiResponse>>;
export interface MyCoursesQuery {
  page: number;
  size: number;
  courseTitle?: string;
}

function normalizeEnrollment({ Id, ...enrollment }: CourseEnrollmentApiResponse): CourseEnrollment {
  return { ...enrollment, id: Id };
}

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
  return response.data === '' || response.data === null || response.data.data === null
    ? null
    : normalizeEnrollment(response.data.data);
}

async function getMyCourses(params: MyCoursesQuery, signal?: AbortSignal) {
  const response = await authorizeAxiosInstance.get<MyCoursesResponse>('/courses/my-courses', {
    params,
    signal,
    localErrorHandling: true,
  });
  const page = response.data.data;
  return { ...page, content: page.content.map(normalizeEnrollment) };
}

async function getAllMyCourseIds(signal?: AbortSignal) {
  const first = await getMyCourses({ page: 0, size: 12 }, signal);
  const ids = first.content.map((enrollment) => enrollment.courseId);
  for (let page = 1; page < first.totalPages; page += 1) {
    const result = await getMyCourses({ page, size: 12 }, signal);
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
  enrollments: (userId: number) => ['course-enrollments', userId, 'ids'] as const,
  myCourses: (userId: number) => ['course-enrollments', userId, 'my-courses'] as const,
  myCoursesPage: (userId: number, params: MyCoursesQuery) =>
    [...clientCoursesQueryKeys.myCourses(userId), params] as const,
};

export const clientCoursesAPI = {
  getClientCourses,
  getDetail,
  getLessons,
  enrollCourse,
  getMyCourses,
  getAllMyCourseIds,
};
