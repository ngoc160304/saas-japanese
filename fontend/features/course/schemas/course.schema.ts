import { z } from 'zod';

export const courseSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tên khóa học.').max(200, 'Tên tối đa 200 ký tự.'),
  categoryId: z.number().int().positive('Vui lòng chọn danh mục.'),
  description: z.string().trim().min(1, 'Vui lòng nhập mô tả.'),
  price: z.number().finite('Vui lòng nhập giá hợp lệ.').min(0, 'Giá không được âm.'),
  published: z.boolean(),
  thumbnailId: z.number().int().positive().nullable(),
});

export type CourseFormValues = z.infer<typeof courseSchema>;
