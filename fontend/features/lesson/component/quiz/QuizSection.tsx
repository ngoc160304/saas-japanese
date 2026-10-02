'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { quizAPI } from '@/apis/lessons/lesson-content.api';
import { Button } from '@/components/ui/button';
import { getApiError } from '@/lib/api-error';
import { QuizQuestionCard } from './QuizQuestionCard';

interface QuizSectionProps {
  lessonId: number;
  active: boolean;
  onCountChange: (count: number) => void;
}

export function QuizSection({ lessonId, active, onCountChange }: QuizSectionProps) {
  const quizQuery = useQuery({
    queryKey: ['study', 'lessons', lessonId, 'quiz'],
    queryFn: () => quizAPI.getStudyByLesson(lessonId),
    enabled: active && Number.isSafeInteger(lessonId) && lessonId > 0,
    retry: false,
  });
  const error = quizQuery.isError ? getApiError(quizQuery.error) : null;
  const isQuizMissing = error?.status === 404 && error.message === 'Không tìm thấy quiz của lesson';
  const quiz = quizQuery.isError ? null : quizQuery.data;
  const questions = quiz ? [...quiz.questions].sort((a, b) => a.sortOrder - b.sortOrder) : [];

  useEffect(() => {
    onCountChange(questions.length);
  }, [onCountChange, questions.length]);

  return (
    <section
      aria-labelledby="quiz-heading"
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft md:p-6"
    >
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2
          id="quiz-heading"
          className="flex flex-wrap items-baseline gap-2 text-base font-bold text-slate-900 md:text-lg"
        >
          Quiz Assessment &amp; Question Bank
          <span className="text-xs font-normal text-slate-500">| Bài kiểm tra</span>
        </h2>
        <p className="mt-0.5 text-xs font-medium text-slate-600">
          Đề kiểm tra cuối bài và danh sách câu hỏi trắc nghiệm.
        </p>
      </div>

      {quizQuery.isFetching && !quizQuery.data ? (
        <p role="status" className="py-10 text-center text-xs text-slate-500">
          Đang tải Quiz...
        </p>
      ) : isQuizMissing ? (
        <p className="py-10 text-center text-xs text-slate-500">Bài học chưa có Quiz.</p>
      ) : error ? (
        <div role="alert" className="space-y-3 py-10 text-center text-xs text-slate-600">
          <p>Không thể tải Quiz. {error.message}</p>
          <Button type="button" variant="outline" onClick={() => void quizQuery.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : quiz ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 md:p-5">
            <h3 className="mb-3 text-xs font-bold text-amber-900">Thông tin Quiz</h3>
            <dl className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              <div>
                <dt className="mb-1 text-[11px] font-bold text-slate-600">Quiz Title</dt>
                <dd className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800">
                  {quiz.title.trim() || 'Quiz chưa có tiêu đề.'}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-[11px] font-bold text-slate-600">Mô tả</dt>
                <dd className="whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800">
                  {quiz.description.trim() || 'Chưa có mô tả.'}
                </dd>
              </div>
            </dl>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Quiz Questions ({questions.length})
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-600">
              Câu hỏi trắc nghiệm kiểm tra kiến thức bài học
            </p>
          </div>
          {questions.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-500">Quiz chưa có câu hỏi.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <QuizQuestionCard key={question.id} question={question} number={index + 1} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
