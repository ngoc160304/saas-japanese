import Link from 'next/link';
import { Check, Paperclip, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LessonGrammarPreview } from '../types/grammar';

export function LessonHeaderCard({
  courseId,
  lessonId,
  lesson,
}: {
  courseId: number;
  lessonId: number;
  lesson: LessonGrammarPreview;
}) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft md:p-6">
      <div className="flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="rounded-lg border border-sky-100 bg-sky-50 px-2 py-0.5 font-bold text-sky-700">
              Lesson #{lessonId}
            </span>
            <span aria-hidden="true">•</span>
            <span className="font-mono text-slate-500">{lesson.durationMinutes} mins</span>
            <span aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Published
            </span>
          </div>
          <h1 className="text-base font-black break-words text-slate-900 md:text-lg">
            Lesson {lessonId}: {lesson.title}
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 md:text-sm">
            Quản lý ngữ pháp và video bài giảng của bài học.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            disabled
            aria-describedby="lesson-unavailable-actions"
            className="h-9 rounded-2xl border-sky-200/80 bg-sky-50 px-3.5 text-xs font-bold text-sky-800"
          >
            <Paperclip className="size-4" aria-hidden="true" />
            Resources
          </Button>
          <Button
            nativeButton={false}
            render={<Link href={`/admin/courses/${courseId}/lessons/${lessonId}/edit`} />}
            variant="outline"
            className="h-9 rounded-2xl border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit Lesson
          </Button>
          <Button
            type="button"
            disabled
            aria-describedby="lesson-unavailable-actions"
            variant="secondary"
            className="h-9 rounded-2xl bg-slate-100 px-3.5 text-xs font-bold text-slate-700"
          >
            Toggle Status
          </Button>
          <Button
            type="button"
            disabled
            aria-describedby="lesson-unavailable-actions"
            className="h-9 rounded-2xl bg-slate-900 px-3.5 text-xs font-bold text-white"
          >
            <Check className="size-3.5" aria-hidden="true" />
            Save
          </Button>
        </div>
      </div>
      <p id="lesson-unavailable-actions" className="mt-3 text-[11px] text-slate-500">
        Resources, status changes and saving are unavailable in this content preview.
      </p>
    </section>
  );
}
