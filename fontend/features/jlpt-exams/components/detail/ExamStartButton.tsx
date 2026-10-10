'use client';

import Link from 'next/link';
import { ArrowRight, Rocket, Target } from 'lucide-react';
import { toast } from 'sonner';

type ExamStartAction =
  | { examId: string; mode: 'full'; sessionId?: never }
  | { examId: string; mode: 'session'; sessionId: string };

export function ExamStartButton({ action }: { action: ExamStartAction }) {
  const isFull = action.mode === 'full';
  const isAvailable = isFull || action.sessionId === 'session-1';
  const query = new URLSearchParams({ exam_id: action.examId, mode: action.mode });
  if (!isFull) query.set('session_id', action.sessionId);
  const href = `/jlpt-exams/${action.examId}/taking?${query.toString()}`;
  const className = `group flex shrink-0 items-center justify-center gap-2 self-start rounded-2xl bg-sky-600 font-extrabold text-white shadow-sm transition-all hover:bg-sky-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:self-auto ${isFull ? 'px-6 py-3.5 text-sm shadow-lg shadow-sky-500/30' : 'px-5 py-2.5 text-xs'}`;
  const content = <>
    {isFull ? <Rocket aria-hidden="true" className="size-4" /> : <Target aria-hidden="true" className="size-4" />}
    {isFull ? 'Start Full Exam' : 'Practice This Session'}
    <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
  </>;

  if (isAvailable) {
    return <Link href={href} className={className}>{content}</Link>;
  }

  return (
    <button
      type="button"
      onClick={() => toast.info('This session is coming soon')}
      className={className}
    >
      {content}
    </button>
  );
}
