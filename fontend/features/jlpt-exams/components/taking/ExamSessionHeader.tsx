import { Clock3, Menu } from 'lucide-react';

interface ExamSessionHeaderProps {
  title: string;
  remainingSeconds: number;
  navigationOpen: boolean;
  onToggleNavigation: () => void;
  onExit: () => void;
}

export function ExamSessionHeader({ title, remainingSeconds, navigationOpen, onToggleNavigation, onExit }: ExamSessionHeaderProps) {
  const hours = String(Math.floor(remainingSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(remainingSeconds % 60).padStart(2, '0');

  return (
    <header className="z-20 flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" aria-label={navigationOpen ? 'Close question navigation' : 'Open question navigation'} aria-controls="exam-navigation" aria-expanded={navigationOpen} onClick={onToggleNavigation} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-sky-500 md:hidden">
          <Menu aria-hidden="true" className="size-5" />
        </button>
        <h1 className="truncate text-xs font-bold tracking-wide text-slate-900 uppercase sm:text-sm">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <div role="timer" aria-label="Time remaining" className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 font-mono text-xs font-extrabold text-slate-800 shadow-sm sm:gap-1.5 sm:px-3 sm:text-sm">
          <Clock3 aria-hidden="true" className="size-3.5" />
          <span>{hours}:{minutes}:{seconds}</span>
        </div>
        <button type="button" onClick={onExit} className="rounded-xl p-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-sky-500">Exit</button>
      </div>
    </header>
  );
}
