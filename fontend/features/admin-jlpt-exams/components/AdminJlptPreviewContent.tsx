'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { AdminJlptPreviewMedia, AdminJlptPreviewQuestion } from '../admin-jlpt-preview';
import { AdminJlptSafeText } from './AdminJlptSafeText';
import { AdminJlptMediaPreview } from './AdminJlptMediaPreview';
import { adminJlptHasVisibleText } from '../admin-jlpt-question';

export function AdminJlptPreviewAudio({ audio }: { audio: AdminJlptPreviewMedia | null }) {
  return (
    audio && (
      <div className="space-y-2 rounded-2xl border border-sky-200 bg-sky-50 p-4">
        <p className="text-xs font-semibold text-sky-900">Audio của phần thi</p>
        <AdminJlptMediaPreview kind="audio" url={audio.url} name={audio.name} local={audio.local} />
      </div>
    )
  );
}

/** Local interaction only. No API/query/attempt hooks are used in presentation. */
export function AdminJlptPreviewContent({ question }: { question: AdminJlptPreviewQuestion }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <article
      aria-label={`Preview câu ${question.number}`}
      className="min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 sm:p-6"
    >
      {question.passage && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <AdminJlptSafeText text={question.passage} />
        </div>
      )}
      <div className="space-y-2">
        <p className="text-xs font-bold text-primary">Câu {question.number}</p>
        {adminJlptHasVisibleText(question.prompt) ? (
          <AdminJlptSafeText
            text={question.prompt}
            className="text-base font-semibold leading-relaxed"
          />
        ) : (
          <p className="text-sm text-amber-900">Chưa có nội dung câu hỏi.</p>
        )}
      </div>
      {question.image && (
        <AdminJlptMediaPreview
          kind="image"
          url={question.image.url}
          name={question.image.name}
          local={question.image.local}
        />
      )}
      <fieldset className="min-w-0 space-y-3">
        <legend className="mb-3 text-sm font-medium">
          Chọn một đáp án (chỉ thử trong preview)
        </legend>
        {question.options.map((option, index) => (
          <label
            key={option.id}
            className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-4 ${selected === option.id ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white'}`}
          >
            <input
              type="radio"
              name={`preview-${question.id}`}
              value={option.id}
              checked={selected === option.id}
              onChange={() => setSelected(option.id)}
              aria-label={`Lựa chọn ${index + 1}`}
              className="mt-1 size-4 shrink-0 accent-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2"
            />
            <span className="text-sm font-semibold">{index + 1}.</span>
            <div className="min-w-0 flex-1">
              {adminJlptHasVisibleText(option.text) ? (
                <AdminJlptSafeText text={option.text} />
              ) : (
                <p className="text-sm text-amber-900">Đáp án chưa có nội dung.</p>
              )}
            </div>
          </label>
        ))}
        {!question.options.length && <p className="text-sm text-amber-900">Chưa có đáp án.</p>}
      </fieldset>
      {selected !== null && (
        <Button variant="outline" onClick={() => setSelected(null)}>
          Bỏ lựa chọn preview
        </Button>
      )}
    </article>
  );
}
