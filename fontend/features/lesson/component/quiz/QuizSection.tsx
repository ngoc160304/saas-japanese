'use client';
import { useEffect } from 'react';
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import { getQuizError } from '@/apis/lessons/admin-quiz.api';
import { Button } from '@/components/ui/button';
import { useAdminLessonQuiz } from '../../hooks/useAdminLessonQuiz';
import { QuizMetadataDialog } from './QuizMetadataDialog';
import { QuizQuestionDialog } from './QuizQuestionDialog';
import { QuizActionDialog } from './QuizActionDialog';

export function QuizSection({
  lessonId,
  active,
  onCountChange,
  onBusyChange,
}: {
  lessonId: number;
  active: boolean;
  onCountChange: (count: number | null) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const state = useAdminLessonQuiz(lessonId, active);
  const { query, dialog, pending, unavailable } = state;
  const quiz = query.data;
  const blocked = pending || !!dialog;
  useEffect(() => {
    onCountChange(query.isSuccess ? (quiz?.questions.length ?? 0) : null);
  }, [onCountChange, query.isSuccess, quiz]);
  useEffect(() => {
    onBusyChange(blocked);
    return () => onBusyChange(false);
  }, [blocked, onBusyChange]);
  const error = query.isError ? getQuizError(query.error) : null;
  const reorderDisabled =
    blocked || quiz?.questions.some((question) => !question.authoringSupported);
  return (
    <section
      aria-labelledby="quiz-heading"
      className="space-y-5 rounded-3xl border border-slate-100 bg-white p-5 text-slate-900 shadow-soft md:p-6"
    >
      <div className="border-b border-slate-100 pb-4">
        <h2 id="quiz-heading" className="text-lg font-bold">
          Quiz — Bài kiểm tra
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Soạn câu hỏi và xuất bản Quiz riêng cho bài học.
        </p>
      </div>
      {error ? (
        <div role="alert" className="space-y-3 text-sm text-rose-700">
          <p>{error.status === 403 ? 'Bạn không có quyền quản lý Quiz.' : error.message}</p>
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Thử lại
          </Button>
        </div>
      ) : query.isPending ? (
        <p role="status">Đang tải Quiz…</p>
      ) : !quiz ? (
        <div className="space-y-3 py-8 text-center">
          <p>Bài học chưa có Quiz.</p>
          <Button
            disabled={blocked}
            onClick={() => state.open({ kind: 'metadata', quiz: null })}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Tạo Quiz
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold break-words">{quiz.title}</h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${quiz.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}
              >
                {quiz.isPublished ? 'Quiz đã xuất bản' : 'Quiz bản nháp'}
              </span>
            </div>
            <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
              {quiz.description || 'Chưa có mô tả.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={blocked}
                onClick={() => state.open({ kind: 'metadata', quiz })}
              >
                Sửa thông tin Quiz
              </Button>
              <Button
                variant="outline"
                disabled={blocked}
                onClick={() => state.open({ kind: 'publication', quiz })}
              >
                {quiz.isPublished ? 'Ẩn Quiz' : 'Xuất bản Quiz'}
              </Button>
              <Button
                variant="outline"
                disabled={blocked}
                onClick={() => state.open({ kind: 'deleteQuiz', quiz })}
                className="text-rose-700 hover:bg-rose-50"
              >
                Xóa Quiz
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold">Câu hỏi ({quiz.questions.length})</h3>
            <Button
              disabled={blocked}
              onClick={() => state.open({ kind: 'question', quiz })}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Thêm câu hỏi
            </Button>
          </div>
          {!quiz.questions.length && (
            <p className="py-5 text-center text-sm text-slate-600">
              Chưa có câu hỏi. Thêm câu hỏi trước khi xuất bản Quiz.
            </p>
          )}
          {quiz.questions.map((question, index) => (
            <article
              key={question.id}
              className="space-y-3 rounded-2xl border border-slate-200 p-4"
              aria-label={`Câu hỏi ${index + 1}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold">Câu hỏi {index + 1}</h4>
                <div className="flex gap-1">
                  <Button
                    size="icon-sm"
                    variant="outline"
                    aria-label={`Di chuyển câu hỏi ${index + 1} lên`}
                    disabled={reorderDisabled || index === 0}
                    onClick={() => void state.move(question.id, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    aria-label={`Di chuyển câu hỏi ${index + 1} xuống`}
                    disabled={reorderDisabled || index === quiz.questions.length - 1}
                    onClick={() => void state.move(question.id, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    aria-label={`Sửa câu hỏi ${index + 1}`}
                    disabled={blocked || !question.authoringSupported}
                    onClick={() => state.open({ kind: 'question', quiz, question })}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    aria-label={`Xóa câu hỏi ${index + 1}`}
                    disabled={blocked || !question.authoringSupported}
                    onClick={() => state.open({ kind: 'deleteQuestion', quiz, question })}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              {!question.authoringSupported && (
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                  Câu hỏi nhiều đáp án hiện chỉ được xem. Chưa thể chỉnh sửa hoặc xuất bản Quiz có
                  loại câu hỏi này.
                </p>
              )}
              <p className="whitespace-pre-wrap break-words text-sm">{question.questionText}</p>
              <ol className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <li
                    key={option.id}
                    className={`whitespace-pre-wrap break-words text-sm ${option.isCorrect ? 'font-semibold text-emerald-700' : 'text-slate-600'}`}
                  >
                    {optionIndex + 1}. {option.optionText}
                    {option.isCorrect && <span className="ml-2 text-xs">(Đáp án đúng)</span>}
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </>
      )}
      {pending && (
        <p role="status" className="text-sm text-slate-600">
          Đang cập nhật Quiz…
        </p>
      )}
      {state.error && !dialog && (
        <p role="alert" className="text-sm text-rose-700">
          {state.error}
        </p>
      )}
      {dialog?.kind === 'metadata' && (
        <QuizMetadataDialog
          key={`metadata-${dialog.quiz?.id ?? 'new'}-${dialog.revision}`}
          quiz={dialog.quiz}
          pending={pending}
          unavailable={unavailable}
          onClose={state.close}
          onSubmit={state.submitMetadata}
        />
      )}
      {dialog?.kind === 'question' && (
        <QuizQuestionDialog
          key={`question-${dialog.question?.id ?? 'new'}-${dialog.revision}`}
          question={dialog.question}
          pending={pending}
          unavailable={unavailable}
          onClose={state.close}
          onSubmit={state.submitQuestion}
        />
      )}
      {dialog && dialog.kind !== 'metadata' && dialog.kind !== 'question' && (
        <QuizActionDialog
          target={dialog}
          pending={pending}
          unavailable={unavailable}
          error={state.error}
          onClose={state.close}
          onConfirm={state.confirm}
        />
      )}
    </section>
  );
}
