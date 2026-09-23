import { z } from 'zod';

export const lessonSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tên bài học.').max(200, 'Tối đa 200 ký tự.'),
  durationMinutes: z
    .number()
    .int('Nhập số phút nguyên.')
    .min(0, 'Thời lượng không được âm.')
    .max(2147483647, 'Thời lượng quá lớn.')
    .nullable(),
  isPublished: z.boolean(),
  grammar: z.string(),
});

export type LessonFormValues = z.infer<typeof lessonSchema>;
