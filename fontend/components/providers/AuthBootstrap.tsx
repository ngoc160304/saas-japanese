'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authAPI } from '@/apis/auth/auth.api';
import { injectStore } from '@/lib/authorize-axios';
import { clearAuth, refreshSession, sessionReceived } from '@/store/authSlice';
import { useAppStore } from '@/store/hooks';

export function AuthBootstrap() {
  const store = useAppStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    let lastSystemToast = 0;
    injectStore(store, {
      refresh: authAPI.refresh,
      sessionReceived,
      clearAuth,
      onSessionExpired: () => {
        const { pathname, search } = window.location;
        if (['/login', '/register', '/verify-email'].includes(pathname)) return;
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', { id: 'auth-expired' });
        router.replace(`/login?next=${encodeURIComponent(pathname + search)}`);
      },
      onSystemError: (message) => {
        if (Date.now() - lastSystemToast < 4_000) return;
        lastSystemToast = Date.now();
        toast.error(message, { id: 'api-system-error' });
      },
    });
    let currentUserId = store.getState().auth.user?.id;
    const unsubscribe = store.subscribe(() => {
      const userId = store.getState().auth.user?.id;
      if (userId !== currentUserId) {
        currentUserId = userId;
        void queryClient.cancelQueries();
        queryClient.clear();
      }
    });
    if (!store.getState().auth.initialized) void store.dispatch(refreshSession());
    return unsubscribe;
  }, [store, queryClient, router]);

  return null;
}
