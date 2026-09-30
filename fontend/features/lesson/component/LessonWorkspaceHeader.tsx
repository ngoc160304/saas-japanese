import Link from 'next/link';
import { Eye, Menu, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';

export function LessonWorkspaceHeader({
  courseId,
  lessonId,
  courseTitle,
  lessonTitle,
}: {
  courseId: number;
  lessonId: number;
  courseTitle: string;
  lessonTitle: string;
}) {
  return (
    <header className="z-30 shrink-0 border-b border-slate-200/80 bg-white px-4 py-2.5 shadow-xs lg:px-6">
      <div className="flex items-center justify-between gap-3 md:gap-4">
        <div className="flex min-w-0 items-center gap-3 md:gap-5">
          <Link
            href="/admin/courses"
            aria-label="Studify Admin courses"
            className="flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-sky-500"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <span className="hidden text-lg font-extrabold tracking-tight text-slate-900 xl:inline">
              Studify{' '}
              <span className="rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[10px] tracking-wider text-indigo-600 uppercase">
                Admin
              </span>
            </span>
          </Link>
          <div className="hidden h-6 w-px shrink-0 bg-slate-200 md:block" />
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-slate-500"
          >
            <Link href="/admin/courses" className="font-semibold hover:text-slate-900">
              Courses
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/admin/courses/${courseId}`}
              className="min-w-0 truncate rounded-xl bg-slate-50 px-2.5 py-1 font-bold text-slate-800 hover:bg-slate-100 hover:text-sky-600"
              title={courseTitle}
            >
              {courseTitle}
            </Link>
            <span aria-hidden="true" className="hidden md:inline">
              /
            </span>
            <span
              aria-current="page"
              className="hidden min-w-0 truncate md:block"
              title={lessonTitle}
            >
              Lesson {lessonId}: {lessonTitle}
            </span>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <DialogTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                aria-label="Open curriculum"
                className="rounded-xl border-slate-200 bg-white text-slate-600 focus-visible:ring-sky-500 lg:hidden"
              />
            }
          >
            <Menu className="size-5" aria-hidden="true" />
          </DialogTrigger>
          <Link
            href={`/admin/courses/${courseId}`}
            className="hidden items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 sm:flex"
          >
            <Settings className="size-3.5 text-slate-400" aria-hidden="true" />
            Outline
          </Link>
          <Button
            type="button"
            disabled
            title="Student View is unavailable"
            className="hidden h-auto items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-xs font-bold text-sky-700 shadow-2xs sm:flex"
          >
            <Eye className="size-3.5" aria-hidden="true" />
            Student View
            <span className="text-[10px] font-medium">Unavailable</span>
          </Button>
          <span className="hidden border-l border-slate-200 pl-2 sm:block">
            <span
              className="flex size-8 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white"
              aria-label="Admin workspace"
            >
              AD
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}
