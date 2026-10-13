'use client';

import { useState } from 'react';
import type { JlptExamStructure, StartedJlptAttempt } from '@/apis/jlpt-exams/jlpt-exams.type';
import { buildAttemptView } from '../../taking/attempt-view';
import { AttemptNavigationSidebar } from './AttemptNavigationSidebar';
import { AttemptQuestionCard } from './AttemptQuestionCard';
import { ExamSessionHeader } from './ExamSessionHeader';

export function JlptExamTaking({ attempt, exam }: { attempt: StartedJlptAttempt; exam: JlptExamStructure }) {
  const sessions = buildAttemptView(attempt, exam);
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id ?? 0);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(sessions[0]?.parts[0]?.questions[0]?.question.questionId ?? null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flaggedIds, setFlaggedIds] = useState<ReadonlySet<number>>(new Set());
  const [navigationOpen, setNavigationOpen] = useState(false);
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? sessions[0];

  function selectSession(sessionId: number) {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) return;
    setSelectedSessionId(sessionId);
    setCurrentQuestionId(session.parts[0]?.questions[0]?.question.questionId ?? null);
    setNavigationOpen(false);
    document.getElementById('exam-questions')?.scrollTo({ top: 0 });
  }

  function selectQuestion(sessionId: number, questionId: number) {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session?.parts.some((part) => part.questions.some((item) => item.question.questionId === questionId))) return;
    setSelectedSessionId(sessionId);
    setCurrentQuestionId(questionId);
    setNavigationOpen(false);
    requestAnimationFrame(() => {
      const panel = document.getElementById('exam-questions');
      const question = document.getElementById(`question-${questionId}`);
      if (!panel || !question) return;
      const questionTop = question.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop;
      const maxScrollTop = Math.max(0, panel.scrollHeight - panel.clientHeight);
      panel.scrollTo({ top: Math.min(Math.max(0, questionTop), maxScrollTop), behavior: 'smooth' });
    });
  }

  function toggleFlag(questionId: number) {
    setFlaggedIds((current) => {
      const next = new Set(current);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#f8fafc] text-slate-900 antialiased">
      <ExamSessionHeader examId={exam.id} attemptId={attempt.attemptId} title={attempt.examTitle} level={exam.jlptLevel} totalTimeMinutes={attempt.mode === 'session' ? selectedSession?.timeLimitMinutes ?? exam.totalTimeMinutes : exam.totalTimeMinutes} navigationOpen={navigationOpen} onToggleNavigation={() => setNavigationOpen((open) => !open)} />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <AttemptNavigationSidebar sessions={sessions} selectedSessionId={selectedSession?.id ?? 0} currentQuestionId={currentQuestionId} answers={answers} flaggedIds={flaggedIds} isOpen={navigationOpen} onSelectSession={selectSession} onSelectQuestion={selectQuestion} />
        <main id="exam-questions" aria-label="Exam questions" className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-[#f8fafc] px-4 py-6 pb-20 sm:px-6 md:p-8 md:pb-32">
          <div className="mx-auto max-w-3xl space-y-8">
            {selectedSession ? (
              <section aria-label={selectedSession.title} className="space-y-8">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <h2 className="text-2xl font-extrabold text-slate-900">{selectedSession.title}</h2>
                  {selectedSession.timeLimitMinutes !== null && <span className="text-sm font-semibold text-slate-600">{selectedSession.timeLimitMinutes} min</span>}
                </div>
                {selectedSession.parts.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No parts are available for this session.</p>}
                {selectedSession.parts.map((part) => (
                  <section key={part.id} aria-label={part.name} className="space-y-8">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="font-bold text-slate-800">{part.name}</h3>
                      {part.instructions?.trim() && <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-600">{part.instructions}</p>}
                    </div>
                    {part.questions.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No questions are available for this part.</p>}
                    {part.questions.map((item) => (
                      <AttemptQuestionCard key={item.question.questionId} item={item} selectedAnswerId={answers[item.question.questionId]} flagged={flaggedIds.has(item.question.questionId)} onFocusQuestion={setCurrentQuestionId} onSelectAnswer={(questionId, answerId) => { setAnswers((current) => ({ ...current, [questionId]: answerId })); setCurrentQuestionId(questionId); }} onToggleFlag={toggleFlag} />
                    ))}
                  </section>
                ))}
              </section>
            ) : <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No sessions are available for this attempt.</p>}
            <p className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">Answers and flags are stored on this page only. Saving and submission are not available yet.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
