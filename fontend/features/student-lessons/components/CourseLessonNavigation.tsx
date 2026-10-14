import Link from 'next/link';
import { CheckCircle2, ChevronLeft, ChevronRight, ListVideo } from 'lucide-react';
import type { StudyLessonSummary } from '@/apis/study/study.type';
import { lessonHref } from '../utils/lesson-route';
import { studyLinkClass } from './StudyState';

export function CourseLessonNavigation({
  lessons,
  courseId,
  lessonId,
}: {
  lessons: StudyLessonSummary[];
  courseId: number;
  lessonId: number;
}) {
  return (
    <nav
      aria-label="Course lessons"
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft"
    >
      <details open>
        <summary className="cursor-pointer rounded-md text-sm font-bold text-slate-900 focus-visible:outline-2 focus-visible:outline-sky-500">
          <ListVideo className="mr-2 inline size-4 text-sky-700" aria-hidden="true" />
          Course lessons ({lessons.length})
        </summary>
        {lessons.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No published lessons are available.</p>
        ) : (
          <ol className="mt-4 max-h-80 space-y-2 overflow-y-auto xl:max-h-[65vh]">
            {lessons.map((lesson, index) => (
              <li key={lesson.id}>
                <Link
                  href={lessonHref(courseId, lesson.id)}
                  aria-current={lesson.id === lessonId ? 'page' : undefined}
                  className={`flex min-w-0 items-start gap-2 rounded-xl border p-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${lesson.id === lessonId ? 'border-primary bg-primary text-white' : 'border-slate-100 text-slate-700 hover:border-sky-200 hover:bg-sky-50'}`}
                >
                  <span className="shrink-0 text-xs font-bold">{index + 1}.</span>
                  <span className="min-w-0 flex-1 break-words font-semibold">
                    {lesson.title}
                    <span className="mt-1 block text-xs font-normal">
                      {lesson.isCompleted ? 'Completed' : `${lesson.progressPercent}% watched`}
                      {lesson.durationMinutes !== null &&
                        ` · ${lesson.durationMinutes} min estimated`}
                    </span>
                  </span>
                  {lesson.isCompleted && (
                    <CheckCircle2 aria-label="Completed" className="size-4 shrink-0" />
                  )}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </details>
    </nav>
  );
}

export function AdjacentLessonNavigation({
  lessons,
  courseId,
  lessonId,
}: {
  lessons: StudyLessonSummary[];
  courseId: number;
  lessonId: number;
}) {
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return null;
  const previous = index > 0 ? lessons[index - 1] : undefined;
  const next = index >= 0 ? lessons[index + 1] : undefined;
  return (
    <nav
      aria-label="Previous and next lesson"
      className="flex flex-wrap justify-between gap-4 border-t border-slate-200 pt-5 text-sm"
    >
      {previous ? (
        <Link
          href={lessonHref(courseId, previous.id)}
          className={`${studyLinkClass} max-w-full break-words`}
        >
          <ChevronLeft className="mr-1 inline size-4" aria-hidden="true" />
          Previous: {previous.title}
        </Link>
      ) : (
        <span className="text-slate-500">First lesson</span>
      )}
      {next ? (
        <Link
          href={lessonHref(courseId, next.id)}
          className={`${studyLinkClass} max-w-full break-words`}
        >
          Next: {next.title}
          <ChevronRight className="ml-1 inline size-4" aria-hidden="true" />
        </Link>
      ) : (
        index >= 0 && <span className="text-slate-500">Last lesson</span>
      )}
    </nav>
  );
}
