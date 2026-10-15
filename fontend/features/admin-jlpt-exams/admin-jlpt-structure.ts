import { z } from 'zod';
import type {
  AdminJlptExamSummary,
  AdminJlptPart,
  AdminJlptPartInput,
  AdminJlptSessionInput,
  AdminJlptSessionType,
} from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';

export const adminJlptSessionLabels: Record<AdminJlptSessionType, string> = {
  language_knowledge: 'Kiến thức ngôn ngữ',
  reading: 'Đọc hiểu',
  listening: 'Nghe hiểu',
};
const name = z.string().max(150, 'Tên tối đa 150 ký tự.').trim().min(1, 'Nhập tên.');
const position = z
  .number({ error: 'Nhập vị trí hợp lệ.' })
  .int('Vị trí phải là số nguyên.')
  .min(1, 'Vị trí bắt đầu từ 1.');
export const adminJlptSessionSchema = z.object({
  kind: z.literal('session'),
  name,
  position,
  sessionType: z.enum(['language_knowledge', 'reading', 'listening'], {
    error: 'Chọn loại phiên thi.',
  }),
  timeLimitMinutes: z
    .number({ error: 'Nhập thời lượng hợp lệ.' })
    .int('Thời lượng phải là số nguyên.')
    .min(1, 'Thời lượng tối thiểu 1 phút.')
    .max(180, 'Thời lượng tối đa 180 phút.'),
});
export const adminJlptPartSchema = z.object({
  kind: z.literal('part'),
  name,
  position,
  instructions: z.string().max(10000, 'Hướng dẫn tối đa 10.000 ký tự.'),
  audioMediaId: z.number().int().positive().safe().nullable().optional(),
});
export const adminJlptStructureSchema = z.discriminatedUnion('kind', [
  adminJlptSessionSchema,
  adminJlptPartSchema,
]);
export type AdminJlptSessionValues = z.infer<typeof adminJlptSessionSchema>;
export type AdminJlptPartValues = z.infer<typeof adminJlptPartSchema>;
export type AdminJlptStructureValues = z.infer<typeof adminJlptStructureSchema>;

export type AdminJlptEditorTarget =
  { kind: 'session'; sessionId?: number } | { kind: 'part'; sessionId: number; partId?: number };
export type AdminJlptStructureTarget =
  | { kind: 'session'; sessionId: number }
  | { kind: 'part'; sessionId: number; partId: number }
  | { kind: 'question'; sessionId: number; partId: number; questionId: number };
export type AdminJlptStructureAction =
  | { kind: 'save-session'; sessionId?: number; values: AdminJlptSessionValues }
  | { kind: 'save-part'; sessionId: number; partId?: number; values: AdminJlptPartValues }
  | { kind: 'delete'; target: AdminJlptStructureTarget }
  | { kind: 'move'; target: AdminJlptStructureTarget; direction: -1 | 1 };

export function adminJlptContentLock(
  exam: Pick<AdminJlptExamSummary, 'status' | 'hasAttempts' | 'contentLocked'>,
): string | null {
  if (exam.status === 'ARCHIVED')
    return 'Đề thi đã lưu trữ. Chỉ được xem; lịch sử làm bài được giữ lại.';
  if (exam.hasAttempts)
    return 'Đề thi đã có lượt làm bài. Nội dung bị khóa kể cả sau khi hủy xuất bản; cần tạo phiên bản đề khác.';
  if (exam.status === 'PUBLISHED') return 'Cần hủy xuất bản đề thi trước khi sửa nội dung.';
  return exam.contentLocked ? 'Máy chủ đã khóa nội dung. Hãy tải lại trạng thái mới nhất.' : null;
}

/** UI positions are one based; all structural API payloads are zero based here. */
export function adminJlptSessionPayload(values: AdminJlptSessionValues): AdminJlptSessionInput {
  return {
    name: values.name.trim(),
    sessionType: values.sessionType,
    timeLimitMinutes: values.timeLimitMinutes,
    sortOrder: values.position - 1,
  };
}
export function adminJlptPartPayload(
  values: AdminJlptPartValues,
  existing?: Pick<AdminJlptPart, 'audio'>,
): AdminJlptPartInput {
  return {
    name: values.name.trim(),
    instructions: values.instructions.trim() || null,
    sortOrder: values.position - 1,
    // PUT omission means detach on this backend. Preserve the current association.
    audioMediaId:
      values.audioMediaId === undefined ? (existing?.audio?.id ?? null) : values.audioMediaId,
  };
}

/** Use the complete unfiltered collection, never a visible/collapsed subset. */
export function adminJlptMoveIds(
  siblings: readonly { id: number }[],
  id: number,
  direction: -1 | 1,
): number[] | null {
  const index = siblings.findIndex((item) => item.id === id);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= siblings.length) return null;
  const ids = siblings.map((item) => item.id);
  [ids[index], ids[next]] = [ids[next], ids[index]];
  return ids;
}
