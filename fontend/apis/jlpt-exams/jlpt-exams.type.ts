import type { ApiResponse } from '@/types/api';
import type { PageResponse } from '@/types/pagination';

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface JlptExamSummary {
  id: number;
  title: string;
  description: string;
  jlptLevel: JlptLevel;
  totalTimeMinutes: number;
  isPublished: boolean;
}

export interface JlptExamsQuery {
  page: number;
  size: number;
  search?: string;
  jlptLevel?: JlptLevel;
  sortKey: 'id';
  sortType: 'DESC';
}

export type GetJlptExamsResponse = ApiResponse<PageResponse<JlptExamSummary>>;

export type JlptExamOverview = JlptExamSummary;

export type GetJlptExamResponse = ApiResponse<JlptExamOverview | null>;

export interface JlptExamPart {
  id: number;
  name: string;
  instructions: string;
  sortOrder: number;
  questionCount: number;
  audioMediaId: number | null;
}

export interface JlptExamSession {
  id: number;
  name: string;
  sessionType: 'language_knowledge' | 'reading' | 'listening';
  sortOrder: number;
  timeLimitMinutes: number;
  questionCount: number;
  parts: JlptExamPart[];
}

export interface JlptExamStructure extends JlptExamSummary {
  sessions: JlptExamSession[];
}

export type GetJlptExamStructureResponse = ApiResponse<JlptExamStructure | null>;

export type StartJlptAttemptRequest =
  | { userId: number; mode: 'full' }
  | { userId: number; mode: 'session'; sessionId: number };

export interface JlptAttemptAnswer {
  answerId: number;
  answerText: string;
}

export interface JlptAttemptQuestion {
  questionId: number;
  questionOrder: number;
  questionText: string;
  answers: JlptAttemptAnswer[];
}

export interface JlptAttemptPart {
  attemptPartId: number;
  partId: number;
  partName: string;
  partOrder: number;
  questions: JlptAttemptQuestion[];
}

export interface JlptAttemptSession {
  attemptSessionId: number;
  sessionId: number;
  sessionTitle: string;
  sessionOrder: number;
  parts: JlptAttemptPart[];
}

export interface StartedJlptAttempt {
  attemptId: number;
  examId: number;
  examTitle: string;
  mode: 'full' | 'session';
  startedAt: string;
  sessions: JlptAttemptSession[];
}

export type StartJlptAttemptResponse = ApiResponse<StartedJlptAttempt>;
