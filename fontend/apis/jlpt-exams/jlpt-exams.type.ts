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

export interface SaveJlptAnswerRequest { questionId: number; answerId: number }
export interface SavedJlptAnswer extends SaveJlptAnswerRequest {
  attemptAnswerId: number;
  attemptId: number;
  attemptSessionId: number;
  answeredAt: string;
}
export type SaveJlptAnswerResponse = ApiResponse<SavedJlptAnswer>;

export interface SubmittedJlptAttempt {
  attemptId: number;
  status: 'COMPLETED';
  totalScore: number;
  maxScore: number;
  correctCount: number;
  totalQuestions: number;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
}
export type SubmitJlptAttemptResponse = ApiResponse<SubmittedJlptAttempt>;

export interface JlptReviewAnswer { answerId: number; answerText: string }
export interface JlptReviewQuestion {
  questionId: number;
  questionOrder: number;
  questionText: string;
  passageText: string | null;
  selectedAnswerId: number | null;
  correctAnswerId: number;
  isCorrect: boolean | null;
  answers: JlptReviewAnswer[];
  explanation: string | null;
}
export interface JlptReviewPart {
  attemptPartId: number;
  partId: number;
  partName: string;
  partOrder: number;
  questions: JlptReviewQuestion[];
}
export interface JlptReviewSession {
  attemptSessionId: number;
  sessionId: number;
  sessionName: string;
  sessionType: JlptExamSession['sessionType'];
  sessionOrder: number;
  parts: JlptReviewPart[];
}
export interface JlptAttemptReview {
  attemptId: number;
  examId: number;
  examTitle: string;
  jlptLevel: JlptLevel;
  status: 'COMPLETED';
  sessions: JlptReviewSession[];
}
export type GetJlptAttemptReviewResponse = ApiResponse<JlptAttemptReview>;

export interface JlptAttemptResult {
  attemptId: number;
  examId: number;
  examTitle: string;
  jlptLevel: JlptLevel;
  status: JlptAttemptHistoryEntry['status'];
  mode: 'full' | 'session';
  totalScore: number;
  maxScore: number;
  overallPassScore?: number | null;
  correctCount: number;
  totalQuestions: number;
  isPassed?: boolean | null;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  scoringSections: JlptResultScoringSection[];
  sessions: JlptResultSession[];
}
export type GetJlptAttemptResultResponse = ApiResponse<JlptAttemptResult>;

export interface JlptResultScoringSection {
  name: string;
  score: number;
  maxScore: number;
  minimumPassScore: number;
  correctCount: number;
  totalQuestions: number;
  isPassed: boolean;
}

export interface JlptResultPart {
  attemptPartId: number;
  partId: number;
  partName: string;
  score: number;
  maxScore: number;
  correctCount: number;
  totalQuestions: number;
}

export interface JlptResultSession {
  attemptSessionId: number;
  sessionId: number;
  sessionName: string;
  sessionType: JlptExamSession['sessionType'];
  status: JlptAttemptHistoryEntry['status'];
  score: number;
  maxScore: number;
  correctCount: number;
  totalQuestions: number;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  parts: JlptResultPart[];
}

export interface JlptAttemptHistoryEntry {
  attemptId: number;
  examId: number;
  examTitle: string;
  jlptLevel: JlptLevel;
  mode: 'full' | 'session';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  totalScore: number;
  maxScore: number;
  correctCount: number;
  totalQuestions: number;
  isPassed?: boolean | null;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  sessionId?: number | null;
  sessionName?: string | null;
}

export interface JlptAttemptHistoryQuery { page: number; size: number }
export type GetJlptAttemptHistoryResponse = ApiResponse<PageResponse<JlptAttemptHistoryEntry>>;
