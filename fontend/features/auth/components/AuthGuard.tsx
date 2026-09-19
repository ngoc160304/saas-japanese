'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { refreshSession, selectAuthInitialized, selectIsAuthenticated } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { LogoutButton } from './LogoutButton';

export function AuthGuard({ children }: { children: ReactNode }) {
  const initialized = useAppSelector(selectAuthInitialized);
  const authenticated = useAppSelector(selectIsAuthenticated);
  const { status, error } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const pending = !initialized || ['bootstrapping', 'refreshing', 'logging-out'].includes(status);
  const sessionUnavailable = error && (error.status === null || error.status >= 500);

  useEffect(() => {
    if (!pending && !authenticated && !sessionUnavailable && status !== 'logout-error') {
      router.replace(
        `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
    }
  }, [pending, authenticated, sessionUnavailable, router, pathname, status]);

  if (status === 'logout-error') {
    return (
      <div
        role="alert"
        className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center p-6 text-center"
      >
        <p>Chưa thể đăng xuất trên máy chủ. Vui lòng thử lại để thu hồi phiên đăng nhập.</p>
        <LogoutButton />
      </div>
    );
  }

  if (!authenticated && sessionUnavailable && !pending) {
    return (
      <div
        role="alert"
        className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center"
      >
        <p>{error.message}</p>
        <button
          className="rounded-xl bg-slate-900 px-4 py-2 text-white focus-visible:ring-2 focus-visible:ring-sky-500"
          onClick={() => void dispatch(refreshSession())}
        >
          Thử kết nối lại
        </button>
      </div>
    );
  }
  if (pending || !authenticated)
    return (
      <p role="status" className="p-8 text-center text-sm text-slate-500">
        Đang kiểm tra phiên đăng nhập…
      </p>
    );
  return children;
}
