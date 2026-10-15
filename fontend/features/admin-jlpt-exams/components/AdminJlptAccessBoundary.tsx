'use client';

import type { ReactNode } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectAuthInitialized, selectIsAuthenticated } from '@/store/authSlice';
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
  if (access.isError)
    return <AdminJlptQueryError error={access.error} onRetry={() => void access.refetch()} />;
  // Verify cached access once per mount. Background stats invalidation must not
  // unmount future editors and discard their local form state.
  if (access.isPending || !access.isFetchedAfterMount) return <AdminJlptLoading />;
  return children;
}
