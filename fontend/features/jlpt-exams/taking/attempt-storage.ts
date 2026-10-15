import type { JlptExamStructure, StartedJlptAttempt } from '@/apis/jlpt-exams/jlpt-exams.type';

export interface StoredAttempt {
  attempt: StartedJlptAttempt;
  savedAnswers: Record<number, number>;
  /** Public metadata captured while starting; never an admin exam/solution object. */
  exam?: JlptExamStructure;
}

export function attemptStorageKey(userId: number, examId: number, mode: string, sessionId: number | null) {
  return `jlpt-attempt:v1:${userId}:${examId}:${mode}:${sessionId ?? 'all'}`;
}

export function readStoredAttempt(key: string): StoredAttempt | 'starting' | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (value === 'starting') return value;
    if (!value || typeof value !== 'object' || !('attempt' in value) || !('savedAnswers' in value)) return null;
    const stored = value as StoredAttempt;
    if (!Number.isSafeInteger(stored.attempt?.attemptId) || !Array.isArray(stored.attempt?.sessions) ||
        !stored.savedAnswers || typeof stored.savedAnswers !== 'object') return null;
    return stored;
  } catch { return null; }
}

export function writeStoredAttempt(key: string, stored: StoredAttempt) {
  try {
    const previous = stored.exam ? null : readStoredAttempt(key);
    const exam = stored.exam ?? (previous && previous !== 'starting' &&
      previous.attempt.attemptId === stored.attempt.attemptId ? previous.exam : undefined);
    sessionStorage.setItem(key, JSON.stringify({ ...stored, ...(exam ? { exam } : {}) }));
  } catch { /* Storage may be disabled. */ }
}

/** A public catalog 404 must not hide a still-owned active attempt. 401/403 never fall back. */
export function restoredAttemptExam(
  examId: number,
  active: StoredAttempt | null,
  cached: JlptExamStructure | null | undefined,
  status: number | null,
) {
  if (status !== 404 || active?.attempt.examId !== examId) return null;
  const exam = active.exam ?? cached;
  return exam?.id === examId && Array.isArray(exam.sessions) ? exam : null;
}

export function markAttemptStarting(key: string) {
  try { sessionStorage.setItem(key, JSON.stringify('starting')); } catch { /* Storage may be disabled. */ }
}

export function clearStoredAttempt(key: string) {
  try { sessionStorage.removeItem(key); } catch { /* Storage may be disabled. */ }
}
