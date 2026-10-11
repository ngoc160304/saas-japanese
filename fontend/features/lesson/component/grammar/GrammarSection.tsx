'use client';

import { useSyncExternalStore } from 'react';
import type { Lesson } from '@/apis/lessons/lessons.type';
import { GrammarLectureCard } from './GrammarLectureCard';
import { sanitizeGrammarHtml } from './sanitizeGrammarHtml';

const subscribeToBrowser = () => () => {};

export function GrammarSection({ lesson }: { lesson: Lesson }) {
  const grammar = lesson.grammar?.trim();
  const safeGrammar = useSyncExternalStore(
    subscribeToBrowser,
    () => (grammar ? sanitizeGrammarHtml(grammar) : null),
    () => null,
  );
  // The sanitized document is also isolated from the admin origin and external resources.
  const grammarDocument =
    grammar && safeGrammar !== null
      ? `<!doctype html><html lang="vi"><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><style>body{font:14px/1.65 'Plus Jakarta Sans',Inter,sans-serif;color:#334155;padding:12px;margin:0}h1,h2,h3{color:#0f172a}</style></head><body>${safeGrammar}</body></html>`
      : null;

  return (
    <section
      aria-labelledby="grammar-heading"
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft md:p-6"
    >
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 id="grammar-heading" className="text-base font-bold text-slate-900 md:text-lg">
          Grammar &amp; Lecture Video
        </h2>
        <p className="mt-0.5 text-xs font-medium text-slate-500">
          Ngữ pháp và video bài giảng của bài học.
        </p>
      </div>
      <div className="space-y-6">
        <GrammarLectureCard videoUrl={lesson.videoUrl} videoMediaId={lesson.videoMediaId} />
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Nội dung ngữ pháp</h3>
          {grammar && !grammarDocument ? (
            <p role="status" className="mt-3 p-6 text-sm text-slate-500">
              Đang hiển thị ngữ pháp...
            </p>
          ) : grammarDocument ? (
            <iframe
              title="Nội dung ngữ pháp"
              sandbox=""
              srcDoc={grammarDocument}
              className="mt-3 h-80 w-full rounded-2xl border border-slate-200 bg-white"
            />
          ) : (
            <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              Chưa có nội dung ngữ pháp
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
