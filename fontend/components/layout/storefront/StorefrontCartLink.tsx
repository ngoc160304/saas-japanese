'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart } from 'lucide-react';
import { cartAPI, cartQueryKeys } from '@/apis/cart/cart.api';
import { selectAuthInitialized, selectIsAuthenticated } from '@/store/authSlice';
import { useAppSelector } from '@/store/hooks';

interface StorefrontCartLinkProps {
  variant?: 'desktop-icon' | 'mobile-icon' | 'menu';
  active?: boolean;
  onNavigate?: () => void;
}

function formatBadgeCount(count: number) {
  return count > 99 ? '99+' : String(count);
}

export function StorefrontCartLink({
  variant = 'desktop-icon',
  active = false,
  onNavigate,
}: StorefrontCartLinkProps) {
  const initialized = useAppSelector(selectAuthInitialized);
  const authenticated = useAppSelector(selectIsAuthenticated);
  const cartQuery = useQuery({
    queryKey: cartQueryKeys.detail,
    queryFn: cartAPI.getCurrent,
    enabled: initialized && authenticated,
    retry: false,
  });
  const count = cartQuery.data?.items.length ?? 0;
  const label = count > 0 ? `Giỏ hàng, ${count} khóa học` : 'Giỏ hàng';

  if (variant === 'menu') {
    return (
      <Link
        href="/cart"
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        aria-label={label}
        className={`flex items-center justify-between rounded text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${active ? 'text-brand-blue' : 'text-brand-navy hover:text-brand-blue'}`}
      >
        <span>Giỏ hàng</span>
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-brand-blue">
          {formatBadgeCount(count)}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/cart"
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
      title="Giỏ hàng"
      className={`relative rounded p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
        active
          ? 'text-brand-blue'
          : variant === 'desktop-icon'
            ? 'text-brand-navy hover:text-brand-blue'
            : 'text-slate-700 hover:text-brand-navy'
      }`}
    >
      <ShoppingCart className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
      {count > 0 && (
        <span className="absolute top-1 right-0 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-brand-blue px-0.5 text-[9px] leading-none font-bold text-white">
          {formatBadgeCount(count)}
        </span>
      )}
    </Link>
  );
}
