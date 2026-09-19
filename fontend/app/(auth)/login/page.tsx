import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = { title: 'Đăng nhập | Studify JLPT' };

export default function LoginPage() {
  return <AuthShell variant="login" title="Chào mừng trở lại 👋" description="Đăng nhập để tiếp tục lộ trình học tập, rèn luyện Kanji và chuẩn bị cho kỳ thi JLPT.">
    <Suspense fallback={<p role="status">Đang tải biểu mẫu…</p>}><LoginForm /></Suspense>
  </AuthShell>;
}
