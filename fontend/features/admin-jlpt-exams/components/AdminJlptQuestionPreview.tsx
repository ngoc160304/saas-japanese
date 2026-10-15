'use client';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { AdminJlptPreviewMedia, AdminJlptPreviewQuestion } from '../admin-jlpt-preview';
import { AdminJlptPreviewAudio, AdminJlptPreviewContent } from './AdminJlptPreviewContent';

export function AdminJlptQuestionPreview({
  question,
  audio,
  dirty,
  onClose,
}: {
  question: AdminJlptPreviewQuestion;
  audio: AdminJlptPreviewMedia | null;
  dirty: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="rounded-3xl bg-white p-5 text-slate-900 sm:max-w-3xl">
        <DialogTitle className="pr-6">Admin preview · Câu hỏi đang soạn</DialogTitle>
        <DialogDescription className="text-slate-600">
          {dirty ? 'Bao gồm thay đổi chưa lưu. ' : ''}Dùng nội dung hiện tại của biểu mẫu, không xác
          nhận dữ liệu đã lưu hay độ sẵn sàng xuất bản. Lựa chọn chỉ dùng thử; không tạo lượt làm
          bài.
        </DialogDescription>
        <AdminJlptPreviewAudio audio={audio} />
        <AdminJlptPreviewContent question={question} />
        <Button variant="outline" onClick={onClose}>
          ← Về editor
        </Button>
      </DialogContent>
    </Dialog>
  );
}
