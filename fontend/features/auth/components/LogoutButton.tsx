'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from 'cn';
import { logout } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

interface LogoutButtonProps {
  className?: string;
  onSuccess?: () => void;
}

export function LogoutButton({ className, onSuccess }: LogoutButtonProps = {}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pending = useAppSelector((state) => state.auth.status === 'logging-out');
  const submitting = useRef(false);
  async function handleLogout() {
    if (submitting.current) return;
    submitting.current = true;
    const id = toast.loading('Đang đăng xuất…');
    try {
      await dispatch(logout()).unwrap();
      toast.success('Đã đăng xuất.', { id });
      onSuccess?.();
      router.replace('/login');
    } catch {
      toast.error(
        'Đã xóa phiên trên thiết bị nhưng chưa thu hồi được cookie trên máy chủ. Vui lòng thử lại.',
        {
          id,
          duration: 10_000,
          action: { label: 'Thử lại', onClick: () => void handleLogout() },
        },
      );
    } finally {
      submitting.current = false;
    }
  }
  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={pending}
      aria-busy={pending}
      className={cn(
        'mt-6 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-wait disabled:opacity-60',
        className,
      )}
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="size-4" aria-hidden="true" />
      )}
      {pending ? 'Đang đăng xuất…' : 'Đăng xuất'}
    </button>
  );
}
