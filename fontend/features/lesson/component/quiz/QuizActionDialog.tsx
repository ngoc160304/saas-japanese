'use client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { QuizDialog } from '../../hooks/useAdminLessonQuiz';

export function QuizActionDialog({
  target,
  pending,
  error,
  unavailable,
  onClose,
  onConfirm,
}: {
  target: QuizDialog;
  pending: boolean;
  error: string | null;
  unavailable: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const publication = target.kind === 'publication';
  const title = publication
    ? target.quiz.isPublished
      ? 'Ẩn Quiz?'
      : 'Xuất bản Quiz?'
    : target.kind === 'deleteQuestion'
      ? `Xóa câu hỏi “${target.question.questionText}”?`
      : `Xóa Quiz “${target.quiz?.title}”?`;
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <AlertDialogContent className="rounded-3xl bg-white text-slate-900">
        <AlertDialogHeader>
          <AlertDialogTitle className="break-words">{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {publication
              ? 'Chỉ thay đổi trạng thái Quiz đã lưu. Trạng thái xuất bản bài học được giữ nguyên.'
              : target.kind === 'deleteQuestion'
                ? 'Câu hỏi sẽ không còn xuất hiện trong Quiz. Nếu đây là câu hỏi cuối của Quiz đã xuất bản, hãy ẩn Quiz trước.'
                : 'Quiz và các câu hỏi sẽ không còn xuất hiện trong bài học. Các nội dung khác của bài học được giữ nguyên.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {(error || unavailable) && (
          <p role="alert" className="text-sm text-rose-700">
            {error ?? 'Nội dung không còn tồn tại. Hãy đóng hộp thoại và tải lại.'}
          </p>
        )}
        <AlertDialogFooter className="flex-row flex-wrap justify-end">
          <Button variant="outline" disabled={pending} onClick={onClose}>
            {unavailable ? 'Đóng' : 'Hủy'}
          </Button>
          <Button
            disabled={pending || unavailable}
            className={
              publication
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-rose-700 text-white hover:bg-rose-800'
            }
            onClick={() => {
              void onConfirm().catch(() => {
                /* The hook displays the error and retains the dialog. */
              });
            }}
          >
            {pending
              ? 'Đang cập nhật…'
              : publication
                ? target.quiz?.isPublished
                  ? 'Ẩn Quiz'
                  : 'Xuất bản Quiz'
                : 'Xác nhận xóa'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
