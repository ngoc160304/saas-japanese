'use client';

import type { Lesson } from '@/apis/lessons/lessons.type';
import { GrammarLectureCard, type LessonVideoControls } from './GrammarLectureCard';
import { GrammarPointDialog } from './GrammarPointDialog';
import { GrammarRichTextEditor } from './GrammarRichTextEditor';
import { sanitizeGrammarHtml } from './sanitizeGrammarHtml';

function escapeText(value: string): string {
  const element = document.createElement('span');
  element.textContent = value;
  return element.innerHTML;
}

export function GrammarSection({ lesson, draft, onDraftChange, video, videoDisabled, onReloadVideo }: {
  lesson: Lesson;
  draft: string;
  onDraftChange: (value: string) => void;
  video: LessonVideoControls;
  videoDisabled: boolean;
  onReloadVideo: () => void;
}) {
  function addPoint(title: string, body: string) {
    const safeBody = sanitizeGrammarHtml(body);
    const next = `${draft.trim()}<h2>${escapeText(title)}</h2>${safeBody}`;
    onDraftChange(next);
  }

  return (
    <section aria-labelledby="grammar-heading" className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft md:p-6">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 id="grammar-heading" className="text-base font-bold text-slate-900 md:text-lg">Grammar &amp; Lecture Video</h2>
        <p className="mt-0.5 text-xs font-medium text-slate-500">Ngữ pháp và video bài giảng của bài học.</p>
      </div>
      <div className="space-y-6">
        <GrammarLectureCard videoUrl={lesson.videoUrl} videoMediaId={lesson.videoMediaId}
          controls={video} disabled={videoDisabled} onReload={onReloadVideo} />
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-extrabold text-slate-900">Nội dung ngữ pháp</h3>
            <GrammarPointDialog onAdd={addPoint} />
          </div>
          {!draft.trim() && <p className="text-sm text-slate-500">Chưa có nội dung ngữ pháp</p>}
          <GrammarRichTextEditor id={`lesson-${lesson.id}-grammar`} value={draft} onChange={onDraftChange} />
        </div>
      </div>
    </section>
  );
}
