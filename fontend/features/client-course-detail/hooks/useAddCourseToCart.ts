'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cartAPI, cartQueryKeys } from '@/apis/cart/cart.api';
import { safeReturnPath } from '@/features/auth/auth-navigation';
import { getApiError } from '@/lib/api-error';
import { selectAuthInitialized, selectIsAuthenticated } from '@/store/authSlice';
import { useAppSelector, useAppStore } from '@/store/hooks';

export function useAddCourseToCart(courseId: number | undefined) {
  const initialized = useAppSelector(selectAuthInitialized);
  const authenticated = useAppSelector(selectIsAuthenticated);
  const store = useAppStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const submitting = useRef(false);
  const validCourse = courseId !== undefined && Number.isSafeInteger(courseId) && courseId > 0;
  const loginPath = () =>
    `/login?next=${encodeURIComponent(safeReturnPath(`/courses/${courseId}`))}`;
  const mutation = useMutation({
    mutationFn: cartAPI.addCourse,
    retry: false,
    onMutate: async () => {
      const revision = store.getState().auth.revision;
      await queryClient.cancelQueries({ queryKey: cartQueryKeys.all });
      return { revision };
    },
    onSuccess: async (cart, _variables, context) => {
      if (context?.revision !== store.getState().auth.revision) return;
      await queryClient.cancelQueries({ queryKey: cartQueryKeys.all });
      if (context.revision !== store.getState().auth.revision) return;
      queryClient.setQueryData(cartQueryKeys.detail, cart);
      toast.success('Đã thêm khóa học vào giỏ hàng.');
    },
    onError: (error, _variables, context) => {
      // The interceptor already handles expiration and its toast/redirect.
      if (context?.revision !== store.getState().auth.revision) return;
      const failure = getApiError(error);
      if (failure.status === 401) return;
      if (failure.status === 400 && failure.message === 'Người dùng chưa đăng nhập') {
        toast.error('Vui lòng đăng nhập để thêm khóa học vào giỏ hàng.');
        router.push(loginPath());
        return;
      }
      const messages: Record<string, string> = {
        'Course không tồn tại': 'Khóa học không còn khả dụng.',
        'Course chưa được công khai': 'Khóa học chưa được công khai.',
        'Bạn đã đăng ký course này': 'Bạn đã đăng ký khóa học này.',
      };
      toast.error(messages[failure.message] ?? failure.message);
      if (failure.status === 400 && failure.message === 'Chương trình học đã có trong giỏ hàng') {
        void queryClient.invalidateQueries({ queryKey: cartQueryKeys.all });
      }
    },
  });

  async function addToCart() {
    if (!initialized || !validCourse || submitting.current || mutation.isPending) return;
    if (!authenticated) {
      router.push(loginPath());
      return;
    }
    submitting.current = true;
    try {
      await mutation.mutateAsync({ courseId });
    } catch {
      // Feedback is handled once by onError or the auth interceptor.
    } finally {
      submitting.current = false;
    }
  }

  return {
    addToCart,
    isPending: mutation.isPending,
    disabled: !initialized || !validCourse || mutation.isPending,
  };
}
