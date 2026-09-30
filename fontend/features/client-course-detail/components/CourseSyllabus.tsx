import { BookOpen } from 'lucide-react';
import type { ClientCourseLesson } from '@/apis/courses/client-courses.type';

interface CourseSyllabusProps {
  lessons: ClientCourseLesson[] | undefined;
  loading: boolean;
  error: string | null;
  retrying: boolean;
  onRetry: () => void;
  lessonCount: number;
  totalDurationMinutes: number;
}

export function CourseSyllabus({
  lessons,
  loading,
  error,
  retrying,
  onRetry,
  lessonCount,
  totalDurationMinutes,
}: CourseSyllabusProps) {
  return (
    <section
      aria-labelledby="syllabus-title"
      className="shadow-soft rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
    >
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 id="syllabus-title" className="text-lg font-bold text-slate-800 sm:text-xl">
          Nội dung khóa học
        </h2>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          {lessonCount} bài học • Tổng thời lượng đã cập nhật: {totalDurationMinutes} phút
        </p>
      </div>
      {loading ? (
        <p role="status" className="text-sm text-slate-500">
          Đang tải danh sách bài học…
        </p>
      ) : error ? (
        <div role="alert" className="space-y-3 text-sm text-slate-600">
          <p>{error}</p>
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-brand-blue focus-visible:ring-2 focus-visible:ring-brand-blue disabled:opacity-50"
          >
            {retrying ? 'Đang tải…' : 'Thử lại danh sách bài học'}
          </button>
        </div>
      ) : !lessons?.length ? (
        <p className="text-sm text-slate-500">Chưa có bài học công khai trong khóa học này.</p>
      ) : (
        <ol className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {lessons.map((lesson) => (
            <li key={lesson.id} className="flex items-start justify-between gap-4 p-4">
              <span className="flex min-w-0 items-start gap-3 text-sm font-medium text-slate-700">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="break-words">{lesson.title}</span>
              </span>
              <span className="shrink-0 text-xs text-slate-500">
                {lesson.durationMinutes === null
                  ? 'Chưa có thời lượng'
                  : `${lesson.durationMinutes} phút`}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
