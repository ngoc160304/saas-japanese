import { z } from 'zod';

export const quizMetadataSchema = z.object({
  title: z.string().trim().min(1, 'Nhập tên Quiz.').max(200, 'Tên Quiz tối đa 200 ký tự.'),
  description: z.string().trim().max(500, 'Mô tả tối đa 500 ký tự.'),
});
export const quizQuestionSchema = z.object({
  questionText: z
    .string()
    .trim()
    .min(1, 'Nhập nội dung câu hỏi.')
    .refine(
      (value) => new TextEncoder().encode(value).length <= 65535,
      'Câu hỏi quá dài. Vui lòng rút ngắn nội dung.',
    ),
  options: z
    .array(
      z.object({
        persistedId: z.number().int().positive().nullable(),
        optionText: z
          .string()
          .trim()
          .min(1, 'Nhập nội dung lựa chọn.')
          .max(500, 'Tối đa 500 ký tự.'),
        isCorrect: z.boolean(),
      }),
    )
    .min(2, 'Cần ít nhất hai lựa chọn.')
    .refine(
      (options) => options.filter((option) => option.isCorrect).length === 1,
      'Chọn đúng một đáp án đúng.',
    ),
});
export type QuizMetadataValues = z.infer<typeof quizMetadataSchema>;
export type QuizQuestionValues = z.infer<typeof quizQuestionSchema>;

export function questionInput(values: QuizQuestionValues) {
  return {
    questionText: values.questionText,
    questionType: 'SINGLE_CHOICE' as const,
    options: values.options.map((option) => ({
      ...(option.persistedId === null ? {} : { id: option.persistedId }),
      optionText: option.optionText,
      isCorrect: option.isCorrect,
    })),
  };
}
