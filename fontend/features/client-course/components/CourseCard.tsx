'use client';

import { BookOpen } from 'lucide-react';
import type { ClientCourse } from '@/apis/courses/client-courses.type';
import { CourseThumbnail } from '@/features/course/component/CourseThumbnail';
import { formatCoursePrice } from '@/features/course/utils/course-format';

export function CourseCard({
  course,
  variant = 'listing',
}: {
  course: ClientCourse;
  variant?: 'listing' | 'featured';
}) {
  const isFree = course.price === 0;
  const isFeatured = variant === 'featured';

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
      <div className="relative h-40 bg-slate-100">
        <CourseThumbnail
          src={course.thumnailURL}
          title={course.title}
          className="h-40 w-full rounded-none border-0 border-b border-slate-100"
        />
        <span className="absolute top-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 shadow-sm">
          {course.categoryName ?? 'Chưa phân loại'}
        </span>
        {isFree && !isFeatured && (
          <span className="absolute top-3 right-3 rounded bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
            Miễn phí
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 line-clamp-2 text-sm font-bold text-slate-800">{course.title}</h3>
        <p className="mb-4 line-clamp-2 flex-1 text-xs text-slate-500">
          {course.description ?? 'Chưa có mô tả cho khóa học này.'}
        </p>
        {isFeatured ? (
          <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-500">{course.lessonCount} Bài học</span>
            <span className={`text-sm font-bold ${isFree ? 'text-emerald-600' : 'text-slate-800'}`}>
              {isFree ? 'Miễn phí' : formatCoursePrice(course.price)}
            </span>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-medium text-slate-500">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                {course.lessonCount} Bài học
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span
                className={`text-base font-extrabold ${isFree ? 'text-emerald-600' : 'text-slate-800'}`}
              >
                {isFree ? 'Miễn phí' : formatCoursePrice(course.price)}
              </span>
            </div>
          </>
        )}
        <button
          type="button"
          disabled
          title="Trang chi tiết khóa học chưa khả dụng"
          className={`mt-4 block w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 text-center text-sm font-semibold text-slate-400 ${isFeatured ? 'py-2' : 'py-2.5'}`}
        >
          Chi tiết sắp có
        </button>
      </div>
    </article>
  );
}
