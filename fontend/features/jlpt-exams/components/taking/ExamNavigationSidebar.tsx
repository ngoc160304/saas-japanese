import type { ExamAnswerOption, ExamTakingMock } from '../../taking/types';
import { QuestionNavigationGroup } from './QuestionNavigationGroup';

interface ExamNavigationSidebarProps {
  exam: ExamTakingMock;
  answers: Record<string, ExamAnswerOption['id']>;
  flaggedIds: ReadonlySet<string>;
  currentQuestionId: string;
  isOpen: boolean;
  submitted: boolean;
  onQuestionClick: (questionId: string) => void;
  onSubmit: () => void;
}

export function ExamNavigationSidebar({ exam, answers, flaggedIds, currentQuestionId, isOpen, submitted, onQuestionClick, onSubmit }: ExamNavigationSidebarProps) {
  return (
    <aside id="exam-navigation" aria-label="Question navigation" className={`${isOpen ? 'flex' : 'hidden'} max-h-[48dvh] w-full shrink-0 flex-col border-b border-slate-200 bg-white shadow-sm md:flex md:max-h-none md:w-80 md:border-r md:border-b-0`}>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
        {exam.sections.map((section, index) => (
          <div key={section.id}>
            <div className={`mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-2 text-sm font-extrabold ${section.status === 'active' ? 'text-sky-600' : 'text-slate-500 opacity-60'}`}>
              <span>{section.navigationTitle ?? section.title}</span>
              <span className="shrink-0 rounded-md bg-slate-50 px-2 py-1 font-mono text-xs text-slate-400">{section.durationMinutes}min</span>
            </div>
            {section.status === 'active' && section.groups.map((group) => (
              <QuestionNavigationGroup key={group.id} group={group} answers={answers} flaggedIds={flaggedIds} currentQuestionId={currentQuestionId} onQuestionClick={onQuestionClick} />
            ))}
            {index < exam.sections.length - 1 && (
              <div className={`flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 ${index > 0 ? 'opacity-60' : ''}`}>
                <span className="text-sm font-bold text-slate-500">Break ☕</span>
                <span className="font-mono text-xs text-slate-400">{exam.breakMinutes}min</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 bg-white p-4 shadow-sm">
        <button type="button" disabled={submitted} onClick={onSubmit} className="w-full rounded-xl border-2 border-slate-200 bg-white py-3 text-center text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-50">
          {submitted ? 'Section Submitted' : 'Submit Section'}
        </button>
      </div>
    </aside>
  );
}
