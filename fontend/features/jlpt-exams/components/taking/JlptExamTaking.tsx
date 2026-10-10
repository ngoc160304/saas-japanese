'use client';

import { useState } from 'react';
import type { JlptExamStructure } from '@/apis/jlpt-exams/jlpt-exams.type';
import { ExamSessionHeader } from './ExamSessionHeader';
import { ExamNavigationSidebar } from './ExamNavigationSidebar';

export function JlptExamTaking({ exam }: { exam: JlptExamStructure }) {
  const sessions = [...exam.sessions].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(sessions[0]?.id ?? null);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? sessions[0];
  const parts = selectedSession ? [...selectedSession.parts].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id) : [];
  const totalQuestions = sessions.reduce((count, session) => count + session.questionCount, 0);

  return (
    <div className="flex h-dvh min-h-[400px] flex-col overflow-hidden bg-[#f8fafc] text-slate-900 antialiased">
      <ExamSessionHeader examId={exam.id} title={exam.title} level={exam.jlptLevel} totalTimeMinutes={exam.totalTimeMinutes} navigationOpen={navigationOpen} onToggleNavigation={() => setNavigationOpen((open) => !open)} />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <ExamNavigationSidebar sessions={sessions} selectedSessionId={selectedSession?.id ?? null} isOpen={navigationOpen} onSelectSession={(sessionId) => { setSelectedSessionId(sessionId); setNavigationOpen(false); }} />
        <main aria-label="Exam structure" className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-[#f8fafc] px-4 py-6 pb-20 sm:px-6 md:p-8 md:pb-32">
          <div className="mx-auto max-w-4xl space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-extrabold text-sky-700">JLPT {exam.jlptLevel}</span>
                {!exam.isPublished && <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">Unpublished</span>}
              </div>
              <h2 className="mt-3 text-xl font-extrabold text-slate-900 sm:text-2xl">{exam.title}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{exam.description}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold text-slate-700">
                <span className="rounded-xl bg-slate-50 px-3 py-2">{exam.totalTimeMinutes} minutes total</span>
                <span className="rounded-xl bg-slate-50 px-3 py-2">{totalQuestions} questions</span>
                <span className="rounded-xl bg-slate-50 px-3 py-2">{sessions.length} sessions</span>
              </div>
            </section>
            <section role="note" className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-900">
              This is an exam structure preview. Question loading will be integrated in the next phase. No attempt has started.
            </section>
            {selectedSession ? (
              <section aria-label={`${selectedSession.name} parts`} className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold tracking-widest text-sky-700 uppercase">Session</p>
                    <h2 className="mt-1 text-lg font-extrabold text-slate-900">{selectedSession.name}</h2>
                  </div>
                  <p className="text-sm font-semibold text-slate-600">{selectedSession.timeLimitMinutes} min · {selectedSession.questionCount} questions</p>
                </div>
                {parts.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">No parts are available for this session.</div>
                ) : parts.map((part) => (
                  <article key={part.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-base font-extrabold text-slate-900">{part.name}</h3>
                      <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">{part.questionCount} questions</span>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{part.instructions}</p>
                    {selectedSession.sessionType === 'listening' && part.audioMediaId === null && (
                      <p className="mt-3 text-sm font-medium text-amber-700">Audio is not available.</p>
                    )}
                  </article>
                ))}
              </section>
            ) : (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">No sessions are available for this exam.</section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
