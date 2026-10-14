import type { JlptAttemptResult } from '@/apis/jlpt-exams/jlpt-exams.type';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));
}

function hasCounts(value: Record<string, unknown>): boolean {
  return isNumber(value.score) && isNumber(value.maxScore)
    && isNumber(value.correctCount) && isNumber(value.totalQuestions);
}

function isPart(value: unknown): boolean {
  return isRecord(value) && isId(value.attemptPartId) && isId(value.partId)
    && typeof value.partName === 'string' && hasCounts(value);
}

function isSession(value: unknown): boolean {
  return isRecord(value) && isId(value.attemptSessionId) && isId(value.sessionId)
    && typeof value.sessionName === 'string'
    && ['language_knowledge', 'reading', 'listening'].includes(String(value.sessionType))
    && ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'].includes(String(value.status))
    && hasCounts(value) && isTimestamp(value.startedAt) && isTimestamp(value.finishedAt)
    && isNumber(value.durationSeconds) && Array.isArray(value.parts) && value.parts.every(isPart);
}

function isScoringSection(value: unknown): boolean {
  return isRecord(value) && typeof value.name === 'string' && hasCounts(value)
    && isNumber(value.minimumPassScore) && typeof value.isPassed === 'boolean';
}

export function isRenderableJlptResult(value: unknown, attemptId: number): value is JlptAttemptResult {
  if (!isRecord(value)) return false;
  return value.attemptId === attemptId && isId(value.examId)
    && typeof value.examTitle === 'string' && value.examTitle.length > 0
    && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(String(value.jlptLevel))
    && value.status === 'COMPLETED' && ['full', 'session'].includes(String(value.mode))
    && isNumber(value.totalScore) && isNumber(value.maxScore)
    && isNumber(value.correctCount) && isNumber(value.totalQuestions)
    && (value.overallPassScore === null || value.overallPassScore === undefined || isNumber(value.overallPassScore))
    && (value.isPassed === null || value.isPassed === undefined || typeof value.isPassed === 'boolean')
    && isTimestamp(value.startedAt) && isTimestamp(value.finishedAt)
    && isNumber(value.durationSeconds)
    && Array.isArray(value.scoringSections) && value.scoringSections.every(isScoringSection)
    && Array.isArray(value.sessions) && value.sessions.every(isSession);
}
