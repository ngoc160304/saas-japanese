'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { jlptExamsAPI, jlptExamsQueryKeys } from '@/apis/jlpt-exams/jlpt-exams.api';
import { getApiError, getApiErrorMessage } from '@/lib/api-error';
import { selectAuthInitialized, selectCurrentUser } from '@/store/authSlice';
import { useAppSelector } from '@/store/hooks';
import { toReviewView } from '../../review/from-api';
import { filterReviewQuestions, getReviewQuestions } from '../../review/review-view';
import type { ReviewFilter } from '../../review/types';
import { ReviewNavigator } from './ReviewNavigator';
import { ReviewQuestionCard } from './ReviewQuestionCard';
import { ReviewTopBar } from './ReviewTopBar';

export function JlptExamReviewPage({ attemptId }: { attemptId: number }) {
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const initialized = useAppSelector(selectAuthInitialized);
  const user = useAppSelector(selectCurrentUser);
  const reviewQuery = useQuery({
    queryKey: jlptExamsQueryKeys.review(attemptId),
    queryFn: ({ signal }) => jlptExamsAPI.getJlptAttemptReview(attemptId, signal),
    enabled: initialized && Boolean(user),
    retry: false,
  });
  const resultQuery = useQuery({
    queryKey: jlptExamsQueryKeys.result(attemptId),
    queryFn: ({ signal }) => jlptExamsAPI.getJlptAttemptResult(attemptId, signal),
    enabled: initialized && Boolean(user) && reviewQuery.isSuccess,
    retry: false,
  });
  if (!initialized || (user && reviewQuery.isPending)) return <main role="status" className="min-h-dvh bg-[#f3f6fa] p-8 text-center text-slate-600">Loading graded attempt…</main>;
  if (!user || reviewQuery.isError || !reviewQuery.data || reviewQuery.data.attemptId !== attemptId || reviewQuery.data.status !== 'COMPLETED') {
    const status = getApiError(reviewQuery.error).status;
    return <main className="flex min-h-dvh items-center justify-center bg-[#f3f6fa] p-4"><section role="alert" className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-bold text-slate-900">Review unavailable</h1><p className="mt-2 text-sm text-slate-600">{!user || status === 401 ? 'Please sign in to review this attempt.' : status === 400 || (reviewQuery.data && reviewQuery.data.status !== 'COMPLETED') ? 'This attempt has not been submitted.' : status === 403 || status === 404 ? 'This attempt was not found for your account.' : getApiErrorMessage(reviewQuery.error)}</p><div className="mt-5 flex justify-center gap-4">{user && <button type="button" onClick={() => void reviewQuery.refetch()} disabled={reviewQuery.isFetching} className="text-sm font-bold text-sky-700 underline disabled:opacity-50">{reviewQuery.isFetching ? 'Retrying…' : 'Retry'}</button>}<Link href={user ? '/student/jlpt-exams' : '/login'} className="text-sm font-bold text-slate-600 underline">{user ? 'Browse exams' : 'Sign in'}</Link></div></section></main>;
  }
  const review = toReviewView(reviewQuery.data);
  const questions = getReviewQuestions(review);
  const visibleQuestions = filterReviewQuestions(questions, filter);
  const activeIndex = visibleQuestions.findIndex((entry) => entry.question.questionId === activeQuestionId);
  const currentIndex = activeIndex >= 0 ? activeIndex : 0;
  const activeQuestion = visibleQuestions[currentIndex];
  const counts = {
    all: questions.length,
    correct: questions.filter((entry) => entry.status === 'correct').length,
    incorrect: questions.filter((entry) => entry.status === 'incorrect').length,
    unanswered: questions.filter((entry) => entry.status === 'unanswered').length,
  };

  function showQuestion(questionId: number) {
    setActiveQuestionId(questionId);
    requestAnimationFrame(() => {
      const panel = document.getElementById('review-question-panel');
      const header = document.getElementById('review-top-bar');
      if (!panel || !header) return;
      const top = window.scrollY + panel.getBoundingClientRect().top - header.getBoundingClientRect().height - 16;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  }

  function changeFilter(nextFilter: ReviewFilter) {
    setFilter(nextFilter);
    const firstQuestion = filterReviewQuestions(questions, nextFilter)[0];
    if (firstQuestion) showQuestion(firstQuestion.question.questionId);
    else setActiveQuestionId(null);
  }

  return (
    <div className="min-h-screen bg-[#f3f6fa] text-slate-800 antialiased">
      <ReviewTopBar review={review} filter={filter} counts={counts} onFilterChange={changeFilter} />
      <main className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
        <h1 className="sr-only">Review attempt #{review.attemptId}: {review.examTitle}</h1>
        <section aria-label="Exam summary" className="mb-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
          <h2 className="font-extrabold text-slate-900">{review.examTitle} · {review.jlptLevel}</h2>
          {resultQuery.isSuccess && resultQuery.data.attemptId === attemptId ? <p className="mt-2 text-sm font-semibold text-slate-700">Score: {resultQuery.data.totalScore} / {resultQuery.data.maxScore} · {resultQuery.data.correctCount} / {resultQuery.data.totalQuestions} correct{resultQuery.data.isPassed === null || resultQuery.data.isPassed === undefined ? '' : resultQuery.data.isPassed ? ' · Passed' : ' · Not passed'}</p> : <p className="mt-2 text-sm text-slate-500">{resultQuery.isError ? 'Score unavailable right now. The graded answers below remain available.' : 'Loading score…'}</p>}
        </section>
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div id="review-question-panel" className="space-y-5 lg:col-span-8">
            {activeQuestion ? (
              <>
                <ReviewQuestionCard entry={activeQuestion} total={questions.length} />
                <div aria-label="Question controls" className="flex items-center justify-between gap-3 pt-2">
                  <button type="button" disabled={currentIndex === 0} onClick={() => showQuestion(visibleQuestions[currentIndex - 1].question.questionId)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5">
                    ← Previous Question
                  </button>
                  <button type="button" disabled={currentIndex === visibleQuestions.length - 1} onClick={() => showQuestion(visibleQuestions[currentIndex + 1].question.questionId)} className="rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white shadow-xs hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-40 sm:px-6">
                    Next Question →
                  </button>
                </div>
              </>
            ) : (
              <section role="status" className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
                No questions match this filter.
              </section>
            )}
          </div>
          <ReviewNavigator review={review} questions={visibleQuestions} activeQuestionId={activeQuestion?.question.questionId ?? 0} counts={counts} onSelectQuestion={showQuestion} />
        </div>
        <section aria-label="Finish review" className="mt-8 flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center md:p-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Finished checking your answers?</h2>
            <p className="mt-1 text-xs text-slate-500">View the score and breakdown for this attempt.</p>
          </div>
          <Link href={`/student/jlpt_exam_result/${review.attemptId}`} className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-extrabold text-white shadow-xs transition-colors hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:w-auto">
            View Result →
          </Link>
        </section>
      </main>
    </div>
  );
}
