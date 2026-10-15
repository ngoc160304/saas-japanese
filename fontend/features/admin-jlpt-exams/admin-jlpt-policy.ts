import type { AdminJlptExamSummary } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';

type ExamState = Pick<AdminJlptExamSummary, 'status' | 'hasAttempts' | 'contentLocked'>;

/** Content/metadata writers share requireEditableExam; lifecycle writers only require active. */
export function adminJlptEditLock(
  exam: ExamState,
  subject: 'nội dung' | 'metadata',
): string | null {
  if (exam.status === 'ARCHIVED')
    return 'Đề thi đã lưu trữ. Chỉ được xem; lịch sử làm bài được giữ lại.';
  if (exam.hasAttempts)
    return `Đề thi đã có lượt làm bài. ${subject === 'metadata' ? 'Metadata' : 'Nội dung'} bị khóa kể cả sau khi hủy xuất bản.`;
  if (exam.status === 'PUBLISHED') return `Cần hủy xuất bản đề thi trước khi sửa ${subject}.`;
  return exam.contentLocked ? 'Máy chủ đã khóa nội dung. Hãy tải lại trạng thái mới nhất.' : null;
}

export type AdminJlptLifecycleAction = 'publish' | 'unpublish' | 'archive';
export const adminJlptLifecycleLabels: Record<AdminJlptLifecycleAction, string> = {
  publish: 'Xuất bản',
  unpublish: 'Hủy xuất bản',
  archive: 'Lưu trữ',
};
export function adminJlptCanTransition(
  exam: Pick<ExamState, 'status'>,
  action: AdminJlptLifecycleAction,
) {
  if (exam.status === 'ARCHIVED') return false;
  return (
    action === 'archive' ||
    (action === 'publish' ? exam.status === 'DRAFT' : exam.status === 'PUBLISHED')
  );
}
