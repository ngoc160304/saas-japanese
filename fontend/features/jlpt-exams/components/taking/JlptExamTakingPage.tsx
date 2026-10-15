'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { jlptExamsAPI, jlptExamsQueryKeys } from '@/apis/jlpt-exams/jlpt-exams.api';
import type { StartJlptAttemptRequest } from '@/apis/jlpt-exams/jlpt-exams.type';
import { getApiError, getApiErrorMessage } from '@/lib/api-error';
import { selectAuthInitialized, selectCurrentUser } from '@/store/authSlice';
import { useAppSelector } from '@/store/hooks';
import { JlptExamTaking } from './JlptExamTaking';
import { attemptStorageKey, clearStoredAttempt, markAttemptStarting, readStoredAttempt, writeStoredAttempt, restoredAttemptExam, type StoredAttempt } from '../../taking/attempt-storage';

type TakingMode = { examId: number; mode: 'full'; sessionId?: never } |
  { examId: number; mode: 'session'; sessionId: number };

export function JlptExamTakingPage(props: TakingMode) {
  const { examId, mode } = props;
  const initialized = useAppSelector(selectAuthInitialized);
  const user = useAppSelector(selectCurrentUser);
  const router = useRouter();
  const requestLocked = useRef(false);
  const [restored, setRestored] = useState<StoredAttempt | 'starting' | null>(null);
  const [storageChecked, setStorageChecked] = useState(false);
  const storageKey = user ? attemptStorageKey(user.id, examId, mode, mode === 'session' ? props.sessionId : null) : null;
  useEffect(() => {
    if (!storageKey) return;
    const stored = readStoredAttempt(storageKey);
    if (stored) requestLocked.current = true;
    queueMicrotask(() => {
      setRestored(stored);
      setStorageChecked(true);
    });
  }, [storageKey]);
  useEffect(() => {
    if (!restored || restored === 'starting') return;
    let cancelled = false;
    void jlptExamsAPI.getJlptAttemptResult(restored.attempt.attemptId).then((result) => {
      if (!cancelled && result.attemptId === restored.attempt.attemptId && result.status === 'COMPLETED') {
        if (storageKey) clearStoredAttempt(storageKey);
        router.replace(`/student/jlpt_exam_review/${restored.attempt.attemptId}`);
      }
    }).catch(() => { /* A non-completed attempt has no readable result endpoint. */ });
    return () => { cancelled = true; };
  }, [restored, router, storageKey]);
  const query = useQuery({
    queryKey: jlptExamsQueryKeys.structure(examId),
    queryFn: ({ signal }) => jlptExamsAPI.getJlptExamStructure(examId, signal),
    enabled: initialized && Boolean(user),
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: (request: StartJlptAttemptRequest) => jlptExamsAPI.startJlptAttempt(examId, request),
    retry: false,
    onSuccess: (attempt) => {
      if (storageKey) writeStoredAttempt(storageKey, {
        attempt, savedAnswers: {}, ...(query.data?.id === examId ? { exam: query.data } : {}),
      });
    },
  });
  const active = mutation.isSuccess
    ? { attempt: mutation.data, savedAnswers: {}, exam: query.data ?? undefined }
    : restored && restored !== 'starting' ? restored : null;
  const fallback = restoredAttemptExam(
    examId, active, query.data, query.isError ? getApiError(query.error).status : null,
  );
  const exam = query.isSuccess && query.data?.id === examId ? query.data : fallback;
  useEffect(() => {
    // Upgrade legacy in-tab snapshots while the public exam is still readable.
    if (storageKey && restored && restored !== 'starting' && !restored.exam &&
        query.isSuccess && query.data?.id === examId)
      writeStoredAttempt(storageKey, { ...restored, exam: query.data });
  }, [storageKey, restored, query.isSuccess, query.data, examId]);
  const sessionId = mode === 'session' ? props.sessionId : null;
  const requestedSession = exam?.sessions.find((session) => session.id === sessionId);
  const durationMinutes = mode === 'full' ? exam?.totalTimeMinutes : requestedSession?.timeLimitMinutes;

  function startAttempt() {
    if (requestLocked.current || !storageChecked || restored || mutation.isPending || mutation.isSuccess || !initialized || !user || !exam) return;
    if (!Number.isSafeInteger(user.id) || user.id <= 0 || !Number.isFinite(durationMinutes) || (durationMinutes ?? 0) <= 0 || (mode === 'session' && !requestedSession)) return;
    requestLocked.current = true;
    if (storageKey) markAttemptStarting(storageKey);
    mutation.mutate(mode === 'full'
      ? { userId: user.id, mode }
      : { userId: user.id, mode, sessionId: props.sessionId });
  }

  if (!initialized || !user || query.isPending || !storageChecked) {
    return (
      <div role="status" aria-busy="true" className="min-h-dvh bg-[#f8fafc] p-4 sm:p-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <div className="h-16 animate-pulse rounded-2xl bg-white" />
          <div className="h-64 animate-pulse rounded-2xl bg-white" />
          <span className="sr-only">Loading exam and checking your session…</span>
        </div>
      </div>
    );
  }

  if (!exam) {
    const notFound = query.isSuccess || getApiError(query.error).status === 404;
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f8fafc] p-4">
        <section role="alert" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-extrabold text-slate-900">{notFound ? 'Exam unavailable' : 'Could not load exam'}</h1>
          <p className="mt-2 text-sm text-slate-600">{notFound ? 'This exam does not exist or is not available.' : getApiErrorMessage(query.error)}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
            {!notFound && <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{query.isFetching ? 'Retrying…' : 'Retry'}</button>}
            <Link href="/student/jlpt-exams" className="text-sm font-bold text-sky-700 hover:underline">Browse JLPT exams</Link>
          </div>
        </section>
      </main>
    );
  }

  if (mode === 'session' && !requestedSession) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f8fafc] p-4">
        <section role="alert" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-extrabold text-slate-900">Invalid session link</h1>
          <p className="mt-2 text-sm text-slate-600">This session does not belong to the selected exam.</p>
          <Link href={`/student/jlpt-exams/${examId}`} className="mt-5 inline-block text-sm font-bold text-sky-700 hover:underline">Back to exam details</Link>
        </section>
      </main>
    );
  }

  if (active) {
    if (active.attempt.examId !== examId || active.attempt.mode !== mode) {
      return <main role="alert" className="min-h-dvh bg-[#f8fafc] p-8 text-center text-slate-700">The server returned an unexpected attempt. Please return to the exam details.</main>;
    }
    return <JlptExamTaking attempt={active.attempt} exam={exam} initialSavedAnswers={active.savedAnswers} storageKey={storageKey} />;
  }

  if (restored === 'starting' || mutation.isError) return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f8fafc] p-4">
      <section role="alert" className="max-w-xl rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900">Attempt status uncertain</h1>
        <p className="mt-3 text-sm text-slate-600">The start request may have reached the server, but this browser did not receive an attempt ID. Starting again could create a second attempt. Please check your exam history or contact support before beginning another attempt.</p>
        <p className="mt-2 text-sm text-amber-800">{mutation.isError ? getApiErrorMessage(mutation.error) : 'The page was refreshed while the attempt was starting.'}</p>
        <Link href="/student/jlpt-exams" className="mt-5 inline-block text-sm font-bold text-sky-700 hover:underline">Browse JLPT exams</Link>
      </section>
    </main>
  );

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f8fafc] p-4">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <span className="text-xs font-extrabold tracking-widest text-sky-700 uppercase">JLPT {exam.jlptLevel}</span>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">{exam.title}</h1>
        <p className="mt-3 text-sm text-slate-600">{mode === 'full' ? 'Full exam' : requestedSession?.name} · The attempt begins when you press the button below.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <button type="button" onClick={startAttempt} disabled={mutation.isPending || !Number.isSafeInteger(user.id) || user.id <= 0 || !Number.isFinite(durationMinutes) || (durationMinutes ?? 0) <= 0} className="rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white hover:bg-sky-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-wait disabled:opacity-50">
            {mutation.isPending ? 'Starting attempt…' : 'Begin attempt'}
          </button>
          <Link href={`/student/jlpt-exams/${examId}`} className="text-sm font-bold text-slate-600 hover:underline">Back to details</Link>
        </div>
        {mutation.isPending && <p role="status" className="mt-3 text-sm text-slate-500">Creating your exam attempt…</p>}
        {(!Number.isSafeInteger(user.id) || user.id <= 0) && <p role="alert" className="mt-3 text-sm text-red-700">Your account ID is unavailable. Please sign in again.</p>}
        {(!Number.isFinite(durationMinutes) || (durationMinutes ?? 0) <= 0) && <p role="alert" className="mt-3 text-sm text-red-700">This exam has no valid time limit yet. Please choose another exam.</p>}
      </section>
    </main>
  );
}
