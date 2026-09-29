'use client';

import Link from 'next/link';
import { Bell, ChevronDown, Inbox, UserRound } from 'lucide-react';
import type { AuthUser } from '@/apis/auth/auth.type';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { LogoutButton } from '@/features/auth/components/LogoutButton';
import { selectAuthInitialized, selectCurrentUser, selectIsAuthenticated } from '@/store/authSlice';
import { useAppSelector } from '@/store/hooks';

interface StorefrontAuthActionsProps {
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
}

function getInitials(user: AuthUser) {
  const words = user.name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return user.email.slice(0, 1).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words.at(-1)?.[0] ?? ''}`.toUpperCase();
}

function AuthActionsPlaceholder({ variant }: { variant: 'desktop' | 'mobile' }) {
  return (
    <div
      role="status"
      aria-label="Đang kiểm tra phiên đăng nhập"
      className={
        variant === 'desktop'
          ? 'flex h-10 w-32 animate-pulse items-center justify-end gap-3'
          : 'flex h-11 w-full animate-pulse items-center justify-end gap-3'
      }
    >
      <span className="h-9 w-9 rounded-full bg-slate-100" aria-hidden="true" />
      <span className="h-9 w-16 rounded-lg bg-slate-100" aria-hidden="true" />
    </div>
  );
}

function GuestActions({ variant, onNavigate }: Required<StorefrontAuthActionsProps>) {
  if (variant === 'mobile') {
    return (
      <div className="space-y-3">
        <Link
          href="/login"
          onClick={onNavigate}
          className="block w-full rounded py-2 text-center text-sm font-medium text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        >
          Đăng nhập
        </Link>
        <Link
          href="/register"
          onClick={onNavigate}
          className="block w-full rounded-lg bg-brand-blue px-4 py-2.5 text-center text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
        >
          Đăng ký miễn phí
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
      >
        Đăng nhập
      </Link>
      <Link
        href="/register"
        className="rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
      >
        Đăng ký miễn phí
      </Link>
    </div>
  );
}

function NotificationPopover() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Thông báo"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
          />
        }
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-80 gap-0 p-0">
        <PopoverHeader className="border-b border-slate-100 px-4 py-3">
          <PopoverTitle className="font-semibold text-slate-800">Thông báo</PopoverTitle>
          <PopoverDescription className="text-xs text-slate-500">
            Cập nhật mới nhất của bạn
          </PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col items-center px-5 py-8 text-center">
          <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Inbox className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-slate-700">Chưa có thông báo</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Thông báo mới sẽ xuất hiện tại đây.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AccountPopover({
  user,
  compact,
  onNavigate,
}: {
  user: AuthUser;
  compact: boolean;
  onNavigate: () => void;
}) {
  const initials = getInitials(user);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={`Mở menu tài khoản của ${user.name || user.email}`}
            className={`inline-flex h-10 items-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 ${compact ? 'w-10 justify-center' : 'max-w-52 gap-2 pr-2.5 pl-1.5'}`}
          />
        }
      >
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-navy text-[10px] font-bold tracking-wide text-white"
        >
          {initials}
        </span>
        {!compact && (
          <>
            <span className="max-w-28 truncate text-xs font-semibold">{user.name || initials}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          </>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-72 gap-0 p-3">
        <PopoverHeader className="border-b border-slate-100 px-1 pb-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-brand-navy">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <PopoverTitle className="truncate font-semibold text-slate-800">
                {user.name || initials}
              </PopoverTitle>
              <PopoverDescription className="truncate text-xs text-slate-500">
                {user.email}
              </PopoverDescription>
            </div>
          </div>
        </PopoverHeader>
        <LogoutButton
          onSuccess={onNavigate}
          className="mt-2 rounded-lg px-2 py-2.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-brand-blue"
        />
      </PopoverContent>
    </Popover>
  );
}

export function StorefrontAuthActions({
  variant = 'desktop',
  onNavigate = () => undefined,
}: StorefrontAuthActionsProps) {
  const initialized = useAppSelector(selectAuthInitialized);
  const authenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const loggingOut = useAppSelector((state) => state.auth.status === 'logging-out');

  if (!initialized || loggingOut) return <AuthActionsPlaceholder variant={variant} />;
  if (!authenticated || !user) {
    return <GuestActions variant={variant} onNavigate={onNavigate} />;
  }

  return (
    <div
      className={
        variant === 'desktop'
          ? 'flex items-center gap-2'
          : 'flex items-center justify-between gap-3'
      }
    >
      {variant === 'mobile' && (
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
          {user.name || user.email}
        </p>
      )}
      <div className="flex shrink-0 items-center gap-2">
        <NotificationPopover />
        <AccountPopover user={user} compact={variant === 'mobile'} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
