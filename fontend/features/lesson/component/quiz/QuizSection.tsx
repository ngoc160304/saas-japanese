import type { LessonQuiz } from '@/apis/lessons/lesson-quiz.api';
import { getApiErrorMessage } from '@/lib/api-error';
import { QuizQuestionCard } from './QuizQuestionCard';

interface QuizSectionProps {
  quiz: LessonQuiz | null | undefined;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
}

export function QuizSection({
  quiz,
  isPending,
  isFetching,
  isError,
  error,
  onRetry,
}: QuizSectionProps) {
  return (
    <section
      aria-busy={isFetching}
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-2xs md:p-6"
    >
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 className="text-base font-bold text-slate-900 md:text-lg">
          Quiz Assessment &amp; Question Bank
        </h2>
        <p className="mt-0.5 text-xs font-medium text-slate-500">
          Bài kiểm tra và câu hỏi của bài học.
        </p>
      </div>
      {isPending ? (
        <p role="status" className="py-6 text-center text-xs text-slate-500">
          Đang tải quiz…
        </p>
      ) : isError ? (
        <div
          role="alert"
          className="space-y-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs text-rose-700"
        >
          <p>{getApiErrorMessage(error)}</p>
          <button
            type="button"
            disabled={isFetching}
            onClick={onRetry}
            className="rounded-xl border border-rose-200 bg-white px-3 py-2 font-bold focus-visible:outline-2 focus-visible:outline-sky-500 disabled:opacity-50"
          >
            {isFetching ? 'Đang tải…' : 'Thử lại'}
          </button>
        </div>
      ) : !quiz ? (
        <p role="status" className="py-6 text-center text-xs text-slate-500">
          Bài học chưa có quiz.
        </p>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 md:p-5">
            <h3 className="text-sm font-bold wrap-break-word text-amber-900">{quiz.title}</h3>
            {quiz.description && (
              <p className="mt-2 whitespace-pre-wrap text-xs wrap-break-word text-slate-600">
                {quiz.description}
              </p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Quiz Questions ({quiz.questions.length})
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Câu hỏi trắc nghiệm kiểm tra kiến thức bài học
            </p>
          </div>
          {quiz.questions.length === 0 ? (
            <p role="status" className="py-6 text-center text-xs text-slate-500">
              Quiz chưa có câu hỏi.
            </p>
          ) : (
            <div className="space-y-4">
              {quiz.questions.map((question, index) => (
                <QuizQuestionCard key={question.id} question={question} index={index} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
