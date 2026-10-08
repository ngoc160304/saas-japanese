import type { ExamAnswerOption as AnswerOption } from '../../taking/types';

interface ExamAnswerOptionProps {
  questionId: string;
  option: AnswerOption;
  selected: boolean;
  disabled: boolean;
  onSelect?: () => void;
}

export function ExamAnswerOption({ questionId, option, selected, disabled, onSelect }: ExamAnswerOptionProps) {
  return (
    <label className={`flex cursor-pointer items-center rounded-xl border px-4 py-3 transition-colors ${selected ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white hover:border-sky-400 hover:bg-sky-50'} ${disabled ? 'cursor-default opacity-75' : ''}`}>
      <input type="radio" name={questionId} value={option.id} checked={selected} disabled={disabled} onChange={onSelect} className="mr-3 size-4 accent-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500" />
      <span className="font-medium text-slate-700">{option.id}. {option.text}</span>
    </label>
  );
}
