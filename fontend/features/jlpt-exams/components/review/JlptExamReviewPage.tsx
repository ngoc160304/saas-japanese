'use client';

import { useState } from 'react';
import { getMockAttemptReview } from '../../review/mock-data';
import { filterReviewQuestions, getReviewQuestions } from '../../review/review-view';
import type { ReviewFilter } from '../../review/types';
import { ReviewNavigator } from './ReviewNavigator';
import { ReviewQuestionCard } from './ReviewQuestionCard';
import { ReviewTopBar } from './ReviewTopBar';

export function JlptExamReviewPage({ attemptId }: { attemptId: number }) {
  const review = getMockAttemptReview(attemptId);
  const questions = getReviewQuestions(review);
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(questions[0]?.question.questionId ?? null);
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
      </main>
    </div>
  );
}
