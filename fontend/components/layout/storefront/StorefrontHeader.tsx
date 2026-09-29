import Link from 'next/link';
import { MobileNavigation } from './MobileNavigation';
import { StorefrontLogo } from './StorefrontLogo';

export function StorefrontHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <StorefrontLogo />
          <nav aria-label="Điều hướng chính" className="hidden items-center gap-8 md:flex">
            <Link href="/" aria-current="page" className="text-sm font-semibold text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">Trang chủ</Link>
            <Link href="/#courses" className="text-sm font-medium text-slate-500 transition-colors hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">Khóa học</Link>
            <Link href="/#mock-exam" className="text-sm font-medium text-slate-500 transition-colors hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">Thi thử JLPT</Link>
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            <Link href="/login" className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">Đăng nhập</Link>
            <Link href="/register" className="rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Đăng ký miễn phí</Link>
          </div>
          <MobileNavigation />
        </div>
      </div>
    </header>
  );
}
