'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { jlptExamsAPI } from '@/apis/jlpt-exams/jlpt-exams.api';
import type { StartedJlptAttempt } from '@/apis/jlpt-exams/jlpt-exams.type';
import { getApiErrorMessage } from '@/lib/api-error';
import { clearStoredAttempt, writeStoredAttempt } from './attempt-storage';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAttemptProgress(attempt: StartedJlptAttempt, totalTimeMinutes: number, initialSavedAnswers: Record<number, number>, storageKey: string | null) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<number, number>>(initialSavedAnswers);
  const [statuses, setStatuses] = useState<Record<number, SaveStatus>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const desired = useRef<Record<number, number>>({ ...initialSavedAnswers });
  const saved = useRef<Record<number, number>>({ ...initialSavedAnswers });
  const workers = useRef(new Map<number, Promise<void>>());
  const submitLocked = useRef(false);
  const expiryTriggered = useRef(false);
  const deadline = Date.parse(attempt.startedAt) + Math.max(0, totalTimeMinutes) * 60_000;
  const remainingSeconds = Number.isFinite(deadline) ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0;

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', tick); };
  }, []);

  function saveQuestion(questionId: number, attemptSessionId: number): Promise<void> {
    const existing = workers.current.get(questionId);
    if (existing) {
      void existing.then(() => {
        if (!workers.current.has(questionId) && desired.current[questionId] !== saved.current[questionId]) {
          void saveQuestion(questionId, attemptSessionId);
        }
      });
      return existing;
    }
    const worker = (async () => {
      while (desired.current[questionId] !== saved.current[questionId]) {
        const answerId = desired.current[questionId];
        setStatuses((current) => ({ ...current, [questionId]: 'saving' }));
        try {
          const response = await jlptExamsAPI.saveJlptAnswer(attempt.attemptId, attemptSessionId, { questionId, answerId });
          if (response.questionId !== questionId || response.answerId !== answerId || response.attemptSessionId !== attemptSessionId) throw new Error('Unexpected saved answer');
          saved.current = { ...saved.current, [questionId]: answerId };
          if (storageKey) writeStoredAttempt(storageKey, { attempt, savedAnswers: saved.current });
        } catch {
          setStatuses((current) => ({ ...current, [questionId]: 'error' }));
          return;
        }
      }
      setStatuses((current) => ({ ...current, [questionId]: 'saved' }));
    })();
    workers.current.set(questionId, worker);
    void worker.finally(() => { if (workers.current.get(questionId) === worker) workers.current.delete(questionId); });
    return worker;
  }

  function selectAnswer(questionId: number, answerId: number, attemptSessionId: number) {
    if (submitLocked.current || remainingSeconds === 0) return;
    desired.current = { ...desired.current, [questionId]: answerId };
    setAnswers({ ...desired.current });
    void saveQuestion(questionId, attemptSessionId);
  }

  function retryAnswer(questionId: number, attemptSessionId: number) {
    if (!submitLocked.current) void saveQuestion(questionId, attemptSessionId);
  }

  async function submit() {
    if (submitLocked.current) return;
    submitLocked.current = true;
    setSubmitting(true);
    setSubmitError(null);
    let confirmed = false;
    try {
      while (workers.current.size > 0) {
        await Promise.all([...workers.current.values()]);
      }
      const unsaved = Object.keys(desired.current).filter((id) => desired.current[Number(id)] !== saved.current[Number(id)]);
      if (unsaved.length > 0) {
        setSubmitError(`${unsaved.length} selected answer${unsaved.length === 1 ? '' : 's'} could not be saved. Retry each failed answer, then submit again.`);
        return;
      }
      const result = await jlptExamsAPI.submitJlptAttempt(attempt.attemptId);
      if (result.attemptId !== attempt.attemptId || result.status !== 'COMPLETED') throw new Error('Submission was not confirmed.');
      confirmed = true;
      if (storageKey) clearStoredAttempt(storageKey);
      void queryClient.invalidateQueries({ queryKey: ['jlpt-exams', 'attempts', 'history'] });
      router.replace(`/student/jlpt_exam_review/${attempt.attemptId}`);
    } catch (error) {
      try {
        const result = await jlptExamsAPI.getJlptAttemptResult(attempt.attemptId);
        if (result.attemptId === attempt.attemptId && result.status === 'COMPLETED') {
          confirmed = true;
          if (storageKey) clearStoredAttempt(storageKey);
          void queryClient.invalidateQueries({ queryKey: ['jlpt-exams', 'attempts', 'history'] });
          router.replace(`/student/jlpt_exam_review/${attempt.attemptId}`);
          return;
        }
      } catch { /* The result endpoint rejects attempts still in progress. */ }
      setSubmitError(`Submission was not confirmed. ${getApiErrorMessage(error)} Retry submission for this same attempt.`);
    } finally {
      if (!confirmed) {
        submitLocked.current = false;
        setSubmitting(false);
      }
    }
  }

  useEffect(() => {
    if (remainingSeconds === 0 && !expiryTriggered.current) {
      expiryTriggered.current = true;
      void submit();
    }
  });

  return { answers, statuses, selectAnswer, retryAnswer, submit, submitting, submitError, remainingSeconds };
}
