'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { clientCoursesAPI, clientCoursesQueryKeys } from '@/apis/courses/client-courses.api';
import { safeReturnPath } from '@/features/auth/auth-navigation';
import { getApiError, getApiErrorMessage } from '@/lib/api-error';
import { selectAuthInitialized, selectCurrentUser, selectIsAuthenticated } from '@/store/authSlice';
import { useAppSelector, useAppStore } from '@/store/hooks';

export function useFreeCourseEnrollment(courseId: number | undefined) {
  const initialized = useAppSelector(selectAuthInitialized);
  const authenticated = useAppSelector(selectIsAuthenticated);
  const userId = useAppSelector(selectCurrentUser)?.id;
  const store = useAppStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const submitting = useRef(false);
  const validCourse = courseId !== undefined && Number.isSafeInteger(courseId) && courseId > 0;
  const enrollmentKey = clientCoursesQueryKeys.enrollments(userId ?? 0);
  const enrollments = useQuery({
    queryKey: enrollmentKey,
    queryFn: ({ signal }) => clientCoursesAPI.getAllMyCourseIds(signal),
    enabled: initialized && authenticated && userId !== undefined && validCourse,
    retry: false,
  });

  const loginPath = () =>
    `/login?next=${encodeURIComponent(safeReturnPath(`/courses/${courseId}`))}`;
  const mutation = useMutation({
    mutationFn: clientCoursesAPI.enrollCourse,
    retry: false,
    onMutate: () => ({
      revision: store.getState().auth.revision,
      userId: store.getState().auth.user?.id,
    }),
    onSuccess: (_response, enrolledCourseId, context) => {
      const auth = store.getState().auth;
      if (
        context.userId === undefined ||
        context.revision !== auth.revision ||
        context.userId !== auth.user?.id
      )
        return;
      // The free enrollment endpoint may return an empty successful response.
      queryClient.setQueryData<number[]>(
        clientCoursesQueryKeys.enrollments(context.userId),
        (current) => Array.from(new Set([...(current ?? []), enrolledCourseId])),
      );
      void queryClient.invalidateQueries({
        queryKey: clientCoursesQueryKeys.enrollments(context.userId),
      });
      void queryClient.invalidateQueries({
        queryKey: clientCoursesQueryKeys.myCourses(context.userId),
      });
      toast.success('Đăng ký khóa học thành công.');
    },
    onError: (error, enrolledCourseId, context) => {
      const auth = store.getState().auth;
      if (
        context?.userId === undefined ||
        context.revision !== auth.revision ||
        context.userId !== auth.user?.id
      )
        return;
      const failure = getApiError(error);
      // The authorized Axios interceptor handles expired sessions.
      if (failure.status === 401) return;
      if (
        (failure.status === 400 || failure.status === 409) &&
        failure.message === 'Bạn đã đăng ký course này'
      ) {
        queryClient.setQueryData<number[]>(
          clientCoursesQueryKeys.enrollments(context.userId),
          (current) => Array.from(new Set([...(current ?? []), enrolledCourseId])),
        );
        void queryClient.invalidateQueries({
          queryKey: clientCoursesQueryKeys.enrollments(context.userId),
        });
        void queryClient.invalidateQueries({
          queryKey: clientCoursesQueryKeys.myCourses(context.userId),
        });
        toast.info('Bạn đã đăng ký khóa học này.');
        return;
      }
      if (failure.status === 400 && failure.message === 'Người dùng chưa đăng nhập') {
        toast.error('Vui lòng đăng nhập để đăng ký khóa học.');
        router.push(loginPath());
        return;
      }
      const messages: Record<string, string> = {
        'Course không tồn tại': 'Khóa học không còn khả dụng.',
        'Course chưa được công khai': 'Khóa học chưa được công khai.',
      };
      toast.error(
        messages[failure.message] ??
          ([400, 404, 409].includes(failure.status ?? 0)
            ? 'Không thể đăng ký khóa học. Vui lòng thử lại.'
            : failure.message),
      );
      if (failure.status === 404 || failure.message === 'Course chưa được công khai') {
        void queryClient.invalidateQueries({
          queryKey: clientCoursesQueryKeys.detail(enrolledCourseId),
        });
      }
    },
  });

  async function enroll() {
    if (!initialized || !validCourse || submitting.current || mutation.isPending) return;
    if (!authenticated) {
      router.push(loginPath());
      return;
    }
    const auth = store.getState().auth;
    if (
      userId === undefined ||
      !auth.accessToken ||
      auth.user?.id !== userId ||
      !enrollments.isSuccess ||
      enrollments.data.includes(courseId)
    )
      return;
    submitting.current = true;
    try {
      await mutation.mutateAsync(courseId);
    } catch {
      // The mutation callback or auth interceptor provides feedback.
    } finally {
      submitting.current = false;
    }
  }

  return {
    enroll,
    isEnrolled: authenticated && enrollments.data?.includes(courseId ?? 0) === true,
    isPending: mutation.isPending,
    disabled:
      !initialized ||
      !validCourse ||
      mutation.isPending ||
      (authenticated && !enrollments.isSuccess),
    isChecking: authenticated && enrollments.isPending,
    checkError: authenticated && enrollments.isError ? getApiErrorMessage(enrollments.error) : null,
    isRetrying: enrollments.isFetching,
    retryCheck: () => void enrollments.refetch(),
  };
}
