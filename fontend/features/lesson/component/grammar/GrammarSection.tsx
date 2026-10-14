'use client';

import { useRef, useState } from 'react';
import { Plus, Save } from 'lucide-react';
import type { Editor as TinyMCEEditor } from 'tinymce';
import type { Lesson } from '@/apis/lessons/lessons.type';
import { Button } from '@/components/ui/button';
import { GrammarLectureCard, type LessonVideoControls } from './GrammarLectureCard';
import { GrammarRichTextEditor } from './GrammarRichTextEditor';

export function GrammarSection({ lesson, draft, onDraftChange, onSave, onCancel, dirty, isSaving, saveError, video, videoDisabled, onReloadVideo }: {
  lesson: Lesson;
  draft: string;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  dirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  video: LessonVideoControls;
  videoDisabled: boolean;
  onReloadVideo: () => void;
}) {
  const editorRef = useRef<TinyMCEEditor | null>(null);
  const [editorReady, setEditorReady] = useState(false);

  function addPoint() {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    editor.insertContent('<h2>Nhập mẫu ngữ pháp</h2><p>Nhập giải thích và ví dụ</p>');
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
            <Button type="button" disabled={!editorReady} onPointerDown={(event) => { if (event.pointerType === 'mouse') event.preventDefault(); }} onClick={addPoint} className="h-9 rounded-xl bg-primary px-3.5 text-xs font-bold text-white hover:bg-primary/90">
              <Plus className="size-3.5" aria-hidden="true" />
              Add Grammar Point
            </Button>
          </div>
          {!draft.trim() && <p className="text-sm text-slate-500">Chưa có nội dung ngữ pháp</p>}
          <GrammarRichTextEditor id={`lesson-${lesson.id}-grammar`} value={draft} onChange={onDraftChange} onReady={(editor) => { editorRef.current = editor; setEditorReady(true); }} />
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p role="status" className={`text-xs font-semibold ${dirty ? 'text-amber-700' : 'text-emerald-700'}`}>
              {isSaving ? 'Đang lưu…' : dirty ? 'Chưa lưu thay đổi' : 'Đã lưu'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={!dirty || isSaving} className="h-9 rounded-xl border-slate-200 px-4 text-xs font-bold text-slate-700">Hủy thay đổi</Button>
              <Button type="button" onClick={onSave} disabled={!dirty || isSaving || videoDisabled} className="h-9 rounded-xl bg-primary px-4 text-xs font-bold text-white hover:bg-primary/90">
                <Save className="size-3.5" aria-hidden="true" />
                {isSaving ? 'Đang lưu…' : 'Lưu ngữ pháp'}
              </Button>
            </div>
          </div>
          {saveError && <p role="alert" className="text-xs font-medium text-rose-700">{saveError} Bản nháp vẫn ở trong trình soạn thảo.</p>}
        </div>
      </div>
    </section>
  );
}
