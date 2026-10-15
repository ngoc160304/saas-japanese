import { z } from 'zod';
import type {
  AdminJlptExamInput,
  AdminJlptExamSummary,
} from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';

export const adminJlptLevels = ['N1', 'N2', 'N3', 'N4', 'N5'] as const;
export const adminJlptMetadataSchema = z.object({
  title: z.string().max(200, 'Tiêu đề tối đa 200 ký tự.').trim().min(1, 'Nhập tiêu đề đề thi.'),
  level: z.enum(adminJlptLevels, { error: 'Chọn cấp độ JLPT hợp lệ.' }),
  description: z.string().max(500, 'Mô tả tối đa 500 ký tự.'),
});
export type AdminJlptMetadataValues = z.infer<typeof adminJlptMetadataSchema>;

export function adminJlptMetadataPayload(values: AdminJlptMetadataValues): AdminJlptExamInput {
  return {
    title: values.title.trim(),
    level: values.level,
    description: values.description.trim() || null,
  };
}

/** PUT checks the whole exam; the backend does not allow field-level exceptions. */
export function adminJlptMetadataLock(
  exam: Pick<AdminJlptExamSummary, 'status' | 'hasAttempts' | 'contentLocked'>,
): string | null {
  if (exam.status === 'ARCHIVED')
    return 'Đề thi đã lưu trữ, chỉ được xem và giữ lại lịch sử làm bài.';
  if (exam.hasAttempts)
    return 'Đề thi đã có lượt làm bài. Metadata bị khóa kể cả sau khi hủy xuất bản.';
  if (exam.status === 'PUBLISHED') return 'Cần hủy xuất bản đề thi trước khi sửa metadata.';
  if (exam.contentLocked)
    return 'Backend đã khóa nội dung đề thi. Vui lòng tải lại trạng thái mới nhất.';
  return null;
}
