'use client';

import { useId, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { GrammarRichTextEditor } from './GrammarRichTextEditor';
import { sanitizeGrammarHtml } from './sanitizeGrammarHtml';

export function GrammarPointDialog({ onAdd }: { onAdd: (title: string, content: string) => void }) {
  const id = useId();
  const titleInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const safeBody = typeof DOMParser !== 'undefined' ? sanitizeGrammarHtml(body) : '';
  const meaningfulBody = typeof DOMParser !== 'undefined'
    && Boolean(new DOMParser().parseFromString(safeBody, 'text/html').body.textContent?.replaceAll('\u00a0', ' ').trim());
  const canAdd = Boolean(title.trim()) && meaningfulBody;

  function requestClose() {
    if (title.trim() || meaningfulBody) setDiscard(true);
    else setOpen(false);
  }

  function discardAndClose() {
    setTitle('');
    setBody('');
    setDiscard(false);
    setOpen(false);
  }

  function continueEditing() {
    setDiscard(false);
    // The dialog moves focus after its confirmation buttons unmount.
    window.setTimeout(() => {
      if (titleInput.current?.offsetParent) titleInput.current.focus();
    }, 50);
  }

  function insert() {
    if (!canAdd) return;
    onAdd(title.trim(), safeBody);
    setTitle('');
    setBody('');
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (nextOpen) setOpen(true); else requestClose(); }}>
      <DialogTrigger render={<Button type="button" className="h-9 rounded-xl bg-primary px-3.5 text-xs font-bold text-white hover:bg-primary/90" />}>
        <Plus className="size-3.5" aria-hidden="true" />
        Add Grammar Point
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-3xl border border-slate-100 bg-white p-0 text-slate-900 shadow-2xl sm:max-w-[580px]">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-6">
          <DialogTitle className="text-base font-bold">Add Grammar Point</DialogTitle>
          <DialogDescription>Chèn một mục vào bản nháp ngữ pháp. Bấm “Lưu ngữ pháp” để lưu lên máy chủ.</DialogDescription>
        </DialogHeader>
        <div hidden={discard} className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-6 py-4">
          <div>
            <label htmlFor={`${id}-title`} className="mb-1 block text-xs font-bold text-slate-700">Grammar Pattern Structure *</label>
            <Input ref={titleInput} id={`${id}-title`} value={title} onChange={(event) => setTitle(event.target.value)} aria-required="true" className="h-10 rounded-2xl border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-slate-900" />
          </div>
          <div>
            <label htmlFor={`${id}-body`} className="mb-1 block text-xs font-bold text-slate-700">Explanation &amp; Examples *</label>
            <GrammarRichTextEditor id={`${id}-body`} value={body} onChange={setBody} />
          </div>
        </div>
        {discard && (
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4" role="alert">
            <p className="text-sm">Bỏ nội dung ngữ pháp chưa chèn vào bản nháp?</p>
          </div>
        )}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
          {discard ? (
            <>
              <Button type="button" autoFocus variant="outline" onClick={continueEditing}>Tiếp tục chỉnh sửa</Button>
              <Button type="button" onClick={discardAndClose} className="bg-rose-700 text-white hover:bg-rose-800">Bỏ thay đổi</Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={requestClose} className="rounded-xl px-4 text-xs font-bold">Hủy</Button>
              <Button type="button" disabled={!canAdd} onClick={insert} className="rounded-xl bg-primary px-5 text-xs font-bold text-white hover:bg-primary/90">Chèn vào bản nháp</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
