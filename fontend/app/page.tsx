import type { Metadata } from 'next';
import { StorefrontFooter } from '@/components/layout/storefront/StorefrontFooter';
import { StorefrontHeader } from '@/components/layout/storefront/StorefrontHeader';
import { HomePage } from '@/features/home/components/HomePage';

export const metadata: Metadata = {
  title: 'StudyJLPT - Nền tảng luyện thi tiếng Nhật toàn diện',
  description: 'Học tiếng Nhật từ N5 đến N1 với lộ trình rõ ràng, khóa học chuyên sâu và đề thi thử JLPT.',
};

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-storefront text-slate-800">
      <StorefrontHeader />
      <HomePage />
      <StorefrontFooter />
    </div>
  );
}
