import Link from 'next/link';
import { EyeOff, LoaderCircle, Pencil, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Lesson } from '@/apis/lessons/lessons.type';

export function LessonHeaderCard({
  courseId,
  lessonId,
  lesson,
  showGrammarSave,
  grammarDirty,
  isSaving,
  isChangingPublication,
  saveError,
  onSave,
  onPublicationClick,
  onNavigate,
}: {
  courseId: number;
  lessonId: number;
  lesson: Lesson;
  showGrammarSave: boolean;
  grammarDirty: boolean;
  isSaving: boolean;
  isChangingPublication: boolean;
  saveError: string | null;
  onSave: () => void;
  onPublicationClick: () => void;
  onNavigate: (href: string, event: { preventDefault(): void }) => void;
}) {
  const editHref = `/admin/courses/${courseId}/lessons/${lessonId}/edit`;
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft md:p-6">
      <div className="flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="rounded-lg border border-sky-100 bg-sky-50 px-2 py-0.5 font-bold text-sky-700">
              Lesson #{lessonId}
            </span>
            <span aria-hidden="true">•</span>
            <span className="font-mono text-slate-500">
              {lesson.durationMinutes === null
                ? 'Chưa cập nhật thời lượng'
                : `${lesson.durationMinutes} phút`}
            </span>
            <span aria-hidden="true">•</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-bold ${lesson.isPublished ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}
            >
              <span
                className={`size-1.5 rounded-full ${lesson.isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`}
                aria-hidden="true"
              />
              {lesson.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
          <h1 className="text-base font-black break-words text-slate-900 md:text-lg">
            {lesson.title}
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 md:text-sm">
            Quản lý ngữ pháp và video bài giảng của bài học.
          </p>
          <p role="status" className={`mt-2 text-xs font-semibold ${grammarDirty ? 'text-amber-700' : 'text-emerald-700'}`}>
            Ngữ pháp: {isSaving ? 'Đang lưu…' : grammarDirty ? 'Chưa lưu thay đổi' : 'Đã lưu'}
          </p>
          {saveError && <p role="alert" className="mt-1 text-xs text-rose-700">{saveError}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {showGrammarSave && (
            <Button type="button" onClick={onSave} disabled={!grammarDirty || isSaving || isChangingPublication} className="h-9 rounded-2xl bg-primary px-3.5 text-xs font-bold text-white hover:bg-primary/90">
              {isSaving ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> : <Save className="size-3.5" aria-hidden="true" />}
              {isSaving ? 'Đang lưu…' : 'Lưu ngữ pháp'}
            </Button>
          )}
          <Button type="button" onClick={onPublicationClick} disabled={isSaving || isChangingPublication} variant="outline" className="h-9 rounded-2xl border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
            {isChangingPublication ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> : lesson.isPublished ? <EyeOff className="size-3.5" aria-hidden="true" /> : <Upload className="size-3.5" aria-hidden="true" />}
            {isChangingPublication ? 'Đang cập nhật…' : lesson.isPublished ? 'Ẩn bài học' : 'Xuất bản'}
          </Button>
          <Button
            nativeButton={false}
            render={<Link href={editHref} onNavigate={(event) => onNavigate(editHref, event)} />}
            variant="outline"
            className="h-9 rounded-2xl border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit Lesson
          </Button>
        </div>
      </div>
    </section>
  );
}
