'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getApiError } from '@/lib/api-error';

export function LessonContentDeleteDialog({
  label,
  pending,
  unavailable,
  onClose,
  onConfirm,
}: {
  label: string;
  pending: boolean;
  unavailable: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  async function confirm() {
    if (submitting.current) return;
    submitting.current = true;
    setError(null);
    try {
      await onConfirm();
    } catch (failure) {
      setError(getApiError(failure).message);
    } finally {
      submitting.current = false;
    }
  }
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !submitting.current) onClose();
      }}
    >
      <AlertDialogContent className="rounded-3xl bg-white text-slate-900">
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa “{label}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Bản ghi sẽ được xóa mềm và không còn xuất hiện trong nội dung bài học.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {unavailable ? (
          <p role="alert">
            Nội dung đã bị xóa hoặc không còn thuộc bài học này. Danh sách đang được làm mới.
          </p>
        ) : (
          error && (
            <p role="alert" className="text-sm text-rose-700">
              {error}
            </p>
          )
        )}
        <AlertDialogFooter className="flex-row flex-wrap justify-end">
          <Button variant="outline" disabled={pending} onClick={onClose}>
            {unavailable ? 'Đóng' : 'Hủy'}
          </Button>
          {!unavailable && (
            <Button
              disabled={pending}
              onClick={() => void confirm()}
              className="bg-rose-700 text-white hover:bg-rose-800"
            >
              {pending ? 'Đang xóa…' : 'Xác nhận xóa'}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
