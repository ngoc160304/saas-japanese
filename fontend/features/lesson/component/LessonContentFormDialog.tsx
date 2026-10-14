'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

/** Shared dismissal behavior; each domain owns its fields, schema and form state. */
export function LessonContentFormDialog({
  title,
  dirty,
  pending,
  onClose,
  children,
}: {
  title: string;
  dirty: boolean;
  pending: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const [discard, setDiscard] = useState(false);
  useEffect(() => {
    if (!dirty && !pending) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, pending]);
  function requestClose() {
    if (pending) return;
    if (dirty) setDiscard(true);
    else onClose();
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="rounded-3xl bg-white p-6 text-slate-900 sm:max-w-xl"
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          Lưu riêng cho bài học hiện tại. Các trường có * là bắt buộc.
        </DialogDescription>
        <div hidden={discard}>{children}</div>
        {discard ? (
          <div className="space-y-4" role="alert">
            <p>Bỏ các thay đổi chưa lưu trong biểu mẫu này?</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button autoFocus variant="outline" onClick={() => setDiscard(false)}>
                Tiếp tục chỉnh sửa
              </Button>
              <Button className="bg-rose-700 text-white hover:bg-rose-800" onClick={onClose}>
                Bỏ thay đổi
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="outline" disabled={pending} onClick={requestClose}>
            Hủy
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
