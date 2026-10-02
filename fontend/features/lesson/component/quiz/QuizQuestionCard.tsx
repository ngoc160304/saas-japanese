import type { LessonQuizQuestion } from '@/apis/lessons/lesson-quiz.api';

export function QuizQuestionCard({
  question,
  index,
}: {
  question: LessonQuizQuestion;
  index: number;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs md:p-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-extrabold text-slate-900">Question {index + 1}</h4>
        <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-700">
          {question.questionType === 'SINGLE_CHOICE' ? 'Single Choice' : question.questionType}
        </span>
      </div>
      <p className="mb-3 whitespace-pre-wrap text-xs font-semibold wrap-break-word text-slate-800">
        {question.questionText}
      </p>
      {question.options.length === 0 ? (
        <p className="text-xs text-slate-500">Chưa có lựa chọn cho câu hỏi này.</p>
      ) : (
        <ol className="space-y-1.5 pl-2">
          {question.options.map((option, optionIndex) => (
            <li key={option.id} className="flex items-start gap-2 text-xs text-slate-600">
              <span
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 rounded-full bg-slate-200 text-center text-[10px]"
              >
                •
              </span>
              <span className="whitespace-pre-wrap wrap-break-word">
                {optionIndex < 26 ? String.fromCharCode(65 + optionIndex) : optionIndex + 1}.{' '}
                {option.optionText}
              </span>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
