import type { PageResponse } from '@/types/pagination';

export type AdminJlptLevel = 'N1' | 'N2' | 'N3' | 'N4' | 'N5';
export type AdminJlptExamStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AdminJlptSessionType = 'language_knowledge' | 'reading' | 'listening';
export type AdminJlptSortKey =
  'id' | 'title' | 'level' | 'totalTimeMinutes' | 'status' | 'createdAt' | 'updatedAt';

export interface AdminJlptExamStatsQuery {
  search?: string;
  level?: AdminJlptLevel;
}

export interface AdminJlptExamQuery extends AdminJlptExamStatsQuery {
  page?: number;
  size?: number;
  status?: AdminJlptExamStatus;
  sortKey?: AdminJlptSortKey;
  sortType?: 'ASC' | 'DESC';
}

export interface AdminJlptExamSummary {
  id: number;
  level: AdminJlptLevel;
  title: string;
  description: string | null;
  totalTimeMinutes: number;
  status: AdminJlptExamStatus;
  hasAttempts: boolean;
  contentLocked: boolean;
  sessionCount: number;
  partCount: number;
  questionCount: number;
  passingScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminJlptMedia {
  id: number;
  originalName: string;
  secureUrl: string;
  fileType: 'IMAGE' | 'AUDIO' | 'VIDEO';
}

export interface AdminJlptAnswer {
  id: number;
  answerText: string;
  isCorrect: boolean;
  sortOrder: number;
}

export interface AdminJlptQuestion {
  id: number;
  questionText: string;
  passageText: string | null;
  questionType: 'single_choice';
  explanation: string | null;
  points: number;
  sortOrder: number;
  image: AdminJlptMedia | null;
  answers: AdminJlptAnswer[];
}

export interface AdminJlptPart {
  id: number;
  name: string;
  instructions: string | null;
  sortOrder: number;
  audio: AdminJlptMedia | null;
  questions: AdminJlptQuestion[];
}

export interface AdminJlptSession {
  id: number;
  name: string;
  sessionType: AdminJlptSessionType;
  timeLimitMinutes: number;
  sortOrder: number;
  parts: AdminJlptPart[];
}

export interface AdminJlptExamDetail extends AdminJlptExamSummary {
  sessions: AdminJlptSession[];
}

export type AdminJlptExamPage = PageResponse<AdminJlptExamSummary>;

export interface AdminJlptExamStats {
  totalExams: number;
  draftExams: number;
  publishedExams: number;
  archivedExams: number;
}

export interface AdminJlptValidationIssue {
  code: string;
  message: string;
  path: string;
  category: 'CONTENT' | 'LIFECYCLE';
  resourceIds: Partial<
    Record<'examId' | 'sessionId' | 'partId' | 'questionId' | 'answerId' | 'mediaId', number>
  >;
}

export interface AdminJlptExamValidation {
  examId: number;
  status: AdminJlptExamStatus;
  contentValid: boolean;
  canPublish: boolean;
  hasAttempts: boolean;
  contentLocked: boolean;
  totalTimeMinutes: number;
  issues: AdminJlptValidationIssue[];
}

export interface AdminJlptExamErrorResponse {
  status: number;
  message: string;
  fieldErrors: Record<string, string>;
  timestamp: string;
  issues?: AdminJlptValidationIssue[];
}

export interface AdminJlptExamInput {
  level: AdminJlptLevel;
  title: string;
  description?: string | null;
}

export interface AdminJlptSessionInput {
  name: string;
  sessionType: AdminJlptSessionType;
  timeLimitMinutes: number;
  sortOrder: number;
}

export interface AdminJlptPartInput {
  name: string;
  instructions?: string | null;
  sortOrder?: number;
  audioMediaId?: number | null;
}

export interface AdminJlptQuestionInput {
  questionText: string;
  passageText?: string | null;
  questionType: 'single_choice';
  explanation?: string | null;
  points: number;
  sortOrder: number;
  imageMediaId?: number | null;
}

export interface AdminJlptAnswerInput {
  answerText: string;
  isCorrect: boolean;
  sortOrder: number;
}

export interface NewAdminJlptAnswerInput {
  id?: null;
  answerText: string;
  isCorrect: boolean;
  sortOrder?: number | null;
}

export interface ExistingAdminJlptAnswerInput extends Omit<NewAdminJlptAnswerInput, 'id'> {
  id: number;
}

export interface CreateAdminJlptQuestionWithAnswersInput extends AdminJlptQuestionInput {
  answers: NewAdminJlptAnswerInput[];
}

export interface UpdateAdminJlptQuestionWithAnswersInput extends AdminJlptQuestionInput {
  answers: (NewAdminJlptAnswerInput | ExistingAdminJlptAnswerInput)[];
}

/** Complete current sibling set, exactly once; array index becomes sortOrder. */
export interface AdminJlptReorderInput {
  ids: number[];
}
export interface AdminJlptSortOrderInput {
  sortOrder: number;
}
export interface AdminJlptExamPath {
  examId: number;
}
export interface AdminJlptSessionPath extends AdminJlptExamPath {
  sessionId: number;
}
export interface AdminJlptPartPath extends AdminJlptSessionPath {
  partId: number;
}
export interface AdminJlptQuestionPath extends AdminJlptPartPath {
  questionId: number;
}
export interface AdminJlptAnswerPath extends AdminJlptQuestionPath {
  answerId: number;
}
export type AdminJlptWrite<Path, Data> = Path & { data: Data };
