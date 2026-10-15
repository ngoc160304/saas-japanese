import { z } from 'zod';
import type {
  AdminJlptExamDetail,
  AdminJlptPartPath,
  AdminJlptQuestion,
  CreateAdminJlptQuestionWithAnswersInput,
  UpdateAdminJlptQuestionWithAnswersInput,
} from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';

export type AdminJlptQuestionTarget = AdminJlptPartPath & { questionId?: number };

// The server sanitizes HTML and then checks visible text. This catches empty markup
// early; it does not replace the authoritative sanitizer or render submitted HTML.
export function adminJlptHasVisibleText(value: string) {
  return (
    value
      .replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&(?:nbsp|#160|#xa0);/gi, ' ')
      .trim().length > 0
  );
}
const requiredText = (maximum: number, label: string) =>
  z
    .string()
    .max(maximum, `${label} tối đa ${maximum.toLocaleString('vi-VN')} ký tự.`)
    .refine(adminJlptHasVisibleText, `${label} phải có nội dung hiển thị.`);

export const adminJlptQuestionSchema = z
  .object({
    questionText: requiredText(20000, 'Câu hỏi'),
    passageText: z.string().max(50000, 'Đoạn văn tối đa 50.000 ký tự.'),
    explanation: z.string().max(20000, 'Giải thích tối đa 20.000 ký tự.'),
    points: z
      .number({ error: 'Nhập điểm hợp lệ.' })
      .min(0.01, 'Điểm tối thiểu 0,01.')
      .max(999.99, 'Điểm tối đa 999,99.')
      .refine((n) => Number(n.toFixed(2)) === n, 'Điểm có tối đa 2 chữ số thập phân.'),
    position: z
      .number({ error: 'Nhập vị trí hợp lệ.' })
      .int('Vị trí phải là số nguyên.')
      .min(1, 'Vị trí bắt đầu từ 1.'),
    answers: z
      .array(
        z.object({
          // RHF's generated field.id is a separate client key, never an API answer ID.
          answerId: z.number().int().positive().safe().optional(),
          answerText: requiredText(500, 'Đáp án'),
          isCorrect: z.boolean(),
        }),
      )
      .min(2, 'Cần ít nhất hai đáp án.'),
  })
  .superRefine((values, context) => {
    if (values.answers.filter((a) => a.isCorrect).length !== 1)
      context.addIssue({
        code: 'custom',
        path: ['answers', 'root'],
        message: 'Chọn đúng một đáp án đúng.',
      });
    const seen = new Set<number>();
    values.answers.forEach((answer, index) => {
      if (answer.answerId !== undefined) {
        if (seen.has(answer.answerId))
          context.addIssue({
            code: 'custom',
            path: ['answers', index, 'answerText'],
            message: 'ID đáp án bị trùng. Hãy tải lại câu hỏi.',
          });
        seen.add(answer.answerId);
      }
    });
  });
export type AdminJlptQuestionValues = z.infer<typeof adminJlptQuestionSchema>;

export function adminJlptQuestionValues(
  question?: AdminJlptQuestion,
  questionCount = 0,
): AdminJlptQuestionValues {
  return {
    questionText: question?.questionText ?? '',
    passageText: question?.passageText ?? '',
    explanation: question?.explanation ?? '',
    points: question?.points ?? 1,
    position: question ? question.sortOrder + 1 : questionCount + 1,
    answers: question
      ? question.answers.map((a) => ({
          answerId: a.id,
          answerText: a.answerText,
          isCorrect: a.isCorrect,
        }))
      : [
          { answerText: '', isCorrect: false },
          { answerText: '', isCorrect: false },
        ],
  };
}

export function adminJlptQuestionContext(
  exam: AdminJlptExamDetail,
  target: AdminJlptQuestionTarget,
) {
  if (exam.id !== target.examId) return null;
  const session = exam.sessions.find((s) => s.id === target.sessionId);
  const part = session?.parts.find((p) => p.id === target.partId);
  if (!session || !part) return null;
  const question = part.questions.find((q) => q.id === target.questionId);
  if (target.questionId !== undefined && !question) return null;
  return { session, part, question };
}

function questionFields(values: AdminJlptQuestionValues, imageMediaId: number | null) {
  return {
    questionText: values.questionText,
    passageText: values.passageText || null,
    explanation: values.explanation || null,
    questionType: 'single_choice' as const,
    points: values.points,
    sortOrder: values.position - 1,
    imageMediaId,
  };
}
export function adminJlptCreateQuestionPayload(
  values: AdminJlptQuestionValues,
): CreateAdminJlptQuestionWithAnswersInput {
  if (values.answers.some((a) => a.answerId !== undefined))
    throw { status: 400, message: 'Câu hỏi mới không được chứa ID đáp án cũ.', fieldErrors: {} };
  return {
    ...questionFields(values, null),
    answers: values.answers.map((a, index) => ({
      answerText: a.answerText,
      isCorrect: a.isCorrect,
      sortOrder: index,
    })),
  };
}
export function adminJlptUpdateQuestionPayload(
  values: AdminJlptQuestionValues,
  existing: AdminJlptQuestion,
): UpdateAdminJlptQuestionWithAnswersInput {
  const ids = values.answers.flatMap((a) => (a.answerId === undefined ? [] : [a.answerId]));
  if (
    new Set(ids).size !== ids.length ||
    ids.some((id) => !existing.answers.some((a) => a.id === id))
  )
    throw {
      status: 409,
      message:
        'ID đáp án đã thay đổi hoặc không thuộc câu hỏi này. Kiểm tra lại dữ liệu trước khi lưu.',
      fieldErrors: {},
    };
  return {
    // PUT omission/null detaches an image: carry the latest association explicitly.
    ...questionFields(values, existing.image?.id ?? null),
    answers: values.answers.map((a, index) => ({
      ...(a.answerId === undefined ? {} : { id: a.answerId }),
      answerText: a.answerText,
      isCorrect: a.isCorrect,
      sortOrder: index,
    })),
  };
}

export function adminJlptQuestionUrl(target: AdminJlptQuestionTarget) {
  return `/admin/exams/${target.examId}/sessions/${target.sessionId}/parts/${target.partId}/questions/${target.questionId ?? 'new'}`;
}
export function adminJlptBuilderUrl(target: AdminJlptPartPath) {
  return `/admin/exams/${target.examId}#part-${target.partId}`;
}
export function adminJlptNextQuestion(
  part: { questions: AdminJlptQuestion[] },
  questionId: number,
) {
  const ordered = [...part.questions].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const index = ordered.findIndex((q) => q.id === questionId);
  if (index < 0) throw new Error('Câu hỏi vừa lưu chưa có trong cấu trúc mới nhất.');
  return ordered[index + 1];
}

/** Bean Validation uses array indices here (unlike publish-validation resource-ID paths). */
export function adminJlptQuestionErrorPath(
  field: string,
  answerCount: number,
):
  | 'questionText'
  | 'passageText'
  | 'explanation'
  | 'points'
  | 'position'
  | 'answers'
  | `answers.${number}.answerText`
  | `answers.${number}.isCorrect`
  | null {
  if (field === 'sortOrder') return 'position';
  if (field === 'answers') return 'answers';
  if (
    field === 'questionText' ||
    field === 'passageText' ||
    field === 'explanation' ||
    field === 'points'
  )
    return field;
  const match = /^answers\[(\d+)\]\.(answerText|isCorrect|id|sortOrder)$/.exec(field);
  if (!match || Number(match[1]) >= answerCount) return null;
  return match[2] === 'isCorrect'
    ? `answers.${Number(match[1])}.isCorrect`
    : `answers.${Number(match[1])}.answerText`;
}
