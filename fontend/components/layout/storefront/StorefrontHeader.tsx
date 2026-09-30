import Link from 'next/link';
import { MobileNavigation } from './MobileNavigation';
import { StorefrontAuthActions } from './StorefrontAuthActions';
import { StorefrontCartLink } from './StorefrontCartLink';
import { StorefrontLogo } from './StorefrontLogo';

export function StorefrontHeader({
  activePage = 'home',
}: {
  activePage?: 'home' | 'courses' | 'cart';
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <StorefrontLogo />
          <nav aria-label="Điều hướng chính" className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              aria-current={activePage === 'home' ? 'page' : undefined}
              className={`text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${activePage === 'home' ? 'font-semibold text-brand-navy' : 'font-medium text-slate-500 transition-colors hover:text-brand-navy'}`}
            >
              Trang chủ
            </Link>
            <Link
              href="/courses"
              aria-current={activePage === 'courses' ? 'page' : undefined}
              className={`text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${activePage === 'courses' ? 'border-b-2 border-brand-navy py-7 font-semibold text-brand-navy' : 'font-medium text-slate-500 transition-colors hover:text-brand-navy'}`}
            >
              Khóa học
            </Link>
            <Link
              href="/#mock-exam"
              className="text-sm font-medium text-slate-500 transition-colors hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              Thi thử JLPT
            </Link>
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            <StorefrontCartLink active={activePage === 'cart'} />
            <StorefrontAuthActions />
          </div>
          <div className="flex items-center gap-1 md:hidden">
            <StorefrontCartLink variant="mobile-icon" active={activePage === 'cart'} />
            <MobileNavigation activePage={activePage} />
          </div>
        </div>
      </div>
    </header>
  );
}
