import type { StudyQuizQuestion } from '@/apis/lessons/lesson-content.api';

function optionLabel(index: number) {
  let value = index + 1;
  let label = '';
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return label;
}

interface QuizQuestionCardProps {
  question: StudyQuizQuestion;
  number: number;
}

export function QuizQuestionCard({ question, number }: QuizQuestionCardProps) {
  const options = [...question.options].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <article
      aria-labelledby={`quiz-question-${question.id}`}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs md:p-5"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h4 id={`quiz-question-${question.id}`} className="text-xs font-extrabold text-slate-900">
          Question {number}
        </h4>
        <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-700">
          {question.questionType}
        </span>
      </div>
      <p className="mb-3 whitespace-pre-wrap break-words text-xs font-semibold text-slate-800">
        {question.questionText.trim() || 'Chưa có nội dung câu hỏi.'}
      </p>
      {options.length === 0 ? (
        <p className="pl-2 text-xs text-slate-500">Câu hỏi chưa có lựa chọn.</p>
      ) : (
        <ul className="space-y-1.5 pl-2">
          {options.map((option, index) => (
            <li key={option.id} className="flex items-start gap-2 text-xs text-slate-600">
              <span
                className="flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600"
                aria-hidden="true"
              >
                {optionLabel(index)}
              </span>
              <span className="break-words">
                <span className="sr-only">Lựa chọn {optionLabel(index)}: </span>
                {option.optionText.trim() || 'Chưa có nội dung lựa chọn.'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
