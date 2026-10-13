import type { StartedJlptAttempt } from '@/apis/jlpt-exams/jlpt-exams.type';

export interface StoredAttempt {
  attempt: StartedJlptAttempt;
  savedAnswers: Record<number, number>;
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
  try { sessionStorage.setItem(key, JSON.stringify(stored)); } catch { /* Storage may be disabled. */ }
}

export function markAttemptStarting(key: string) {
  try { sessionStorage.setItem(key, JSON.stringify('starting')); } catch { /* Storage may be disabled. */ }
}

export function clearStoredAttempt(key: string) {
  try { sessionStorage.removeItem(key); } catch { /* Storage may be disabled. */ }
}
