import type { ExamAnswerOption, ExamTakingMock } from '../../taking/types';
import { ExamInstructionCard } from './ExamInstructionCard';
import { ExamQuestionCard } from './ExamQuestionCard';

interface ExamQuestionContentProps {
  exam: ExamTakingMock;
  answers: Record<string, ExamAnswerOption['id']>;
  flaggedIds: ReadonlySet<string>;
  submitted: boolean;
  onSelectAnswer: (questionId: string, answerId: ExamAnswerOption['id']) => void;
  onToggleFlag: (questionId: string) => void;
}

export function ExamQuestionContent({ exam, answers, flaggedIds, submitted, onSelectAnswer, onToggleFlag }: ExamQuestionContentProps) {
  const [activeSection, grammarSection, listeningSection] = exam.sections;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section aria-labelledby="active-section-title" className="space-y-8">
        <h2 id="active-section-title" className="text-2xl font-extrabold text-slate-900">{activeSection.title}</h2>
        {activeSection.groups.map((group) => (
          <div key={group.id} className="space-y-8">
            <ExamInstructionCard label={group.label} instructions={group.instructions} />
            {group.questions.map((question) => (
              <ExamQuestionCard key={question.id} question={question} selectedAnswer={answers[question.id]} flagged={flaggedIds.has(question.id)} disabled={submitted} onSelectAnswer={onSelectAnswer} onToggleFlag={onToggleFlag} />
            ))}
          </div>
        ))}
      </section>
      <section aria-labelledby="grammar-section-title" className="space-y-8 border-t border-slate-200 pt-8">
        <div>
          <h2 id="grammar-section-title" className="mb-1 text-2xl font-extrabold text-slate-900">{grammarSection.title}</h2>
          <p className="text-xs font-medium text-slate-500">Upcoming section preview</p>
        </div>
        <ExamInstructionCard label="もんだい 1" instructions={['（　　　）に なにを いれますか。', '1・2・3・4 から いちばん いいものを ひとつ えらんで ください。']} />
        {grammarSection.previewQuestion && <ExamQuestionCard question={grammarSection.previewQuestion} flagged={false} disabled preview />}
      </section>
      <section aria-labelledby="listening-section-title" className="border-t border-slate-200 pt-8 pb-4">
        <h2 id="listening-section-title" className="text-2xl font-extrabold text-slate-900">{listeningSection.title}</h2>
        <p className="mt-1 text-xs font-medium text-slate-500">Listening section follows the second break.</p>
      </section>
    </div>
  );
}
