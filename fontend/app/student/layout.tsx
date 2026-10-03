import type { ReactNode } from 'react';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { AdminShell } from '@/components/layout/management/AdminShell';
import { StudentSidebar } from '@/components/layout/student/StudentSidebar';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AdminShell sidebar={<StudentSidebar />}>{children}</AdminShell>
    </AuthGuard>
  );
}
