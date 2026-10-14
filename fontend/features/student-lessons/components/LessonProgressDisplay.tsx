import type { CourseProgress, LessonProgress } from '@/apis/study/study.type';

export function LessonProgressDisplay({
  lesson,
  course,
}: {
  lesson?: LessonProgress;
  course?: CourseProgress;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {lesson && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
          <p className="text-xs font-semibold text-slate-600">Lesson progress</p>
          <p className="mt-1 text-lg font-extrabold text-primary">
            {lesson.progressPercent}%
            <span className="ml-2 text-xs font-semibold text-emerald-700">
              {lesson.isCompleted
                ? 'Completed'
                : lesson.watchDuration === 0
                  ? 'Not started'
                  : 'In progress'}
            </span>
          </p>
          <progress
            aria-label="Lesson progress"
            value={lesson.progressPercent}
            max={100}
            className="mt-2 h-2 w-full accent-sky-600"
          />
        </div>
      )}
      {course && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <p className="text-xs font-semibold text-slate-600">Course progress</p>
          <p className="mt-1 text-lg font-extrabold text-emerald-700">
            {course.progressPercent}%
            <span className="ml-2 text-xs font-semibold">
              {course.completedLessons}/{course.totalLessons} lessons
            </span>
          </p>
          <progress
            aria-label="Course progress"
            value={course.progressPercent}
            max={100}
            className="mt-2 h-2 w-full accent-emerald-600"
          />
        </div>
      )}
    </div>
  );
}
