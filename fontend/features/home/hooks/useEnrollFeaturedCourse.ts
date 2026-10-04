'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cartQueryKeys } from '@/apis/cart/cart.api';
import { clientCoursesAPI } from '@/apis/courses/client-courses.api';
import { safeReturnPath } from '@/features/auth/auth-navigation';
import { getApiError } from '@/lib/api-error';
import { selectAuthInitialized, selectCurrentUser, selectIsAuthenticated } from '@/store/authSlice';
import { useAppSelector, useAppStore } from '@/store/hooks';

export function useEnrollFeaturedCourse(courseId: number) {
  const initialized = useAppSelector(selectAuthInitialized);
  const authenticated = useAppSelector(selectIsAuthenticated);
  const userId = useAppSelector(selectCurrentUser)?.id;
  const store = useAppStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const submitting = useRef(false);
  const validCourse = Number.isSafeInteger(courseId) && courseId > 0;
  const [completed, setCompleted] = useState<{
    userId: number;
    kind: 'enrolled' | 'cart';
  } | null>(null);
  const completion = completed && completed.userId === userId && authenticated ? completed.kind : null;

  function goToLogin() {
    const returnPath = safeReturnPath(
      window.location.pathname + window.location.search + window.location.hash,
    );
    router.push(`/login?next=${encodeURIComponent(returnPath)}`);
  }

  const mutation = useMutation({
    mutationFn: clientCoursesAPI.enrollCourse,
    retry: false,
    onMutate: () => ({ revision: store.getState().auth.revision }),
    onSuccess: async (enrollment, _courseId, context) => {
      if (context.revision !== store.getState().auth.revision) return;
      const currentUserId = store.getState().auth.user?.id;
      if (currentUserId === undefined) return;
      if (enrollment !== null) {
        setCompleted({ userId: currentUserId, kind: 'enrolled' });
        toast.success('Đăng ký khóa học thành công.');
      } else {
        setCompleted({ userId: currentUserId, kind: 'cart' });
        toast.success('Đã thêm khóa học vào giỏ hàng.');
        await queryClient.invalidateQueries({ queryKey: cartQueryKeys.all });
      }
    },
    onError: (error, _courseId, context) => {
      if (context?.revision !== store.getState().auth.revision) return;
      const failure = getApiError(error);
      // The auth interceptor owns expired-session feedback and navigation.
      if (failure.status === 401) return;
      if (failure.status === 400 && failure.message === 'Người dùng chưa đăng nhập') {
        toast.error('Vui lòng đăng nhập để đăng ký khóa học.');
        goToLogin();
        return;
      }
      if (failure.status === 400 && failure.message === 'Bạn đã đăng ký course này') {
        const currentUserId = store.getState().auth.user?.id;
        if (currentUserId !== undefined) {
          setCompleted({ userId: currentUserId, kind: 'enrolled' });
        }
        toast.error('Bạn đã đăng ký khóa học này.');
        return;
      }
      const messages: Record<string, string> = {
        'Course không tồn tại': 'Khóa học không còn khả dụng.',
        'Course chưa được công khai': 'Khóa học chưa được công khai.',
      };
      toast.error(messages[failure.message] ?? failure.message);
      if (failure.status === 400 && failure.message === 'Chương trình học đã có trong giỏ hàng') {
        void queryClient.invalidateQueries({ queryKey: cartQueryKeys.all });
      }
    },
  });

  async function enroll() {
    if (!initialized || !validCourse) return;
    if (submitting.current || mutation.isPending || completion) return;
    if (!authenticated) {
      goToLogin();
      return;
    }
    submitting.current = true;
    try {
      await mutation.mutateAsync(courseId);
    } catch {
      // The mutation or auth interceptor has already shown the error.
    } finally {
      submitting.current = false;
    }
  }

  return {
    enroll,
    isPending: mutation.isPending,
    isEnrolled: completion === 'enrolled',
    isAddedToCart: completion === 'cart',
    disabled: !initialized || !validCourse || mutation.isPending || Boolean(completion),
  };
}
