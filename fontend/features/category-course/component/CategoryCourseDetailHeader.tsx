import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { CourseCategoryDetail } from '@/apis/categories-course/categories-course.type';
import { CategoryCourseAction } from './CategoryCourseActions';

export function CategoryCourseDetailHeader({
  category,
  onDeleted,
}: {
  category: CourseCategoryDetail;
  onDeleted: () => void;
}) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <nav
          aria-label="Đường dẫn"
          className="mb-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400"
        >
          <Link
            href="/admin/categories-course"
            className="flex items-center gap-1 font-bold text-slate-500 hover:text-slate-600 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-sky-500"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Danh mục khóa học
          </Link>
          <span aria-hidden="true">/</span>
          <span className="max-w-40 truncate font-bold text-slate-600 sm:max-w-xs">{category.name}</span>
          <span aria-hidden="true">/</span>
          <span className="font-bold text-slate-900">Khóa học</span>
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
            Danh mục: {category.name}
          </h1>
          <span className="rounded-xl border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-extrabold text-indigo-700">
            ID: {category.id}
          </span>
        </div>
        <p className="mt-0.5 text-sm font-medium text-slate-500">
          {category.description || 'Chưa có mô tả'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <CategoryCourseAction
          courseCategory={category}
          canEdit
          canDelete
          showDetail={false}
          onDeleted={onDeleted}
        />
        <Link
          href="/admin/categories-course"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-soft transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-sky-500"
        >
          Tất cả danh mục
        </Link>
      </div>
    </header>
  );
}
