'use client';

import { useState, type RefObject } from 'react';
import type { AdminJlptExamDetail } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getAdminJlptError } from '../admin-jlpt-error';
import type { AdminJlptStructureAction, AdminJlptStructureTarget } from '../admin-jlpt-structure';
import { AdminJlptSafeText } from './AdminJlptSafeText';

export function AdminJlptStructureDeleteDialog({
  exam,
  target,
  disabled,
  pending,
  run,
  onClose,
  finalFocus,
}: {
  exam: AdminJlptExamDetail;
  target: AdminJlptStructureTarget;
  disabled: boolean;
  pending: boolean;
  run: (action: AdminJlptStructureAction) => Promise<void>;
  onClose: () => void;
  finalFocus: RefObject<HTMLElement | null>;
}) {
  const [error, setError] = useState<ReturnType<typeof getAdminJlptError> | null>(null);
  const session = exam.sessions.find((s) => s.id === target.sessionId);
  const part =
    target.kind === 'session' ? undefined : session?.parts.find((p) => p.id === target.partId);
  const question =
    target.kind === 'question'
      ? part?.questions.find((q) => q.id === target.questionId)
      : undefined;
  const parts = target.kind === 'session' ? (session?.parts ?? []) : part ? [part] : [];
  const questions =
    target.kind === 'question' ? (question ? [question] : []) : parts.flatMap((p) => p.questions);
  const answers = questions.reduce((sum, q) => sum + q.answers.length, 0);
  const label =
    target.kind === 'session' ? 'phiên thi' : target.kind === 'part' ? 'phần thi' : 'câu hỏi';
  const name =
    target.kind === 'session'
      ? session?.name
      : target.kind === 'part'
        ? part?.name
        : `Câu hỏi #${target.questionId}`;
  const missing = target.kind === 'session' ? !session : target.kind === 'part' ? !part : !question;
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <AlertDialogContent
        finalFocus={finalFocus}
        className="rounded-3xl bg-white p-6 text-slate-900 sm:max-w-lg"
      >
        <AlertDialogTitle>Xóa {label}?</AlertDialogTitle>
        <AlertDialogDescription className="text-slate-600">
          Xóa vĩnh viễn mục đã chọn và nội dung con, không thể khôi phục bằng giao diện.
        </AlertDialogDescription>
        <p className="whitespace-pre-wrap break-words font-semibold [overflow-wrap:anywhere]">
          {name ?? 'Mục không còn tồn tại'}
        </p>
        {question && (
          <AdminJlptSafeText
            text={question.questionText}
            className="line-clamp-3 text-sm text-slate-600"
          />
        )}
        <p className="text-sm text-slate-700">
          {target.kind === 'session' ? `${parts.length} phần thi, ` : ''}
          {target.kind !== 'question' ? `${questions.length} câu hỏi, ` : ''}
          {answers} đáp án sẽ bị xóa. Thứ tự các mục còn lại được cập nhật.
        </p>
        <p className="text-xs text-slate-600">
          Liên kết audio/ảnh liên quan được tháo; tệp media không bị xóa. Trạng thái sử dụng media
          được máy chủ tính lại theo các liên kết còn tồn tại.
        </p>
        {(error || disabled || missing) && (
          <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
            {error
              ? `${error.message} Đã yêu cầu tải lại trạng thái.`
              : missing
                ? 'Mục không còn tồn tại.'
                : 'Hiện chưa được phép chỉnh sửa. Hãy kiểm tra trạng thái đề thi.'}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Hủy</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={disabled || pending || missing || [401, 403].includes(error?.status ?? 0)}
            onClick={async () => {
              if (disabled || pending || missing) return;
              setError(null);
              try {
                await run({ kind: 'delete', target });
                onClose();
              } catch (cause) {
                setError(getAdminJlptError(cause));
              }
            }}
          >
            {pending ? 'Đang xóa…' : 'Xóa vĩnh viễn'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
