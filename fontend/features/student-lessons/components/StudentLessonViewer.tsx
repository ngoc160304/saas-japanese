'use client';

import Link from 'next/link';
import { useState, type KeyboardEvent } from 'react';
import { ArrowLeft, BookOpen, Clock3 } from 'lucide-react';
import type { StudyLesson } from '@/apis/study/study.type';
import { selectCurrentUser } from '@/store/authSlice';
import { useAppSelector } from '@/store/hooks';
import { useStudyLesson, useStudyLessons, useStudyProgress } from '../hooks/useStudyQueries';
import { AdjacentLessonNavigation, CourseLessonNavigation } from './CourseLessonNavigation';
import { LessonProgressDisplay } from './LessonProgressDisplay';
import { LessonReadingSection } from './LessonReadingSection';
import { VocabularySection } from './VocabularySection';
import { KanjiSection } from './KanjiSection';
import { QuizSection } from './QuizSection';
import { StudyError, StudyLoading, studyLinkClass } from './StudyState';

const tabs = [
  { id: 'reading', label: 'Grammar + Video' },
  { id: 'vocabulary', label: 'Vocabulary' },
  { id: 'kanji', label: 'Kanji' },
  { id: 'quiz', label: 'Quiz' },
] as const;
type LessonTab = (typeof tabs)[number]['id'];

export function StudentLessonViewer({
  courseId,
  lessonId,
}: {
  courseId: number;
  lessonId: number;
}) {
  const userId = useAppSelector(selectCurrentUser)?.id;
  const query = useStudyLesson(userId, courseId, lessonId);
  if (query.isError)
    return (
      <StudyError
        error={query.error}
        onRetry={() => void query.refetch()}
        courseId={courseId}
        label="Could not load this lesson"
      />
    );
  if (query.isPending || userId === undefined) return <StudyLoading />;
  return (
    <LessonStudyContent
      key={`${userId}-${courseId}-${lessonId}`}
      userId={userId}
      lesson={query.data}
    />
  );
}

function LessonStudyContent({ userId, lesson }: { userId: number; lesson: StudyLesson }) {
  const { courseId, id: lessonId } = lesson;
  const lessons = useStudyLessons(userId, courseId);
  const progress = useStudyProgress(userId, courseId, lessonId);
  const [tab, setTab] = useState<LessonTab>('reading');
  const scope = { userId, courseId, lessonId };

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    setTab(tabs[next].id);
    document.getElementById(`study-tab-${tabs[next].id}`)?.focus();
  }

  return (
    <div className="min-w-0 space-y-6">
      <header className="space-y-3">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs text-slate-500"
        >
          <Link href="/student/courses" className={studyLinkClass}>
            My courses
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/student/courses/${courseId}`} className={studyLinkClass}>
            {progress.course.data?.courseTitle ?? 'Course'}
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="min-w-0 break-words text-slate-700">
            {lesson.title}
          </span>
        </nav>
        <Link
          href={`/student/courses/${courseId}`}
          className={`${studyLinkClass} inline-flex items-center gap-1 text-sm`}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to course
        </Link>
        <h1 className="break-words text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
          {lesson.title}
        </h1>
        <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
          <BookOpen className="size-4" aria-hidden="true" />
          Lesson
          {lesson.durationMinutes !== null && (
            <>
              <Clock3 className="ml-2 size-4" aria-hidden="true" />
              {lesson.durationMinutes} min estimated study time
            </>
          )}
        </p>
      </header>
      <LessonProgressDisplay lesson={progress.lesson.data} course={progress.course.data} />
      {(progress.lesson.isPending || progress.course.isPending) && (
        <StudyLoading label="Loading progress…" />
      )}
      {progress.lesson.isError && (
        <StudyError
          error={progress.lesson.error}
          onRetry={() => void progress.lesson.refetch()}
          label="Could not load lesson progress"
        />
      )}
      {progress.course.isError && (
        <StudyError
          error={progress.course.error}
          onRetry={() => void progress.course.refetch()}
          label="Could not load course progress"
        />
      )}
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-6">
          <section
            aria-label="Learning content"
            className="min-w-0 rounded-3xl border border-slate-100 bg-white p-4 shadow-soft md:p-6"
          >
            <div
              role="tablist"
              aria-label="Lesson sections"
              className="mb-6 grid grid-cols-2 gap-2 border-b border-slate-100 pb-4 sm:grid-cols-4"
            >
              {tabs.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`study-tab-${item.id}`}
                  aria-selected={tab === item.id}
                  aria-controls={`study-panel-${item.id}`}
                  tabIndex={tab === item.id ? 0 : -1}
                  onClick={() => setTab(item.id)}
                  onKeyDown={(event) => navigateTabs(event, index)}
                  className={`rounded-xl px-3 py-3 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${tab === item.id ? 'bg-primary text-white' : 'bg-slate-50 text-slate-600 hover:bg-sky-50 hover:text-sky-800'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div
              role="tabpanel"
              id="study-panel-reading"
              aria-labelledby="study-tab-reading"
              hidden={tab !== 'reading'}
              tabIndex={0}
            >
              <LessonReadingSection
                lesson={lesson}
                userId={userId}
                progress={progress.lesson.data}
                active={tab === 'reading'}
              />
            </div>
            <div
              role="tabpanel"
              id="study-panel-vocabulary"
              aria-labelledby="study-tab-vocabulary"
              hidden={tab !== 'vocabulary'}
              tabIndex={0}
            >
              <VocabularySection {...scope} active={tab === 'vocabulary'} />
            </div>
            <div
              role="tabpanel"
              id="study-panel-kanji"
              aria-labelledby="study-tab-kanji"
              hidden={tab !== 'kanji'}
              tabIndex={0}
            >
              <KanjiSection {...scope} active={tab === 'kanji'} />
            </div>
            <div
              role="tabpanel"
              id="study-panel-quiz"
              aria-labelledby="study-tab-quiz"
              hidden={tab !== 'quiz'}
              tabIndex={0}
            >
              <QuizSection {...scope} active={tab === 'quiz'} />
            </div>
          </section>
          {lessons.data && (
            <AdjacentLessonNavigation
              lessons={lessons.data}
              courseId={courseId}
              lessonId={lessonId}
            />
          )}
        </div>
        <aside className="order-first min-w-0 xl:order-last">
          {lessons.isPending ? (
            <StudyLoading label="Loading course lessons…" />
          ) : lessons.isError ? (
            <StudyError
              error={lessons.error}
              onRetry={() => void lessons.refetch()}
              courseId={courseId}
              label="Could not load course navigation"
            />
          ) : (
            <CourseLessonNavigation
              lessons={lessons.data}
              courseId={courseId}
              lessonId={lessonId}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
