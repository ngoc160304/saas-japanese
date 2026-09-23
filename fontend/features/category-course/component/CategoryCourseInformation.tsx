import { FolderOpen } from 'lucide-react';
import type { CourseCategoryDetail } from '@/apis/categories-course/categories-course.type';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { CourseThumbnail } from '@/features/course/component/CourseThumbnail';

export function CategoryCourseInformation({ category }: { category: CourseCategoryDetail }) {
  return (
    <PageSection className="mb-6">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="flex min-w-0 items-start gap-4 md:items-center">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-sky-100 bg-sky-50 p-1 shadow-xs">
            {category.mediaUrl ? (
              <CourseThumbnail src={category.mediaUrl} title={category.name} />
            ) : (
              <FolderOpen className="size-7 text-sky-600" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
              Danh mục khóa học
            </span>
            <p className="mt-1 break-words text-xs font-medium text-slate-600">
              {category.description || 'Chưa có mô tả'}
            </p>
          </div>
        </div>
        <dl className="flex w-full shrink-0 justify-between gap-6 border-t border-slate-100 pt-3 text-right md:w-auto md:border-0 md:pt-0">
          <div>
            <dt className="text-xs font-medium text-slate-400">Khóa học</dt>
            <dd className="mt-0.5 text-lg font-extrabold text-slate-900">
              {category.courseCount} khóa học
            </dd>
          </div>
        </dl>
      </div>
    </PageSection>
  );
}
