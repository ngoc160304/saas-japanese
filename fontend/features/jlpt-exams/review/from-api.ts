import type { JlptAttemptReview as ApiReview } from '@/apis/jlpt-exams/jlpt-exams.type';
import type { JlptAttemptReview } from './types';

export function toReviewView(review: ApiReview): JlptAttemptReview {
  return {
    attemptId: review.attemptId,
    examId: review.examId,
    examTitle: review.examTitle,
    jlptLevel: review.jlptLevel,
    status: 'completed',
    sessions: review.sessions.map((session) => ({
      sessionId: session.sessionId,
      sessionTitle: session.sessionName,
      sessionOrder: session.sessionOrder,
      parts: session.parts.map((part) => ({
        partId: part.partId,
        partName: part.partName,
        partOrder: part.partOrder,
        questions: part.questions.map((question) => ({
          questionId: question.questionId,
          questionOrder: question.questionOrder,
          questionText: question.questionText,
          passageText: question.passageText,
          selectedAnswerId: question.selectedAnswerId,
          correctAnswerId: question.correctAnswerId,
          isCorrect: question.isCorrect === true,
          answers: question.answers,
          explanation: question.explanation ?? '',
        })),
      })),
    })),
  };
}
