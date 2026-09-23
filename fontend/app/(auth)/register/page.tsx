import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = { title: 'Đăng ký | Studify JLPT' };

export default function RegisterPage() {
  return <AuthShell variant="register" title="Đăng ký tài khoản 🌸" description="Tạo tài khoản học viên để truy cập kho đề thi JLPT N5–N1, bài tập tương tác và lưu tiến độ học tập.">
    <Suspense fallback={<p role="status">Đang tải biểu mẫu…</p>}><RegisterForm /></Suspense>
  </AuthShell>;
}
