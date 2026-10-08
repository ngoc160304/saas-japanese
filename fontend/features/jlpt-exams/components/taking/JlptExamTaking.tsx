'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ExamAnswerOption, ExamTakingMock } from '../../taking/types';
import { ExamSessionHeader } from './ExamSessionHeader';
import { ExamNavigationSidebar } from './ExamNavigationSidebar';
import { ExamQuestionContent } from './ExamQuestionContent';
import { ExamConfirmDialog } from './ExamConfirmDialog';

type AnswerId = ExamAnswerOption['id'];

export function JlptExamTaking({ exam }: { exam: ExamTakingMock }) {
  const router = useRouter();
  const activeSection = exam.sections[0];
  const questions = activeSection.groups.flatMap((group) => group.questions);
  const [answers, setAnswers] = useState<Record<string, AnswerId>>({
    'question-1': 2, 'question-2': 3, 'question-3': 1,
  });
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(() => new Set(['question-5', 'question-8']));
  const [currentQuestionId, setCurrentQuestionId] = useState(questions[0].id);
  const [remainingSeconds, setRemainingSeconds] = useState(activeSection.durationMinutes * 60);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<'exit' | 'submit' | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted || remainingSeconds === 0) return;
    const timer = window.setTimeout(() => setRemainingSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [remainingSeconds, submitted]);

  useEffect(() => {
    if (!navigationOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavigationOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [navigationOpen]);

  const answeredCount = questions.filter((question) => answers[question.id] !== undefined).length;
  const goToQuestion = (questionId: string) => {
    setCurrentQuestionId(questionId);
    setNavigationOpen(false);
    document.getElementById(questionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const selectAnswer = (questionId: string, answerId: AnswerId) => {
    setAnswers((current) => ({ ...current, [questionId]: answerId }));
    setCurrentQuestionId(questionId);
  };
  const toggleFlag = (questionId: string) => {
    setFlaggedIds((current) => {
      const next = new Set(current);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };
  const confirm = () => {
    setConfirmation(null);
    if (confirmation === 'exit') {
      router.push(`/student/jlpt-exams/${exam.id}`);
      return;
    }
    setSubmitted(true);
    toast.success('Section submitted locally', {
      description: `${answeredCount} answered · ${questions.length - answeredCount} unanswered`,
    });
  };

  return (
    <div className="flex h-dvh min-h-[400px] flex-col overflow-hidden bg-[#f8fafc] text-slate-900 antialiased">
      <ExamSessionHeader title={exam.title} remainingSeconds={remainingSeconds} navigationOpen={navigationOpen} onToggleNavigation={() => setNavigationOpen((open) => !open)} onExit={() => setConfirmation('exit')} />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <ExamNavigationSidebar exam={exam} answers={answers} flaggedIds={flaggedIds} currentQuestionId={currentQuestionId} isOpen={navigationOpen} submitted={submitted} onQuestionClick={goToQuestion} onSubmit={() => setConfirmation('submit')} />
        <main aria-label="Exam questions" className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-[#f8fafc] px-4 py-6 pb-20 sm:px-6 md:p-8 md:pb-32">
          <ExamQuestionContent exam={exam} answers={answers} flaggedIds={flaggedIds} submitted={submitted} onSelectAnswer={selectAnswer} onToggleFlag={toggleFlag} />
        </main>
      </div>
      <ExamConfirmDialog kind={confirmation} answeredCount={answeredCount} totalCount={questions.length} onOpenChange={(open) => { if (!open) setConfirmation(null); }} onConfirm={confirm} />
    </div>
  );
}
