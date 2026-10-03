import { Bell, CalendarDays } from 'lucide-react';
import type { DashboardProfile } from '../types';

export function DashboardHeader({ profile }: { profile: DashboardProfile }) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
          {profile.greeting} <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-0.5 text-sm font-medium text-slate-500">
          Welcome Back, {profile.name}
          <span className="mx-2 text-slate-300">•</span>
          <span className="font-normal text-slate-400">{profile.dateLabel}</span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="shadow-soft flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white px-4 py-2.5 text-slate-700">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-white shadow-sm">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-left">
            <span className="block text-xs leading-tight font-bold text-slate-800">
              {profile.dateBadge}
            </span>
            <span className="block text-[11px] leading-tight font-medium text-slate-400">
              {profile.weekday}
            </span>
          </span>
        </div>
        <span
          className="shadow-soft relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-600"
          role="img"
          aria-label="Notification indicator"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </span>
      </div>
    </header>
  );
}
