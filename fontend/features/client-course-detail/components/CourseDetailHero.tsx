import { Clock3, Languages, Star, Users } from 'lucide-react';
import Link from 'next/link';
import type { CourseDetailData } from '../course-detail.types';

const numberFormatter = new Intl.NumberFormat('vi-VN');
const monthFormatter = new Intl.DateTimeFormat('vi-VN', {
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
});

function formatUpdatedMonth(value: string) {
  const parts = monthFormatter.formatToParts(new Date(value));
  const month = parts.find((part) => part.type === 'month')?.value;
  const year = parts.find((part) => part.type === 'year')?.value;
  return month && year ? `${month}/${year}` : 'Chưa có dữ liệu';
}

export function CourseDetailHero({
  course,
  routeCourseId,
}: {
  course: CourseDetailData;
  routeCourseId: number;
}) {
  return (
    <section className="border-b border-slate-800 bg-slate-900 pt-8 pb-14 text-white md:pt-12 md:pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-slate-400" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                href="/"
                className="rounded transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                Trang chủ
              </Link>
            </li>
            <li aria-hidden="true" className="text-slate-600">
              /
            </li>
            <li>
              <Link
                href="/courses"
                className="rounded transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                Khóa học
              </Link>
            </li>
            <li aria-hidden="true" className="text-slate-600">
              /
            </li>
            <li
              className="max-w-xs truncate font-medium text-slate-200 sm:max-w-md"
              aria-current="page"
            >
              {course.title}
            </li>
          </ol>
        </nav>

        <div className="pr-0 lg:w-2/3 lg:pr-8">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex items-center rounded-md border border-blue-400/30 bg-brand-navy px-3 py-1 text-xs font-bold text-white">
              {course.level}
            </span>
            <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
              {course.badge}
            </span>
          </div>

          <h1 className="mb-4 text-2xl leading-tight font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
            {course.title}
          </h1>
          <p className="mb-6 text-sm leading-relaxed font-normal text-slate-300 sm:text-base">
            {course.description}
          </p>

          <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-slate-300 sm:text-sm">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <Star className="h-4 w-4 fill-current" aria-hidden="true" />
              <span>{course.rating}</span>
              <span className="font-normal text-slate-400 underline decoration-slate-600">
                ({numberFormatter.format(course.reviewCount)} đánh giá)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span>{numberFormatter.format(course.studentCount)} học viên</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock3 className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span>Cập nhật: {formatUpdatedMonth(course.updatedAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Languages className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <span>{course.languages}</span>
            </div>
          </div>
          <p className="mt-5 w-fit rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-100">
            Dữ liệu chi tiết minh họa cho đường dẫn khóa học #{routeCourseId}
          </p>
        </div>
      </div>
    </section>
  );
}
