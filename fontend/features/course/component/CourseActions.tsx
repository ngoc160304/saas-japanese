import type { Course } from '@/apis/courses/courses.type';

export function CourseActions({ course }: { course: Course }) {
  return (
    <details className="max-w-64 whitespace-normal text-left text-xs">
      <summary className="cursor-pointer rounded-xl bg-slate-900 px-3 py-2 font-semibold text-white hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-sky-500">
        Xem thông tin<span className="sr-only">: {course.title}</span>
      </summary>
      <div className="mt-2 space-y-2 break-words rounded-xl border border-slate-100 bg-slate-50 p-3">
        <p className="font-semibold">{course.title}</p>
        <p>ID: {course.id}</p>
        <p>Slug: {course.slug || '—'}</p>
        <p>{course.description || 'Chưa có mô tả'}</p>
      </div>
    </details>
  );
}
