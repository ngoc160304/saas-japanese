'use client';

import { useState } from 'react';
import type { CourseDetailData } from '../course-detail.types';
import { CourseSyllabusModule } from './CourseSyllabusModule';

export function CourseSyllabus({ syllabus }: { syllabus: CourseDetailData['syllabus'] }) {
  const [expandedModuleIds, setExpandedModuleIds] = useState<Set<string>>(
    () => new Set(syllabus.modules[0] ? [syllabus.modules[0].id] : []),
  );
  const allExpanded =
    syllabus.modules.length > 0 && expandedModuleIds.size === syllabus.modules.length;

  const toggleModule = (moduleId: string) => {
    setExpandedModuleIds((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const toggleAllModules = () => {
    setExpandedModuleIds(
      allExpanded ? new Set() : new Set(syllabus.modules.map((module) => module.id)),
    );
  };

  return (
    <section className="shadow-soft rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="mb-6 flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800 sm:text-xl">Nội dung khóa học</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {syllabus.moduleCount} chương • {syllabus.lessonCount} bài học • Tổng thời lượng{' '}
            {syllabus.duration}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleAllModules}
          aria-label={allExpanded ? 'Thu gọn tất cả chương' : 'Mở rộng tất cả chương'}
          className="self-start rounded text-xs font-semibold text-brand-blue hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue sm:self-auto sm:text-sm"
        >
          {allExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
        </button>
      </div>
      <div className="space-y-3.5">
        {syllabus.modules.map((module) => (
          <CourseSyllabusModule
            key={module.id}
            module={module}
            expanded={expandedModuleIds.has(module.id)}
            onToggle={() => toggleModule(module.id)}
          />
        ))}
      </div>
    </section>
  );
}
