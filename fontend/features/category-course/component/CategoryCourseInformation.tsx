import { FolderOpen } from 'lucide-react';
import type { CourseCategoryDetail } from '@/apis/categories-course/categories-course.type';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { CourseThumbnail } from '@/features/course/component/CourseThumbnail';

export function CategoryCourseInformation({ category }: { category: CourseCategoryDetail }) {
  return (
    <PageSection className="mb-6">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          {category.mediaUrl ? (
            <CourseThumbnail src={category.mediaUrl} title={category.name} />
          ) : (
            <FolderOpen className="size-14 shrink-0 rounded-2xl bg-sky-50 p-3 text-sky-600" />
          )}
          <div className="min-w-0 space-y-2">
            <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
              Category ID: {category.id}
            </span>
            <p className="break-words text-sm text-slate-600">
              {category.description || 'Chưa có mô tả'}
            </p>
            <p className="break-all text-xs text-slate-400">{category.slug}</p>
          </div>
        </div>
        <dl className="flex shrink-0 justify-between gap-6 border-t border-slate-100 pt-3 text-right md:border-0 md:pt-0">
          <div>
            <dt className="text-xs text-slate-400">Khóa học</dt>
            <dd className="mt-1 text-lg font-bold text-slate-900">{category.courseCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Tổng bài học</dt>
            <dd className="mt-1 text-lg font-bold text-sky-600">{category.lessonCount}</dd>
          </div>
        </dl>
      </div>
    </PageSection>
  );
}
