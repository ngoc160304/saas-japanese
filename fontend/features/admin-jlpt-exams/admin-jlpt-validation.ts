import type {
  AdminJlptExamDetail,
  AdminJlptValidationIssue,
} from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';
import { adminJlptQuestionUrl } from './admin-jlpt-question';

/** Bracket values in readiness paths are resource IDs, never answer-array indices. */
export function adminJlptIssueDestination(
  exam: AdminJlptExamDetail,
  issue: AdminJlptValidationIssue,
) {
  const root = `/admin/exams/${exam.id}`;
  const ids = issue.resourceIds;
  const session = exam.sessions.find((s) => s.id === ids.sessionId);
  const part = session?.parts.find((p) => p.id === ids.partId);
  const question = part?.questions.find((q) => q.id === ids.questionId);
  const answer = question?.answers.find((a) => a.id === ids.answerId);
  const missing = Boolean(
    (ids.examId !== undefined && ids.examId !== exam.id) ||
    (ids.sessionId !== undefined && !session) ||
    (ids.partId !== undefined && !part) ||
    (ids.questionId !== undefined && !question) ||
    (ids.answerId !== undefined && !answer),
  );
  if (ids.examId !== undefined && ids.examId !== exam.id)
    return { href: `${root}#exam-overview`, label: 'Thông tin đề thi', missing: true };
  if (session && part && question) {
    const field = issue.path.split('.').at(-1);
    const fields: Record<string, string> = {
      questionText: 'question-questionText',
      passageText: 'question-passageText',
      explanation: 'question-explanation',
      points: 'question-points',
      sortOrder: 'question-position',
      imageMediaId: 'question-image',
    };
    const hash = answer
      ? `answer-resource-${answer.id}`
      : (fields[field ?? ''] ?? 'question-answers-title');
    return {
      href: `${adminJlptQuestionUrl({ examId: exam.id, sessionId: session.id, partId: part.id, questionId: question.id })}#${hash}`,
      label: `${session.name} / ${part.name} / Câu #${question.id}${answer ? ` / Đáp án #${answer.id}` : ''}`,
      missing,
    };
  }
  if (part)
    return { href: `${root}#part-${part.id}`, label: `${session?.name} / ${part.name}`, missing };
  if (session) return { href: `${root}#session-${session.id}`, label: session.name, missing };
  return { href: `${root}#exam-overview`, label: 'Thông tin đề thi / cấu trúc', missing };
}
