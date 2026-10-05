import { RotateCcw, Search } from 'lucide-react';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

export function CourseToolbar({
  search,
  onSearchChange,
  onReset,
}: Props) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-center">
      <label className="relative max-w-md flex-1">
        <span className="sr-only">Search my courses by title</span>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search my courses by title…"
          className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-500"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Clear search
        </button>
      </div>
    </div>
  );
}
