import { BookOpen, Headphones, Pencil, Tags } from 'lucide-react';
import type { ExamSection, SectionResult } from '../types';

const sections: Array<{ key: ExamSection; label: string; Icon: typeof Tags }> = [
  { key: 'vocabulary', label: 'Vocabulary', Icon: Tags },
  { key: 'grammar', label: 'Grammar', Icon: Pencil },
  { key: 'reading', label: 'Reading', Icon: BookOpen },
  { key: 'listening', label: 'Listening', Icon: Headphones },
];

export function JlptExamSectionSummary({ results }: { results: Record<ExamSection, SectionResult> }) {
  return (
    <div className="mb-6 space-y-2.5 rounded-xl bg-slate-50 p-3">
      {sections.map(({ key, label, Icon }) => (
        <div key={key} className="flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-2 font-medium text-slate-600"><Icon aria-hidden="true" className="size-3.5" />{label}</span>
          <span className={`font-mono ${results[key].earned === null ? 'text-slate-400' : 'font-bold text-slate-700'}`}>
            {results[key].earned === null ? '__' : results[key].earned} / {results[key].total}
          </span>
        </div>
      ))}
    </div>
  );
}
