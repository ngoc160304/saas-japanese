import Link from 'next/link';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';

export function CourseDetailHeader({
  courseId,
  courseTitle,
  createHref,
}: {
  courseId: number;
  courseTitle: string;
  createHref: string;
}) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <nav
          aria-label="Đường dẫn"
          className="mb-1 flex min-w-0 flex-wrap items-center gap-2 text-xs font-semibold text-slate-600"
        >
          <Link
            href="/admin/courses"
            className="flex shrink-0 items-center gap-1 font-bold text-slate-700 transition-colors hover:text-slate-900 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-sky-500"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Khóa học
          </Link>
          <span aria-hidden="true">/</span>
          <span className="max-w-40 truncate font-bold text-slate-700 sm:max-w-xs">
            {courseTitle}
          </span>
          <span aria-hidden="true">/</span>
          <span className="font-bold text-slate-900">Bài học</span>
        </nav>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
          {courseTitle}
        </h1>
        <p className="mt-0.5 text-sm font-medium text-slate-700">
          Lộ trình bài học và nội dung chi tiết của khóa học.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Link
          href={`/admin/courses/${courseId}/edit`}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-sky-500"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          Sửa khóa học
        </Link>
        <Link
          href={createHref}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 md:text-sm"
        >
          <Plus className="size-4" aria-hidden="true" />
          Tạo bài học
        </Link>
      </div>
    </header>
  );
}
