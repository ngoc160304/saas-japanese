import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { CourseEnrollment } from '@/apis/courses/client-courses.api';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function CourseCard({ enrollment }: { enrollment: CourseEnrollment }) {
  const progress = Math.min(100, Math.max(0, enrollment.progressPercent));

  return (
    <Link
      href={`/student/courses/${enrollment.courseId}`}
      className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      aria-label={`View lessons for ${enrollment.courseTitle}`}
    >
      <article className="flex h-full flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        <div>
          <div className="relative mb-4 flex h-36 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-sky-50 p-4">
            <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm">
              {enrollment.completedAt ? 'Completed' : 'Enrolled'}
            </span>
            <BookOpen className="h-14 w-14 text-sky-300" aria-hidden="true" />
          </div>
          <h3 className="line-clamp-2 text-sm font-black text-slate-900 transition-colors group-hover:text-sky-600">
            {enrollment.courseTitle}
          </h3>
          <p className="mt-3 text-xs font-semibold text-slate-500">
            Enrolled {formatDate(enrollment.enrollAt)}
          </p>
          {enrollment.completedAt && (
            <p className="mt-1 text-xs font-semibold text-emerald-700">
              Completed {formatDate(enrollment.completedAt)}
            </p>
          )}
          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Progress</span>
              <span>{enrollment.progressPercent}%</span>
            </div>
            <div
              role="progressbar"
              aria-label={`${enrollment.courseTitle} progress`}
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
            >
              <div className="h-full rounded-full bg-sky-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-3">
          <span className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-center text-xs font-bold text-white shadow-sm transition-colors group-hover:bg-sky-600">
            View Lessons <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
      </article>
    </Link>
  );
}
