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
  actions,
}: {
  title: string;
  dirty: boolean;
  pending: boolean;
  onClose: () => void;
  children: ReactNode;
  actions: ReactNode;
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
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-3xl bg-white p-0 text-slate-900 sm:max-w-[640px]"
      >
        <div className="shrink-0 space-y-2 px-6 pb-4 pt-6">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Lưu riêng cho bài học hiện tại. Các trường có * là bắt buộc.
          </DialogDescription>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div hidden={discard}>{children}</div>
          {discard && (
            <p role="alert">Bỏ các thay đổi chưa lưu trong biểu mẫu này?</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
          {discard ? (
            <>
              <Button type="button" autoFocus variant="outline" onClick={() => setDiscard(false)}>
                Tiếp tục chỉnh sửa
              </Button>
              <Button type="button" className="bg-rose-700 text-white hover:bg-rose-800" onClick={onClose}>
                Bỏ thay đổi
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" disabled={pending} onClick={requestClose}>
                Hủy
              </Button>
              {actions}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
