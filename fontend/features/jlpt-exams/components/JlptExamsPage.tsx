'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { mockExams } from '../mock-data';
import type { JlptLevel } from '../types';
import { JlptExamsHeader } from './JlptExamsHeader';
import { JlptExamsToolbar } from './JlptExamsToolbar';
import { JlptExamGrid } from './JlptExamGrid';

export function JlptExamsPage() {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<JlptLevel | null>(null);
  const query = search.trim().toLocaleLowerCase();
  const visibleExams = mockExams.filter((exam) =>
    (level === null || exam.level === level) &&
    (query === '' || `${exam.title} ${exam.level} ${exam.year}`.toLocaleLowerCase().includes(query)),
  );
  const showComingSoon = () => toast.info('Coming soon');

  return (
    <div className="mx-auto w-full max-w-7xl">
      <JlptExamsHeader onHistoryClick={showComingSoon} />
      <JlptExamsToolbar search={search} onSearchChange={setSearch} level={level} onLevelChange={setLevel} />
      <JlptExamGrid exams={visibleExams} onViewTest={showComingSoon} />
    </div>
  );
}
