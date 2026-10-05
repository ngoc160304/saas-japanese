import { BookOpen, Clock3 } from 'lucide-react';
import type { ClientCourseLesson } from '@/apis/courses/client-courses.type';

export function LessonList({ lessons }: { lessons: ClientCourseLesson[] }) {
  return (
    <section
      aria-labelledby="student-lessons-title"
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft md:p-6"
    >
      <div className="mb-6 border-b border-slate-100 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="student-lessons-title" className="text-base font-bold text-slate-900">
            Lessons
          </h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
            {lessons.length} {lessons.length === 1 ? 'Lesson' : 'Lessons'}
          </span>
        </div>
        <p className="mt-0.5 text-xs font-medium text-slate-400">
          Available lessons in this course.
        </p>
      </div>
      {lessons.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No lessons are available yet.</p>
      ) : (
        <ol className="space-y-4">
          {lessons.map((lesson, index) => (
            <li
              key={lesson.id}
              className="flex items-center gap-3.5 rounded-3xl border border-slate-200/80 bg-slate-50/70 p-4 shadow-soft md:p-5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-extrabold text-slate-700">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-extrabold text-slate-900 md:text-base">
                  {lesson.title}
                </h3>
                {lesson.durationMinutes !== null && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                    {lesson.durationMinutes} min
                  </p>
                )}
              </div>
              <BookOpen className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
