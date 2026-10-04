'use client';

import { useState } from 'react';
import type { GrammarLectureVideo, GrammarPoint } from '../../types/grammar';
import { GrammarLectureCard } from './GrammarLectureCard';
import { GrammarPointDialog } from './GrammarPointDialog';
import { GrammarRichTextEditor } from './GrammarRichTextEditor';

interface GrammarSectionProps {
  video: GrammarLectureVideo;
  points: readonly GrammarPoint[];
  pointCount: number;
  onPointAdded: () => void;
}

function formatGrammarPoint(title: string, content: string) {
  const safeTitle = title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<h2>${safeTitle}</h2>\n${content}`;
}

export function GrammarSection({ video, points, pointCount, onPointAdded }: GrammarSectionProps) {
  const [editorContent, setEditorContent] = useState(() =>
    points
      .map((point) => formatGrammarPoint(point.title, point.editorContent))
      .join('\n<hr />\n'),
  );

  function addGrammarPoint(title: string, content: string) {
    const nextPoint = formatGrammarPoint(title, content);
    setEditorContent((current) => (current ? `${current}\n<hr />\n${nextPoint}` : nextPoint));
    onPointAdded();
  }

  return (
    <section
      aria-labelledby="grammar-heading"
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft md:p-6"
    >
      <div className="mb-5 flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h2
            id="grammar-heading"
            className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-base font-bold text-slate-900 md:text-lg"
          >
            Grammar &amp; Lecture Video
            <span className="text-xs font-normal text-slate-400">
              | Ngữ pháp &amp; Video bài giảng
            </span>
          </h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Video bài giảng lý thuyết và các mẫu ngữ pháp trọng điểm của bài học.
          </p>
        </div>
        <GrammarPointDialog variant="primary" onAdd={addGrammarPoint} />
      </div>
      <div className="space-y-6">
        <GrammarLectureCard video={video} />
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Grammar Points ({pointCount})
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Nội dung các mẫu ngữ pháp trọng tâm trong bài học
            </p>
          </div>
          <GrammarPointDialog onAdd={addGrammarPoint} />
        </div>
        <div className="min-w-0">
          <label htmlFor="lesson-grammar-content" className="sr-only">
            Nội dung Grammar Points
          </label>
          <GrammarRichTextEditor
            id="lesson-grammar-content"
            value={editorContent}
            onChange={setEditorContent}
          />
          <p className="mt-2 text-xs text-slate-500">
            Nội dung chỉnh sửa chỉ được giữ tạm trên trang này và sẽ mất khi tải lại.
          </p>
        </div>
      </div>
    </section>
  );
}
