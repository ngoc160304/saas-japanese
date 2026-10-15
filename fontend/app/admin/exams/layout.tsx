import type { ReactNode } from 'react';
import { AdminJlptAccessBoundary } from '@/features/admin-jlpt-exams/components/AdminJlptAccessBoundary';

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminJlptAccessBoundary>{children}</AdminJlptAccessBoundary>;
}
