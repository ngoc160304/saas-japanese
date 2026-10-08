import { Search } from 'lucide-react';
import type { JlptLevel } from '../types';

const levelOptions: Array<{ label: string; value: JlptLevel | null }> = [
  { label: 'All Levels', value: null },
  { label: 'N5', value: 'N5' },
  { label: 'N4', value: 'N4' },
  { label: 'N3', value: 'N3' },
  { label: 'N2', value: 'N2' },
  { label: 'N1', value: 'N1' },
];

interface JlptExamsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  level: JlptLevel | null;
  onLevelChange: (value: JlptLevel | null) => void;
}

export function JlptExamsToolbar({ search, onSearchChange, level, onLevelChange }: JlptExamsToolbarProps) {
  return (
    <section aria-label="Filter exams" className="mb-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1 md:max-w-md">
          <label htmlFor="exam-search" className="sr-only">Search exams by title, level, or year</label>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
          <input id="exam-search" type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search exams by title, level, or year..." className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-2.5 pr-4 pl-10 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 md:text-sm" />
        </div>
        <div role="group" aria-label="JLPT level" className="flex max-w-full items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {levelOptions.map((option) => (
            <button key={option.label} type="button" aria-pressed={level === option.value} onClick={() => onLevelChange(option.value)} className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-sky-500 ${level === option.value ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
