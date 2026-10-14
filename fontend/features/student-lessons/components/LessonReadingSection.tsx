import type { LessonProgress, StudyLesson } from '@/apis/study/study.type';
import { LessonVideo } from './LessonVideo';
import styles from './lesson-content.module.css';

export function LessonReadingSection({
  lesson,
  userId,
  progress,
  active,
}: {
  lesson: StudyLesson;
  userId: number;
  progress: LessonProgress | undefined;
  active: boolean;
}) {
  return (
    <div className="space-y-6">
      <section aria-labelledby="lesson-video-title" className="space-y-3">
        <h2 id="lesson-video-title" className="text-lg font-bold text-slate-900">
          Lesson video
        </h2>
        {lesson.videoUrl ? (
          <LessonVideo
            key={`${lesson.id}-${lesson.videoUrl}`}
            url={lesson.videoUrl}
            title={lesson.title}
            userId={userId}
            courseId={lesson.courseId}
            lessonId={lesson.id}
            progress={progress}
            active={active}
          />
        ) : (
          <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
            No video is available for this lesson. You can study the other sections below.
          </p>
        )}
      </section>
      <section aria-labelledby="lesson-grammar-title" className="space-y-3">
        <h2 id="lesson-grammar-title" className="text-lg font-bold text-slate-900">
          Grammar
        </h2>
        {/* LessonService sanitizes every grammar write with GrammarHtmlSanitizer (Jsoup allowlist).
          Render only the protected lesson response; the scoped CSS contains its typography/layout. */}
        {lesson.grammar ? (
          <div className={styles.grammar} dangerouslySetInnerHTML={{ __html: lesson.grammar }} />
        ) : (
          <p className="rounded-2xl bg-indigo-50/60 p-5 text-sm text-slate-600">
            No grammar content has been published for this lesson.
          </p>
        )}
      </section>
    </div>
  );
}
