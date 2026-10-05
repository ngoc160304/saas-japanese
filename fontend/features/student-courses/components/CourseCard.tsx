import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { ClientCourse } from '@/apis/courses/client-courses.type';

export function formatCoursePrice(price: number) {
  return price === 0 ? 'Free' : `${new Intl.NumberFormat('vi-VN').format(price)} ₫`;
}

export function CourseCard({ course }: { course: ClientCourse }) {
  return (
    <Link
      href={`/student/courses/${course.id}`}
      className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      aria-label={`View lessons for ${course.title}`}
    >
      <article className="flex h-full flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        <div>
          <div className="relative mb-4 flex h-36 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm">
              {formatCoursePrice(course.price)}
            </span>
            {course.thumnailURL ? (
              <Image
                src={course.thumnailURL}
                alt={course.title}
                width={112}
                height={112}
                unoptimized
                className="h-28 w-28 object-contain transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <BookOpen className="h-14 w-14 text-sky-300" aria-hidden="true" />
            )}
          </div>
          <h3 className="line-clamp-2 text-sm font-black text-slate-900 transition-colors group-hover:text-sky-600">
            {course.title}
          </h3>
          <p className="mt-2 line-clamp-2 min-h-9 text-xs font-normal leading-relaxed text-slate-500">
            {course.description || 'No description available.'}
          </p>
          <p className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500">
            <BookOpen className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            {course.lessonCount} {course.lessonCount === 1 ? 'Lesson' : 'Lessons'}
          </p>
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
