'use client';

import { useEffect, useRef, useState } from 'react';
import type { JlptExamStructure, StartedJlptAttempt } from '@/apis/jlpt-exams/jlpt-exams.type';
import { buildAttemptView } from '../../taking/attempt-view';
import { useAttemptProgress } from '../../taking/use-attempt-progress';
import { AttemptNavigationSidebar } from './AttemptNavigationSidebar';
import { AttemptQuestionCard } from './AttemptQuestionCard';
import { ExamConfirmDialog } from './ExamConfirmDialog';
import { ExamSessionHeader } from './ExamSessionHeader';

export function JlptExamTaking({ attempt, exam, initialSavedAnswers, storageKey }: { attempt: StartedJlptAttempt; exam: JlptExamStructure; initialSavedAnswers: Record<number, number>; storageKey: string | null }) {
  const sessions = buildAttemptView(attempt, exam);
  const audioElements = useRef(new Map<number, HTMLAudioElement>());
  const activeAudio = useRef<HTMLAudioElement | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id ?? 0);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(sessions[0]?.parts[0]?.questions[0]?.question.questionId ?? null);
  const [flaggedIds, setFlaggedIds] = useState<ReadonlySet<number>>(new Set());
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [audioErrors, setAudioErrors] = useState<ReadonlySet<number>>(new Set());
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? sessions[0];
  const timeLimitMinutes = attempt.mode === 'session' ? selectedSession?.timeLimitMinutes ?? exam.totalTimeMinutes : exam.totalTimeMinutes;
  const { answers, statuses, selectAnswer, retryAnswer, submit, submitting, submitError, remainingSeconds } = useAttemptProgress(attempt, timeLimitMinutes, initialSavedAnswers, storageKey);
  const allQuestions = sessions.flatMap((session) => session.parts.flatMap((part) => part.questions));
  const answeredCount = allQuestions.filter(({ question }) => answers[question.questionId] !== undefined).length;

  useEffect(() => () => {
    activeAudio.current?.pause();
    activeAudio.current = null;
  }, []);

  function stopActiveAudio() {
    activeAudio.current?.pause();
    activeAudio.current = null;
  }

  function selectValidAnswer(questionId: number, answerId: number) {
    const session = sessions.find((item) => item.parts.some((part) => part.questions.some(({ question }) => question.questionId === questionId && question.answers.some((answer) => answer.answerId === answerId))));
    if (!session) return;
    selectAnswer(questionId, answerId, session.attemptSessionId);
    setCurrentQuestionId(questionId);
  }

  function retryQuestion(questionId: number) {
    const session = sessions.find((item) => item.parts.some((part) => part.questions.some(({ question }) => question.questionId === questionId)));
    if (session) retryAnswer(questionId, session.attemptSessionId);
  }

  function selectSession(sessionId: number) {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session) return;
    stopActiveAudio();
    setSelectedSessionId(sessionId);
    setCurrentQuestionId(session.parts[0]?.questions[0]?.question.questionId ?? null);
    setNavigationOpen(false);
    document.getElementById('exam-questions')?.scrollTo({ top: 0 });
  }

  function selectQuestion(sessionId: number, questionId: number) {
    const session = sessions.find((item) => item.id === sessionId);
    if (!session?.parts.some((part) => part.questions.some((item) => item.question.questionId === questionId))) return;
    if (selectedSessionId !== sessionId) stopActiveAudio();
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

  function retryAudio(partId: number) {
    const audio = audioElements.current.get(partId);
    if (!audio) return;
    setAudioErrors((current) => {
      const next = new Set(current);
      next.delete(partId);
      return next;
    });
    audio.load();
  }

  function handleAudioPlay(audio: HTMLAudioElement) {
    if (activeAudio.current && activeAudio.current !== audio) activeAudio.current.pause();
    activeAudio.current = audio;
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
      <ExamSessionHeader examId={exam.id} attemptId={attempt.attemptId} title={attempt.examTitle} level={exam.jlptLevel} totalTimeMinutes={timeLimitMinutes} remainingSeconds={remainingSeconds} onSubmit={() => setConfirmOpen(true)} submitting={submitting} navigationOpen={navigationOpen} onToggleNavigation={() => setNavigationOpen((open) => !open)} />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <AttemptNavigationSidebar sessions={sessions} selectedSessionId={selectedSession?.id ?? 0} currentQuestionId={currentQuestionId} answers={answers} flaggedIds={flaggedIds} isOpen={navigationOpen} onSelectSession={selectSession} onSelectQuestion={selectQuestion} onSubmit={() => setConfirmOpen(true)} submitting={submitting} />
        <main id="exam-questions" aria-label="Exam questions" className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-[#f8fafc] px-4 py-6 pb-20 sm:px-6 md:p-8 md:pb-32">
          <div className="mx-auto max-w-3xl space-y-8">
            {submitError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{submitError}<button type="button" onClick={() => void submit()} disabled={submitting} className="ml-3 font-bold text-sky-700 underline disabled:opacity-50">Retry submission</button></div>}
            {submitting && <p role="status" className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">Saving pending answers and submitting this attempt…</p>}
            {remainingSeconds === 0 && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Time is up. This attempt must be submitted. If the network failed, use the retry action above.</p>}
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
                      {selectedSession.sessionType === 'listening' && part.audioUrl && (
                        <div className="mt-4">
                          <audio
                            ref={(audio) => {
                              if (audio) audioElements.current.set(part.id, audio);
                              else audioElements.current.delete(part.id);
                            }}
                            aria-label={`Audio for ${part.name}`}
                            controls
                            preload="none"
                            src={part.audioUrl}
                            onPlay={(event) => handleAudioPlay(event.currentTarget)}
                            onPause={(event) => {
                              if (activeAudio.current === event.currentTarget) activeAudio.current = null;
                            }}
                            onEnded={(event) => {
                              if (activeAudio.current === event.currentTarget) activeAudio.current = null;
                            }}
                            onError={() => setAudioErrors((current) => new Set(current).add(part.id))}
                            className="w-full"
                          />
                          {audioErrors.has(part.id) && (
                            <div role="alert" className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-red-700">
                              <span>Audio could not be loaded. Check your connection and try again.</span>
                              <button type="button" onClick={() => retryAudio(part.id)} className="font-bold text-sky-700 underline focus-visible:outline-2 focus-visible:outline-sky-500">Retry audio</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {part.questions.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No questions are available for this part.</p>}
                    {part.questions.map((item) => (
                      <AttemptQuestionCard key={item.question.questionId} item={item} selectedAnswerId={answers[item.question.questionId]} saveStatus={statuses[item.question.questionId] ?? (initialSavedAnswers[item.question.questionId] !== undefined ? 'saved' : 'idle')} disabled={submitting || remainingSeconds === 0} retryDisabled={submitting} onRetry={retryQuestion} flagged={flaggedIds.has(item.question.questionId)} onFocusQuestion={setCurrentQuestionId} onSelectAnswer={selectValidAnswer} onToggleFlag={toggleFlag} />
                    ))}
                  </section>
                ))}
              </section>
            ) : <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No sessions are available for this attempt.</p>}
          </div>
        </main>
      </div>
      <ExamConfirmDialog kind={confirmOpen ? 'submit' : null} answeredCount={answeredCount} totalCount={allQuestions.length} onOpenChange={setConfirmOpen} onConfirm={() => { setConfirmOpen(false); void submit(); }} />
    </div>
  );
}
