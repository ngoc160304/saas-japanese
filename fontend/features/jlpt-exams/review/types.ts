export interface ReviewAnswer {
  answerId: number;
  answerText: string;
}

export interface ReviewQuestion {
  questionId: number;
  questionOrder: number;
  questionText: string;
  passageText: string | null;
  selectedAnswerId: number | null;
  correctAnswerId: number;
  isCorrect: boolean;
  answers: ReviewAnswer[];
  explanation: string;
}

export interface ReviewPart {
  partId: number;
  partName: string;
  partOrder: number;
  questions: ReviewQuestion[];
}

export interface ReviewSession {
  sessionId: number;
  sessionTitle: string;
  sessionOrder: number;
  parts: ReviewPart[];
}

export interface JlptAttemptReview {
  attemptId: number;
  examId: number;
  examTitle: string;
  jlptLevel: string;
  status: 'completed';
  sessions: ReviewSession[];
}

export type ReviewFilter = 'all' | 'incorrect' | 'correct' | 'unanswered';
export type ReviewQuestionStatus = 'correct' | 'incorrect' | 'unanswered';

export interface ReviewQuestionEntry {
  number: number;
  sessionId: number;
  sessionTitle: string;
  partId: number;
  partName: string;
  question: ReviewQuestion;
  status: ReviewQuestionStatus;
}
