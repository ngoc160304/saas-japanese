import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, LockKeyhole } from 'lucide-react';
import type { ClientCourseLesson } from '@/apis/courses/client-courses.type';
import type { StudyLessonSummary } from '@/apis/study/study.type';
import { lessonHref } from '@/features/student-lessons/utils/lesson-route';
import { studyLinkClass } from '@/features/student-lessons/components/StudyState';

type LessonListProps = {
  courseId: number;
  checkingEnrollment: boolean;
} & (
  | { accessible: true; lessons: StudyLessonSummary[] }
  | { accessible: false; lessons: ClientCourseLesson[] }
);

export function LessonList(props: LessonListProps) {
  const { courseId, lessons, checkingEnrollment } = props;
  const progressById = new Map(
    props.accessible ? props.lessons.map((lesson) => [lesson.id, lesson] as const) : [],
  );
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
        <p className="mt-1 text-xs text-slate-500">
          Grammar, video, vocabulary, kanji and practice, one lesson at a time.
        </p>
        {!props.accessible && (
          <p className="mt-3 text-sm text-slate-600">
            {checkingEnrollment ? (
              'Checking your enrollment…'
            ) : (
              <>
                Enroll in this course to open its lessons.{' '}
                <a href="#course-enrollment" className={studyLinkClass}>
                  View enrollment options
                </a>
              </>
            )}
          </p>
        )}
      </div>
      {lessons.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No lessons are available yet.</p>
      ) : (
        <ol className="space-y-4">
          {lessons.map((lesson, index) => {
            const progress = progressById.get(lesson.id);
            const content = (
              <>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-extrabold text-slate-700">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-extrabold text-slate-900 md:text-base">
                    {lesson.title}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    {lesson.durationMinutes !== null && (
                      <span className="flex items-center gap-1">
                        <Clock3 className="size-3.5" aria-hidden="true" />
                        {lesson.durationMinutes} min estimated
                      </span>
                    )}
                    {progress && (
                      <span
                        className={
                          progress.isCompleted ? 'font-bold text-emerald-700' : 'text-sky-800'
                        }
                      >
                        {progress.isCompleted ? (
                          <>
                            <CheckCircle2 className="mr-1 inline size-3.5" aria-hidden="true" />
                            Completed
                          </>
                        ) : (
                          `${progress.progressPercent}% watched`
                        )}
                      </span>
                    )}
                  </div>
                </div>
                {props.accessible ? (
                  <ArrowRight className="size-4 shrink-0 text-sky-700" aria-hidden="true" />
                ) : (
                  <LockKeyhole
                    className="size-4 shrink-0 text-slate-400"
                    aria-label="Enrollment required"
                  />
                )}
              </>
            );
            const cardClass =
              'flex min-w-0 items-center gap-3.5 rounded-3xl border border-slate-200/80 bg-slate-50/70 p-4 shadow-soft md:p-5';
            return (
              <li key={lesson.id}>
                {props.accessible ? (
                  <Link
                    href={lessonHref(courseId, lesson.id)}
                    className={`${cardClass} transition-colors hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500`}
                  >
                    {content}
                  </Link>
                ) : (
                  <div className={cardClass}>{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
