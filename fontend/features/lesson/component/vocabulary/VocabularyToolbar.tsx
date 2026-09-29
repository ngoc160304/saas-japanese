import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface VocabularyToolbarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

export function VocabularyToolbar({ searchTerm, onSearchTermChange }: VocabularyToolbarProps) {
  return (
    <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
      <div className="relative w-full sm:w-60">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          aria-label="Search vocabulary"
          placeholder="Search vocab..."
          className="h-9 rounded-2xl border-slate-200 bg-slate-50 pr-3 pl-8 text-xs font-medium text-slate-800 md:text-xs"
        />
      </div>
      <Button
        type="button"
        className="h-10 justify-center rounded-2xl bg-slate-900 px-4 text-xs font-bold text-white shadow-2xs hover:bg-sky-600"
      >
        <Plus className="size-4" aria-hidden="true" />
        Add Vocabulary
      </Button>
    </div>
  );
}
