import type { Course } from '@/apis/courses/courses.type';
import { CourseStatusBadge } from './CourseStatusBadge';
import { CourseThumbnail } from './CourseThumbnail';
import { formatCoursePrice } from '../utils/course-format';

export function CourseSummaryCard({ course }: { course: Course }) {
  return (
    <section
      aria-label="Tóm tắt khóa học"
      className="mb-6 flex flex-col items-start justify-between gap-5 rounded-3xl border border-slate-100 bg-white p-5 shadow-soft md:flex-row md:items-center md:p-6"
    >
      <div className="flex min-w-0 items-center gap-4">
        <CourseThumbnail
          src={course.thumnailURL}
          title={course.title}
          className="size-14 rounded-2xl bg-sky-50 p-1"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CourseStatusBadge published={course.published} />
            {course.categoryName && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                {course.categoryName}
              </span>
            )}
          </div>
          <p className="mt-1 max-w-3xl text-xs font-medium break-words text-slate-700">
            {course.description || 'Chưa có mô tả.'}
          </p>
        </div>
      </div>

      <div className="flex w-full shrink-0 items-center justify-between gap-6 border-t border-slate-100 pt-3 text-right md:w-auto md:justify-end md:border-t-0 md:pt-0">
        <div>
          <p className="text-xs font-semibold text-slate-600">Tổng bài học</p>
          <p className="mt-0.5 text-lg font-extrabold text-slate-900">
            {course.lessonCount === null ? '—' : `${course.lessonCount} bài`}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-600">Giá khóa học</p>
          <p className="mt-0.5 text-lg font-extrabold text-sky-600">
            {formatCoursePrice(course.price)}
          </p>
        </div>
      </div>
    </section>
  );
}
