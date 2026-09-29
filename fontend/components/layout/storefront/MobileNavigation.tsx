'use client';

import { useState } from 'react';
import Link from 'next/link';

const navigation = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Khóa học', href: '/#courses' },
  { label: 'Thi thử JLPT', href: '/#mock-exam' },
] as const;

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden" onKeyDown={(event) => {
      if (event.key === 'Escape') setIsOpen(false);
    }}>
      <button
        type="button"
        aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
        aria-controls="storefront-mobile-menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="rounded p-2 text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
      >
        {isOpen ? (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" d="M5 5l14 14M19 5L5 19" />
          </svg>
        ) : (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>
      <nav id="storefront-mobile-menu" aria-label="Điều hướng di động" className={`${isOpen ? 'block' : 'hidden'} absolute top-full right-0 left-0 border-t border-slate-100 bg-white shadow-soft`}>
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:px-6">
          {navigation.map((item) => (
            <Link key={item.label} href={item.href} onClick={() => setIsOpen(false)} className="block rounded text-sm font-medium text-slate-600 hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">
              {item.label}
            </Link>
          ))}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <Link href="/login" onClick={() => setIsOpen(false)} className="block w-full rounded py-2 text-center text-sm font-medium text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">Đăng nhập</Link>
            <Link href="/register" onClick={() => setIsOpen(false)} className="block w-full rounded-lg bg-brand-blue px-4 py-2.5 text-center text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2">Đăng ký miễn phí</Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
