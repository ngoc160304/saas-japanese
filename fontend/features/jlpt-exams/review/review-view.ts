import type { JlptAttemptReview, ReviewFilter, ReviewQuestion, ReviewQuestionEntry, ReviewQuestionStatus } from './types';

export function getQuestionStatus(question: ReviewQuestion): ReviewQuestionStatus {
  if (question.selectedAnswerId === null) return 'unanswered';
  return question.isCorrect ? 'correct' : 'incorrect';
}

export function getReviewQuestions(review: JlptAttemptReview): ReviewQuestionEntry[] {
  const entries: ReviewQuestionEntry[] = [];
  for (const session of review.sessions) {
    for (const part of session.parts) {
      for (const question of part.questions) {
        entries.push({
          number: entries.length + 1,
          sessionId: session.sessionId,
          sessionTitle: session.sessionTitle,
          partId: part.partId,
          partName: part.partName,
          question,
          status: getQuestionStatus(question),
        });
      }
    }
  }
  return entries;
}

export function filterReviewQuestions(questions: ReviewQuestionEntry[], filter: ReviewFilter): ReviewQuestionEntry[] {
  if (filter === 'all') return questions;
  if (filter === 'correct') return questions.filter((entry) => entry.status === 'correct');
  return questions.filter((entry) => entry.status === filter);
}
