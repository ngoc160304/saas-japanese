import type { ReactNode } from 'react';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import './taking.css';

export default function JlptExamWorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="jlpt-taking-route fixed inset-0 h-dvh overflow-hidden"><AuthGuard>{children}</AuthGuard></div>;
}
