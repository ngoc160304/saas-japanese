import type {
  JlptAttemptQuestion,
  JlptExamStructure,
  StartedJlptAttempt,
} from '@/apis/jlpt-exams/jlpt-exams.type';

export interface NumberedQuestion {
  number: number;
  question: JlptAttemptQuestion;
}

export interface AttemptViewPart {
  id: number;
  name: string;
  instructions: string | null;
  questions: NumberedQuestion[];
}

export interface AttemptViewSession {
  id: number;
  attemptSessionId: number;
  title: string;
  timeLimitMinutes: number | null;
  parts: AttemptViewPart[];
}

export function buildAttemptView(attempt: StartedJlptAttempt, exam: JlptExamStructure): AttemptViewSession[] {
  let questionNumber = 0;
  return attempt.sessions.map((session) => {
    const detailSession = exam.sessions.find((item) => item.id === session.sessionId);
    return {
      id: session.sessionId,
      attemptSessionId: session.attemptSessionId,
      title: session.sessionTitle,
      timeLimitMinutes: detailSession?.timeLimitMinutes ?? null,
      parts: session.parts.map((part) => ({
        id: part.partId,
        name: part.partName,
        instructions: detailSession?.parts.find((item) => item.id === part.partId)?.instructions ?? null,
        questions: part.questions.map((question) => ({ number: ++questionNumber, question })),
      })),
    };
  });
}
