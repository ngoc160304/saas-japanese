'use client';

import { useState } from 'react';
import { Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { DashboardProfile } from '../types';

function StudyCalendarCard({ today }: { today: Date }) {
  const [offset, setOffset] = useState(0);
  const month = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return {
      date,
      outside: date.getMonth() !== month.getMonth(),
      today: date.toDateString() === today.toDateString(),
    };
  });
  return (
    <Card className="shadow-soft gap-0 rounded-3xl border-slate-100 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Tháng trước"
          onClick={() => setOffset(offset - 1)}
        >
          <ChevronLeft />
        </Button>
        <h3 className="text-sm font-bold text-slate-900">
          {month.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
        </h3>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Tháng sau"
          onClick={() => setOffset(offset + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-x-1 gap-y-2 text-center text-xs" aria-label="Lịch tháng">
        {days.map((day) => (
          <span
            key={day.date.toDateString()}
            aria-current={day.today ? 'date' : undefined}
            className={`flex h-7 items-center justify-center rounded-full ${day.today ? 'bg-sky-50 font-bold text-primary ring-1 ring-sky-200' : day.outside ? 'text-slate-300' : 'text-slate-700'}`}
          >
            {day.date.getDate()}
          </span>
        ))}
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        Chưa có lịch sử ngày học. Lịch chỉ hiển thị ngày hiện tại.
      </p>
    </Card>
  );
}

export function DashboardSidePanel({ profile, today }: { profile: DashboardProfile; today: Date }) {
  const initials = profile.name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <aside
      aria-label="Student profile and study calendar"
      className="flex w-full shrink-0 flex-col gap-5 xl:w-[264px] 2xl:w-[296px]"
    >
      <Card className="shadow-soft gap-0 rounded-3xl border-slate-100 bg-white p-5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-lg font-bold text-primary"
          >
            {initials}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-slate-900">{profile.name}</h2>
            <p className="truncate text-xs text-slate-500">{profile.email}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
          {['Target', 'Streak', 'Rank'].map((label) => (
            <div key={label} className="rounded-xl bg-slate-50 p-2">
              <p className="text-[10px] text-slate-500">{label}</p>
              <p className="mt-1 text-[10px] text-slate-600">Chưa có dữ liệu</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">Trình độ JLPT: Chưa có dữ liệu</p>
      </Card>
      <StudyCalendarCard today={today} />
      <Card className="shadow-soft gap-0 rounded-3xl border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-5">
        <div className="flex items-center gap-3">
          <Award className="size-10 shrink-0 text-sky-600" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Milestones</h3>
            <p className="mt-1 text-xs text-slate-500">Chưa có dữ liệu thành tích hoặc huy hiệu.</p>
          </div>
        </div>
      </Card>
    </aside>
  );
}
