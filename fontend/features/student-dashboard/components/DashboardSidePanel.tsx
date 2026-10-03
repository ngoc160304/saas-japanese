import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { DashboardProfile, MilestoneData, StreakData, StudyCalendar } from '../types';

function StudentProfileCard({
  profile,
  streak,
}: {
  profile: DashboardProfile;
  streak: StreakData;
}) {
  return (
    <Card className="shadow-soft gap-0 rounded-3xl border-slate-100 bg-white p-5">
      <div className="flex items-center gap-3.5">
        <div className="relative shrink-0">
          <Image
            src={profile.avatar}
            alt="Student profile"
            width={52}
            height={52}
            className="h-13 w-13 rounded-2xl object-cover shadow-sm ring-2 ring-sky-100"
          />
          <span className="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-sm font-bold text-slate-900">{profile.name}</h2>
            <span className="shrink-0 rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-600">
              {profile.level}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs font-medium text-slate-400">{profile.email}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3.5 text-center">
        <div className="rounded-xl bg-slate-50/80 p-1.5">
          <p className="text-[10px] font-medium text-slate-400">Target</p>
          <p className="text-xs font-bold text-slate-800">{profile.target}</p>
        </div>
        <div className="rounded-xl bg-amber-50/80 p-1.5">
          <p className="text-[10px] font-medium text-amber-600">Streak</p>
          <p className="text-xs font-bold text-amber-700">{streak.currentDays} Days 🔥</p>
        </div>
        <div className="rounded-xl bg-sky-50/80 p-1.5">
          <p className="text-[10px] font-medium text-sky-600">Rank</p>
          <p className="text-xs font-bold text-sky-700">{profile.rank}</p>
        </div>
      </div>
    </Card>
  );
}

function StudyCalendarCard({ calendar }: { calendar: StudyCalendar }) {
  return (
    <Card className="shadow-soft gap-0 rounded-3xl border-slate-100 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <ChevronLeft className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <h3 className="text-sm font-bold tracking-tight text-slate-900">{calendar.monthLabel}</h3>
        <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div
        className="grid grid-cols-7 gap-x-1 gap-y-2 text-center text-xs font-semibold"
        aria-label={`Study activity for ${calendar.monthLabel}`}
      >
        {calendar.days.map((day) => (
          <span key={day.date} className="flex h-7 items-center justify-center">
            <span
              className={`relative flex h-7 w-7 items-center justify-center rounded-full ${day.studied ? 'bg-amber-500 font-bold text-white shadow-[0_2px_8px_rgba(245,158,11,0.35)]' : day.selected ? 'bg-slate-100 font-bold text-slate-900 ring-1 ring-slate-200' : day.outsideMonth ? 'text-slate-300' : 'text-slate-700'}`}
              title={day.date}
            >
              {day.day}
              {day.studied && (
                <span
                  className="absolute -top-2 -right-1 text-[11px] leading-none"
                  aria-hidden="true"
                >
                  🔥
                </span>
              )}
            </span>
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span className="font-medium text-slate-500">Studied Days ({calendar.studiedDays})</span>
        </div>
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
          🔥 {calendar.streakDays} Days Streak
        </span>
      </div>
    </Card>
  );
}

function MilestoneCard({ milestone }: { milestone: MilestoneData }) {
  return (
    <Card className="shadow-soft gap-0 rounded-3xl border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50/60 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 p-1">
          <Image
            src={milestone.image}
            alt="Streak badge"
            width={40}
            height={40}
            className="h-full w-full rounded-xl object-contain drop-shadow-sm"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs leading-tight font-bold text-slate-900">{milestone.title}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            Earned {milestone.earnedCount} times in total
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
            <div
              className="h-full rounded-full bg-sky-500"
              style={{ width: `${milestone.progressPercent}%` }}
            />
          </div>
          <p className="mt-1 text-[9px] font-medium text-slate-400">
            Complete tasks for {milestone.daysRemaining} more days
          </p>
        </div>
      </div>
    </Card>
  );
}

export function DashboardSidePanel({
  profile,
  streak,
  calendar,
  milestone,
}: {
  profile: DashboardProfile;
  streak: StreakData;
  calendar: StudyCalendar;
  milestone: MilestoneData;
}) {
  return (
    <aside
      aria-label="Student profile and study calendar"
      className="flex w-full shrink-0 flex-col gap-5 xl:w-[264px] 2xl:w-[296px]"
    >
      <StudentProfileCard profile={profile} streak={streak} />
      <StudyCalendarCard calendar={calendar} />
      <MilestoneCard milestone={milestone} />
    </aside>
  );
}
