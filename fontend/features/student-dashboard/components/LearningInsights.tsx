import Image from 'next/image';
import { Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { FocusCardData, LearningActivity, StreakData } from '../types';

const cardClass =
  'shadow-soft shadow-hover h-full gap-0 rounded-3xl border-slate-100 bg-white p-5 md:p-6';

function LearningActivityCard({ activity }: { activity: LearningActivity }) {
  return (
    <Card className={`${cardClass} justify-between`}>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Learning Activity</h2>
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-600">
            Monthly
          </span>
        </div>
        <p className="mb-3 text-xs font-medium text-slate-400">Total learning time this month</p>
        <div className="mb-4 flex items-baseline gap-1">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">
            {activity.totalMinutes.toLocaleString('en-US')}
          </span>
          <span className="text-xs font-semibold text-slate-400">/Mins</span>
        </div>
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between px-0.5 text-[10px] font-medium text-slate-400">
            <span>0</span>
            <span>{activity.scaleMaximum.toLocaleString('en-US')}</span>
          </div>
          <div
            className="flex h-14 w-full items-end justify-between gap-1 rounded-2xl border border-slate-100 bg-slate-50/70 p-2"
            role="img"
            aria-label={`Daily learning activity for ${activity.bars.length} days`}
          >
            {activity.bars.map((bar) => (
              <span
                key={bar.day}
                className={`w-1.5 shrink-0 rounded-full ${bar.completed ? 'bg-sky-400' : 'bg-slate-200'}`}
                style={{ height: `${bar.percent}%` }}
                title={`Day ${bar.day}: ${bar.percent}%`}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 border-t border-slate-100 pt-3.5 text-center">
        {activity.metrics.map((metric) => (
          <div key={metric.label}>
            <p
              className={`text-xs font-extrabold ${metric.positive ? 'text-emerald-600' : 'text-slate-900'}`}
            >
              {metric.value}{' '}
              <span className="text-[10px] font-normal text-slate-400">{metric.unit}</span>
            </p>
            <p className="text-[10px] font-medium text-slate-400">{metric.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FocusModeCard({ focus }: { focus: FocusCardData }) {
  return (
    <Card className={`${cardClass} justify-between text-center`}>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center -space-x-1.5">
            {focus.learnerAvatars.map((avatar, index) => (
              <Image
                key={avatar}
                src={avatar}
                alt={`Learner ${index + 1}`}
                width={24}
                height={24}
                className="h-6 w-6 rounded-full object-cover ring-2 ring-white"
              />
            ))}
          </div>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
            AI Boost
          </span>
        </div>
        <h2 className="mb-2 text-base leading-snug font-extrabold text-slate-900">
          Experience Distraction Free Learning
        </h2>
        <div
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm"
          aria-label="Focus Mode preview"
        >
          <Zap className="h-3.5 w-3.5" aria-hidden="true" />
          Focus Mode
        </div>
        <p className="text-[11px] leading-relaxed font-normal text-slate-400">
          {focus.description}
        </p>
      </div>
      <div className="border-t border-slate-100 pt-3.5 text-left">
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="font-bold text-slate-700">
            {focus.sessionsCompleted}
            <span className="font-normal text-slate-400">/{focus.sessionsTarget}</span>
          </span>
          <span className="text-[10px] text-slate-400">Sessions completed today</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-sky-500"
            style={{ width: `${(focus.sessionsCompleted / focus.sessionsTarget) * 100}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

function LearningStreakCard({ streak }: { streak: StreakData }) {
  const arcLength = 141;
  const offset = arcLength * (1 - streak.gaugeValue / streak.gaugeMaximum);
  return (
    <Card className={`${cardClass} justify-between`}>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Learning Streak</h2>
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
            🔥 Active
          </span>
        </div>
        <p className="mb-1 text-xs font-medium text-slate-400">Your longest learning streak</p>
        <div className="mb-2 flex items-baseline gap-1">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">
            {streak.longestTotal.toLocaleString('en-US')}
          </span>
          <span className="text-xs font-semibold text-slate-400">/days</span>
        </div>
        <div className="relative my-0.5 flex flex-col items-center justify-center">
          <svg
            className="h-22 w-40 overflow-visible"
            viewBox="0 0 120 70"
            role="img"
            aria-label={`Gauge showing ${streak.gaugeValue} of ${streak.gaugeMaximum}`}
          >
            <defs>
              <linearGradient id="studentStreakGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>
            <path
              d="M 15 65 A 45 45 0 0 1 105 65"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 15 65 A 45 45 0 0 1 105 65"
              fill="none"
              stroke="url(#studentStreakGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute bottom-0 text-center">
            <span className="text-xl font-extrabold text-slate-900">{streak.gaugeValue}</span>
            <p className="-mt-0.5 text-[10px] font-medium text-slate-400">your learning streak</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-sm" aria-hidden="true">
            🔥
          </span>
          <div>
            <p className="text-[10px] font-medium text-slate-400">Current Streak</p>
            <p className="text-xs font-extrabold text-slate-900">{streak.currentDays} days</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-right">
          <span className="text-sm" aria-hidden="true">
            🏆
          </span>
          <div>
            <p className="text-[10px] font-medium text-slate-400">Best Streak</p>
            <p className="text-xs font-extrabold text-slate-900">{streak.bestDays} days</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function LearningInsights({
  activity,
  focus,
  streak,
}: {
  activity: LearningActivity;
  focus: FocusCardData;
  streak: StreakData;
}) {
  return (
    <section
      aria-label="Learning insights"
      className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-5"
    >
      <LearningActivityCard activity={activity} />
      <FocusModeCard focus={focus} />
      <LearningStreakCard streak={streak} />
    </section>
  );
}
