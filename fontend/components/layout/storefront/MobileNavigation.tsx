'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { StorefrontAuthActions } from './StorefrontAuthActions';
import { StorefrontCartLink } from './StorefrontCartLink';

const navigation = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Khóa học', href: '/courses' },
  { label: 'Thi thử JLPT', href: '/#mock-exam' },
] as const;

export function MobileNavigation({
  activePage = 'home',
}: {
  activePage?: 'home' | 'courses' | 'cart';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const navigationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (navigationRef.current?.contains(target)) return;
      if (target.closest('[data-slot="popover-content"]')) return;
      setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <div ref={navigationRef} className="md:hidden">
      <button
        type="button"
        aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
        aria-controls="storefront-mobile-menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="rounded p-2 text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
      >
        {isOpen ? (
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" d="M5 5l14 14M19 5L5 19" />
          </svg>
        ) : (
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>
      <nav
        id="storefront-mobile-menu"
        aria-label="Điều hướng di động"
        className={`${isOpen ? 'block' : 'hidden'} absolute top-full right-0 left-0 border-t border-slate-100 bg-white shadow-soft`}
      >
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:px-6">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={closeMenu}
              aria-current={
                (item.href === '/' && activePage === 'home') ||
                (item.href === '/courses' && activePage === 'courses')
                  ? 'page'
                  : undefined
              }
              className={`block rounded text-sm hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
                (item.href === '/' && activePage === 'home') ||
                (item.href === '/courses' && activePage === 'courses')
                  ? 'font-semibold text-brand-navy'
                  : 'font-medium text-slate-600'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <StorefrontCartLink
            variant="menu"
            active={activePage === 'cart'}
            onNavigate={closeMenu}
          />
          <div className="border-t border-slate-100 pt-4">
            <StorefrontAuthActions variant="mobile" onNavigate={closeMenu} />
          </div>
        </div>
      </nav>
    </div>
  );
}
