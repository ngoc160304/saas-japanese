import { Clock3 } from 'lucide-react';
import Link from 'next/link';
import type { ClientCourseDetail } from '@/apis/courses/client-courses.type';

const monthFormatter = new Intl.DateTimeFormat('vi-VN', {
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
});

export function CourseDetailHero({ course }: { course: ClientCourseDetail }) {
  return (
    <section className="border-b border-slate-800 bg-slate-900 pt-8 pb-14 text-white md:pt-12 md:pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-slate-400" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                href="/"
                className="rounded hover:text-white focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                Trang chủ
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/courses"
                className="rounded hover:text-white focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                Khóa học
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li
              className="max-w-xs truncate font-medium text-slate-200 sm:max-w-md"
              aria-current="page"
            >
              {course.title}
            </li>
          </ol>
        </nav>
        <div className="pr-0 lg:w-2/3 lg:pr-8">
          {course.categoryName && (
            <span className="mb-4 inline-flex rounded-md border border-blue-400/30 bg-brand-navy px-3 py-1 text-xs font-bold">
              {course.categoryName}
            </span>
          )}
          <h1 className="mb-4 text-2xl leading-tight font-extrabold break-words tracking-tight sm:text-3xl lg:text-4xl">
            {course.title}
          </h1>
          {course.description && (
            <p className="mb-6 text-sm leading-relaxed break-words whitespace-pre-line text-slate-300 sm:text-base">
              {course.description}
            </p>
          )}
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-300 sm:text-sm">
            <Clock3 className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span>
              Cập nhật:{' '}
              <time dateTime={course.updatedAt}>
                {monthFormatter.format(new Date(course.updatedAt))}
              </time>
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
