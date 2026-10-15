'use client';

import { AdminJlptQueryError } from '@/features/admin-jlpt-exams/components/AdminJlptState';

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <AdminJlptQueryError error={error} onRetry={retry} />;
}
