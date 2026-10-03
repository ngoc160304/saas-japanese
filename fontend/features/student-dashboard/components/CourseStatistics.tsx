import Image from 'next/image';
import type { CourseStatistic } from '../types';

const tones: Record<string, string> = {
  sky: 'from-sky-50/90 via-blue-50/70 to-sky-100/80 border-sky-100',
  amber: 'from-amber-50/90 via-orange-50/70 to-amber-100/80 border-amber-100',
  emerald: 'from-emerald-50/90 via-teal-50/70 to-emerald-100/80 border-emerald-100',
};
const imageTones: Record<string, string> = {
  sky: '',
  amber: 'hue-rotate-15',
  emerald: 'hue-rotate-90',
};

export function CourseStatistics({ statistics }: { statistics: CourseStatistic[] }) {
  return (
    <section
      aria-label="Course statistics"
      className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-5"
    >
      {statistics.map((statistic) => (
        <div
          key={statistic.label}
          className={`shadow-soft shadow-hover relative overflow-hidden rounded-3xl border bg-gradient-to-br p-5 ${tones[statistic.tone] ?? tones.sky}`}
        >
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900 lg:text-4xl">
                {statistic.value}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{statistic.label}</p>
            </div>
            <Image
              src="/student/book_3d.jpg"
              alt=""
              width={64}
              height={64}
              className={`h-16 w-16 shrink-0 rounded-xl object-contain drop-shadow-md ${imageTones[statistic.tone] ?? ''}`}
            />
          </div>
        </div>
      ))}
    </section>
  );
}
