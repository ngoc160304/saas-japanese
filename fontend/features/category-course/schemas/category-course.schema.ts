import { z } from 'zod';

export const categoryCourseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required')
    .max(200, 'Category name must not exceed 200 characters'),

  description: z
    .string()
    .trim()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional(),

  mediaId: z.number().optional(),
});

export type CategoryCourseFormValues = z.infer<typeof categoryCourseSchema>;
