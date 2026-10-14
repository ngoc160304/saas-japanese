'use client';

import { useState } from 'react';
import type { StudyQuizQuestion } from '@/apis/study/study.type';
import { getApiError } from '@/lib/api-error';
import { useLessonQuiz, useQuizAnswer } from '../hooks/useLessonQuiz';
import { StudyError, StudyLoading, studyButtonClass } from './StudyState';

interface Scope {
  userId: number;
  courseId: number;
  lessonId: number;
}

export function QuizSection({ userId, courseId, lessonId, active }: Scope & { active: boolean }) {
  const query = useLessonQuiz(userId, courseId, lessonId, active);
  if (!active && !query.data) return null;
  if (query.isError)
    return (
      <StudyError error={query.error} onRetry={() => void query.refetch()} courseId={courseId} />
    );
  if (query.isPending) return <StudyLoading label="Loading quiz…" />;
  if (query.data === null)
    return (
      <p className="rounded-2xl bg-emerald-50 p-5 text-sm text-slate-600">
        No published quiz is available for this lesson.
      </p>
    );
  const quiz = query.data;
  return (
    <section aria-labelledby="quiz-title" className="space-y-5">
      <header>
        <h2 id="quiz-title" className="text-lg font-bold text-slate-900">
          {quiz.title}
        </h2>
        {quiz.description && <p className="mt-1 text-sm text-slate-600">{quiz.description}</p>}
      </header>
      {quiz.questions.length === 0 && (
        <p className="text-sm text-slate-600">This quiz has no available questions.</p>
      )}
      {quiz.questions.map((question, index) => (
        <QuizQuestion
          key={`${quiz.id}-${question.id}`}
          question={question}
          index={index}
          quizId={quiz.id}
          userId={userId}
          courseId={courseId}
          lessonId={lessonId}
        />
      ))}
    </section>
  );
}

function QuizQuestion({
  question,
  index,
  quizId,
  userId,
  courseId,
  lessonId,
}: Scope & {
  question: StudyQuizQuestion;
  index: number;
  quizId: number;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const { mutation, submit } = useQuizAnswer(userId, courseId, lessonId, quizId, question.id);
  const supported = question.questionType === 'SINGLE_CHOICE';
  const feedback = mutation.data;
  const errorStatus = getApiError(mutation.error).status;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (selected !== null) void submit(selected);
      }}
      className="min-w-0 space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 md:p-5"
    >
      <fieldset
        disabled={!supported || mutation.isPending || mutation.isSuccess}
        className="min-w-0 space-y-3"
      >
        <legend className="mb-3 w-full break-words whitespace-pre-wrap text-sm font-bold text-slate-900">
          {index + 1}. {question.questionText}
        </legend>
        {question.options.map((option) => (
          <label
            key={option.id}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-sky-500 ${feedback?.correctOptionId === option.id ? 'border-emerald-500' : 'border-slate-200 hover:border-sky-300'}`}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={option.id}
              checked={selected === option.id}
              onChange={() => setSelected(option.id)}
              className="mt-1 shrink-0 accent-sky-700"
            />
            <span className="min-w-0 break-words whitespace-pre-wrap">
              {option.optionText}
              {feedback?.correctOptionId === option.id && (
                <span className="ml-2 font-semibold text-emerald-700">Correct answer</span>
              )}
            </span>
          </label>
        ))}
      </fieldset>
      {!supported ? (
        <p className="text-sm text-amber-900">
          Interactive answers are unavailable for this question type.
        </p>
      ) : (
        <button
          type="submit"
          disabled={
            selected === null ||
            mutation.isPending ||
            mutation.isSuccess ||
            question.options.length === 0
          }
          className={studyButtonClass}
        >
          {mutation.isPending
            ? 'Checking answer…'
            : mutation.isSuccess
              ? 'Answer checked'
              : 'Check answer'}
        </button>
      )}
      {feedback && (
        <div
          role="status"
          className={`rounded-xl p-3 text-sm font-semibold ${feedback.correct ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}
        >
          <p>
            {feedback.correct ? 'Correct.' : 'Incorrect.'} {feedback.message}
          </p>
        </div>
      )}
      {mutation.isError && (
        <p role="alert" className="text-sm text-rose-800">
          {errorStatus === 401
            ? 'Your session has expired. Sign in again.'
            : errorStatus === 403
              ? 'You no longer have access to this quiz.'
              : errorStatus === 404
                ? 'This question is no longer available.'
                : 'The answer could not be checked. Your selection is kept; use Check answer to retry.'}
        </p>
      )}
    </form>
  );
}
