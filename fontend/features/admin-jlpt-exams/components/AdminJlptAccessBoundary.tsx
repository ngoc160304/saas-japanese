'use client';

import type { ReactNode } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectAuthInitialized, selectIsAuthenticated } from '@/store/authSlice';
import { getApiError } from '@/lib/api-error';
import { useAdminJlptExamStats } from '../hooks/useAdminJlptExams';
import { AdminJlptLoading, AdminJlptQueryError } from './AdminJlptState';

export function AdminJlptAccessBoundary({ children }: { children: ReactNode }) {
  const initialized = useAppSelector(selectAuthInitialized);
  const authenticated = useAppSelector(selectIsAuthenticated);
  // AuthUser and /auth/myProfile expose no role. This existing endpoint is
  // guarded by ROLE_ADMIN on the server; never infer authority from a JWT.
  const access = useAdminJlptExamStats({}, true);
  // The parent admin AuthGuard owns anonymous redirects and bootstrap retries.
  if (!initialized || !authenticated) return <AdminJlptLoading />;
  const accessStatus = access.isError ? getApiError(access.error).status : null;
  if (accessStatus === 401 || accessStatus === 403)
    return <AdminJlptQueryError error={access.error} onRetry={() => void access.refetch()} />;
  // Stats must not serialize or block catalog reads. List/detail are also
  // ROLE_ADMIN-protected and handle their own 401/403 before showing data.
  // Keep editors mounted during background stats loading/network failures.
  return children;
}
