import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { VerifyEmailForm } from '@/features/auth/components/VerifyEmailForm';

export const metadata: Metadata = { title: 'Xác thực email | Studify JLPT' };

export default function VerifyEmailPage() {
  return <AuthShell variant="verify" title="Xác thực email" description="Nhập mã 6 chữ số đã gửi đến email của bạn để hoàn tất đăng ký.">
    <Suspense fallback={<p role="status">Đang tải biểu mẫu…</p>}><VerifyEmailForm /></Suspense>
  </AuthShell>;
}
