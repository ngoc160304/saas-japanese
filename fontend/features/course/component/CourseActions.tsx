import Link from 'next/link';
import { Eye, Pencil } from 'lucide-react';
import type { Course } from '@/apis/courses/courses.type';
import { CourseDeleteDialog } from './CourseDeleteDialog';

export function CourseActions({ course, manage = false }: { course: Course; manage?: boolean }) {
  return (
    <div className="flex items-start gap-1.5 whitespace-nowrap">
      <Link
        href={`/admin/courses/${course.id}`}
        title="Xem danh sách bài học"
        aria-label={`Xem danh sách bài học của ${course.title}`}
        className="inline-flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-900 text-white hover:border-sky-600 hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-sky-500"
      >
        <Eye className="size-4" aria-hidden="true" />
      </Link>
      {manage && (
        <>
          <Link
            href={`/admin/courses/${course.id}/edit`}
            aria-label={`Sửa ${course.title}`}
            className="inline-flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-2 focus-visible:outline-sky-500"
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Link>
          <CourseDeleteDialog course={course} />
        </>
      )}
    </div>
  );
}
