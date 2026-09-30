import authorizeAxiosInstance, { waitForSessionRefresh } from '@/lib/authorize-axios';
import type { ClientCoursesQuery, GetClientCoursesResponse } from './client-courses.type';

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

export const clientCoursesQueryKeys = {
  all: ['client-courses'] as const,
  list: (params: ClientCoursesQuery) => [...clientCoursesQueryKeys.all, params] as const,
};

export const clientCoursesAPI = { getClientCourses };
