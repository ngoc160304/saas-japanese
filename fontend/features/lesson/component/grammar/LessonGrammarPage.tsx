import Link from 'next/link';
import { Check, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { lessonGrammarMock } from '../../data/grammar.mock';
import { lessonVocabularyMock } from '../../data/vocabulary.mock';
import { LessonContentTabs } from '../LessonContentTabs';

export function LessonGrammarPage({ courseId, lessonId }: { courseId: number; lessonId: number }) {
  const lesson = lessonGrammarMock;

  return (
    <div className="min-w-0 space-y-5 text-slate-800">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600"
      >
        <Link href="/admin/courses" className="hover:text-sky-700 hover:underline">
          Khóa học
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`/admin/courses/${courseId}`} className="hover:text-sky-700 hover:underline">
          {lesson.courseTitle}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-slate-900">
          Lesson {lessonId}
        </span>
      </nav>

      <header className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-soft md:p-6 2xl:flex-row 2xl:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="rounded-lg border border-sky-100 bg-sky-50 px-2 py-0.5 font-bold text-sky-700">
              Lesson #{lessonId}
            </span>
            <span aria-hidden="true">•</span>
            <span className="font-mono">{lesson.durationMinutes} mins</span>
            <span aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Published
            </span>
          </div>
          <h1 className="text-base font-black break-words text-slate-900 md:text-lg">
            Lesson {lessonId}: {lesson.title}
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-600 md:text-sm">
            Quản lý ngữ pháp và video bài giảng của bài học.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-2xl border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit Lesson
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-9 rounded-2xl bg-slate-100 px-3.5 text-xs font-bold text-slate-700"
          >
            Toggle Status
          </Button>
          <Button
            type="button"
            className="h-9 rounded-2xl bg-slate-900 px-3.5 text-xs font-bold text-white hover:bg-sky-600"
          >
            <Check className="size-3.5" aria-hidden="true" />
            Save
          </Button>
        </div>
      </header>

      <LessonContentTabs
        video={lesson.video}
        grammarPoints={lesson.points}
        vocabularyItems={lessonVocabularyMock}
      />
    </div>
  );
}
