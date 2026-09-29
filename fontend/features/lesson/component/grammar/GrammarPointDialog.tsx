'use client';

import { useId, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { newGrammarPointEditorMock } from '../../data/grammar.mock';
import type { GrammarPoint } from '../../types/grammar';
import { GrammarRichTextEditor } from './GrammarRichTextEditor';

export function GrammarPointDialog({
  point,
  variant = 'secondary',
}: {
  point?: GrammarPoint;
  variant?: 'primary' | 'secondary';
}) {
  const id = useId();
  const title = point ? 'Edit Grammar Point' : 'Add Grammar Point';
  const [editorContent, setEditorContent] = useState(
    point?.editorContent ?? newGrammarPointEditorMock,
  );

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant={point ? 'outline' : 'default'}
            size={point ? 'icon-sm' : 'default'}
            aria-label={point ? `Edit Grammar: ${point.title}` : undefined}
            title={point ? 'Edit Grammar' : undefined}
            className={
              point
                ? 'rounded-lg border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                : `h-10 self-start rounded-2xl px-4 text-xs font-bold text-white shadow-2xs ${variant === 'primary' ? 'bg-slate-900 hover:bg-amber-600' : 'bg-sky-600 hover:bg-sky-700'}`
            }
          />
        }
      >
        {point ? (
          <Pencil className="size-3.5" aria-hidden="true" />
        ) : (
          <>
            <Plus className="size-3.5" aria-hidden="true" />
            Add Grammar Point
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl border border-slate-100 bg-white p-6 text-slate-900 shadow-2xl sm:max-w-lg">
        <DialogHeader className="border-b border-slate-100 pb-3 pr-6">
          <DialogTitle className="text-base font-bold">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Grammar pattern, explanation and examples.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3.5">
          <div>
            <label htmlFor={`${id}-title`} className="mb-1 block text-xs font-bold text-slate-700">
              Grammar Pattern Structure *
            </label>
            <Input
              id={`${id}-title`}
              defaultValue={point?.title ?? ''}
              aria-required="true"
              placeholder="e.g. ~わけがない / ~わけはない"
              className="h-10 rounded-2xl border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-slate-900 md:text-xs"
            />
          </div>
          <div>
            <label
              htmlFor={`${id}-explanation`}
              className="mb-1 block text-xs font-bold text-slate-700"
            >
              Explanation &amp; Examples *
            </label>
            <GrammarRichTextEditor
              id={`${id}-explanation`}
              value={editorContent}
              onChange={setEditorContent}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2.5 border-t border-slate-100 pt-3">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl px-4 text-xs font-bold text-slate-600"
                />
              }
            >
              Cancel
            </DialogClose>
            <Button
              type="button"
              className="rounded-xl bg-slate-900 px-5 text-xs font-bold text-white hover:bg-amber-600"
            >
              Save Grammar Point
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
