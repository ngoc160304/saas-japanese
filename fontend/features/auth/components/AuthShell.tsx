import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

interface AuthShellProps {
  variant: 'login' | 'register' | 'verify';
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthShell({ variant, title, description, children }: AuthShellProps) {
  const registration = variant === 'register';
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-between overflow-x-clip bg-linear-to-br from-slate-50 via-sky-50/40 to-indigo-50/50 p-4 text-slate-800 sm:p-6 lg:p-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 size-96 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute top-1/4 -right-32 size-96 rounded-full bg-indigo-200/35 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 size-80 rounded-full bg-teal-100/40 blur-3xl" />
        <svg
          className="absolute -top-12 -right-12 size-80 text-sky-900/[0.035]"
          viewBox="0 0 200 200"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="100" cy="100" r="30" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="100" cy="100" r="55" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="80" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="100" cy="100" r="105" />
        </svg>
        <svg
          className="absolute -bottom-16 -left-16 size-80 text-indigo-900/[0.035]"
          viewBox="0 0 200 200"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="100" cy="100" r="40" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="70" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="100" cy="100" r="100" />
        </svg>
        <span className="absolute right-8 bottom-8 text-[120px] font-black text-slate-900/[0.02]">
          {registration ? '夢' : '学'}
        </span>
        <span className="absolute top-12 left-10 text-[100px] font-black text-slate-900/[0.018]">
          {registration ? '道' : '和'}
        </span>
      </div>
      <nav
        aria-label="Điều hướng xác thực"
        className="z-10 flex w-full max-w-[480px] items-center justify-between gap-2 py-2"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded text-xs font-semibold text-slate-500 hover:text-sky-600 focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Về trang chủ
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {registration ? 'Tài khoản miễn phí' : 'JLPT Prep Platform'}
        </span>
      </nav>
      <main
        className={`z-10 my-auto w-full py-4 ${registration ? 'max-w-[480px]' : 'max-w-[460px]'}`}
      >
        <div className="rounded-3xl border border-slate-100/90 bg-white/95 p-6 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.08),0_8px_16px_-4px_rgba(15,23,42,0.03),0_0_0_1px_rgba(226,232,240,0.85)] backdrop-blur-md sm:p-9">
          <div className="mb-6 flex flex-col items-center text-center">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2.5 rounded focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-linear-to-tr from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20">
                <Sparkles className="size-6" aria-hidden="true" />
              </span>
              <span className="text-left">
                <span className="block text-xl leading-tight font-extrabold tracking-tight text-slate-900">
                  Studify <span className="text-sky-600">JLPT</span>
                </span>
                <span className="block text-[10px] font-bold tracking-widest text-slate-400">
                  {registration ? '新規登録' : '日本語学習'}
                </span>
              </span>
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500 sm:text-sm">
              {description}
            </p>
          </div>
          {children}
        </div>
      </main>
      <footer className="z-10 w-full max-w-[480px] py-2 text-center text-[11px] text-slate-400">
        © 2026 Studify JLPT. Nền tảng luyện thi năng lực Nhật ngữ toàn diện.
      </footer>
    </div>
  );
}
