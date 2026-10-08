'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cartQueryKeys } from '@/apis/cart/cart.api';
import { clientCoursesAPI, clientCoursesQueryKeys } from '@/apis/courses/client-courses.api';
import { getApiError } from '@/lib/api-error';
import { selectCurrentUser } from '@/store/authSlice';
import { useAppSelector, useAppStore } from '@/store/hooks';

export function useCourseEnrollment(courseId: number) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const store = useAppStore();
  const userId = useAppSelector(selectCurrentUser)?.id;
  const submitting = useRef(false);
  const mutation = useMutation({
    mutationFn: clientCoursesAPI.enrollCourse,
    retry: false,
    onMutate: () => ({
      revision: store.getState().auth.revision,
      userId: store.getState().auth.user?.id,
    }),
    onSuccess: async (enrollment, _variables, context) => {
      if (
        context.revision !== store.getState().auth.revision ||
        context.userId !== store.getState().auth.user?.id
      )
        return;
      if (enrollment) {
        if (context.userId !== undefined) {
          queryClient.setQueryData<number[]>(
            clientCoursesQueryKeys.enrollments(context.userId),
            (current) =>
              current
                ? Array.from(new Set([...current, enrollment.courseId]))
                : [enrollment.courseId],
          );
          await queryClient.invalidateQueries({
            queryKey: clientCoursesQueryKeys.enrollments(context.userId),
          });
          await queryClient.invalidateQueries({
            queryKey: clientCoursesQueryKeys.myCourses(context.userId),
          });
        }
        toast.success('Course enrollment completed.');
      } else {
        await queryClient.invalidateQueries({ queryKey: cartQueryKeys.all });
        toast.success('Course added to your cart. Complete checkout to enroll.');
        router.push('/cart');
      }
    },
    onError: (error, _variables, context) => {
      if (
        context?.revision !== store.getState().auth.revision ||
        context.userId !== store.getState().auth.user?.id
      )
        return;
      const failure = getApiError(error);
      if (failure.status === 401) return;
      if (failure.status === 400 && failure.message === 'Bạn đã đăng ký course này') {
        if (context.userId !== undefined) {
          void queryClient.invalidateQueries({
            queryKey: clientCoursesQueryKeys.enrollments(context.userId),
          });
          void queryClient.invalidateQueries({
            queryKey: clientCoursesQueryKeys.myCourses(context.userId),
          });
        }
        toast.info('You are already enrolled in this course.');
      } else if (failure.message === 'Chương trình học đã có trong giỏ hàng') {
        void queryClient.invalidateQueries({ queryKey: cartQueryKeys.all });
        toast.info('This course is already in your cart.');
        router.push('/cart');
      } else if (
        failure.message === 'Course không tồn tại' ||
        failure.message === 'Course chưa được công khai'
      ) {
        toast.error('This course is no longer available.');
        void queryClient.invalidateQueries({ queryKey: clientCoursesQueryKeys.detail(courseId) });
      } else {
        toast.error(failure.message);
      }
    },
  });

  async function enroll() {
    if (userId === undefined || submitting.current || mutation.isPending) return;
    submitting.current = true;
    try {
      await mutation.mutateAsync(courseId);
    } catch {
      // The mutation or session handler provides feedback.
    } finally {
      submitting.current = false;
    }
  }

  return { enroll, isPending: mutation.isPending };
}
