import authorizeAxiosInstance from '@/lib/authorize-axios';
import type { ApiResponse } from '@/types/api';
import type { StudentDashboardSummary } from './student-dashboard.type';
import { clientCoursesQueryKeys } from '@/apis/courses/client-courses.api';

export const studentDashboardKeys = {
  summary: (userId: number) => [...clientCoursesQueryKeys.myCourses(userId), 'summary'] as const,
};
export const studentDashboardAPI = {
  async getSummary(signal?: AbortSignal) {
    const response = await authorizeAxiosInstance.get<ApiResponse<StudentDashboardSummary>>(
      '/student/dashboard',
      {
        signal,
        localErrorHandling: true,
      },
    );
    return response.data.data;
  },
};
