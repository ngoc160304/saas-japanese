import { BookOpen } from 'lucide-react';
import type { JlptExamSummary } from '@/apis/jlpt-exams/jlpt-exams.type';
import { JlptExamCard } from './JlptExamCard';

export function JlptExamGrid({ exams }: { exams: JlptExamSummary[] }) {
  if (exams.length === 0) {
    return (
      <section aria-live="polite" className="rounded-3xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-3xl bg-sky-50 text-sky-600"><BookOpen aria-hidden="true" className="size-7" /></div>
        <h2 className="text-base font-bold text-slate-800">No JLPT examinations found</h2>
        <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">Try adjusting your search terms or selecting a different JLPT level filter.</p>
      </section>
    );
  }

  return (
    <section aria-label="JLPT practice exams" aria-live="polite" className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {exams.map((exam) => <JlptExamCard key={exam.id} exam={exam} />)}
    </section>
  );
}
