'use client';

import type { ReactNode } from 'react';
import { usePathname, useSelectedLayoutSegments } from 'next/navigation';

export function AdminShell({ children, sidebar }: { children: ReactNode; sidebar: ReactNode }) {
  const segments = useSelectedLayoutSegments();
  const pathname = usePathname();
  const isLessonContent =
    pathname.startsWith('/admin/') &&
    segments.length === 4 &&
    segments[0] === 'courses' &&
    /^\d+$/.test(segments[1]) &&
    segments[2] === 'lessons' &&
    /^\d+$/.test(segments[3]);
  const isJlptReview = segments.length === 2 && segments[0] === 'jlpt_exam_review';

  if (isLessonContent || isJlptReview) return children;

  return (
    <div className="min-h-screen antialiased text-slate-800 bg-[#f3f6fa]">
      <div className="min-h-screen flex flex-col xl:flex-row bg-[#f3f6fa]">
        {sidebar}
        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-7 overflow-y-auto max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
