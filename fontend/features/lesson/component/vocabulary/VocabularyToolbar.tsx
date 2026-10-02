import { Plus, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface VocabularyToolbarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  partOfSpeech: string;
  onPartOfSpeechChange: (value: string) => void;
  partOfSpeechOptions: readonly string[];
  onReset: () => void;
  hasFilters: boolean;
}

export function VocabularyToolbar({
  searchTerm,
  onSearchTermChange,
  partOfSpeech,
  onPartOfSpeechChange,
  partOfSpeechOptions,
  onReset,
  hasFilters,
}: VocabularyToolbarProps) {
  return (
    <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center 2xl:w-auto">
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
      <label htmlFor="vocabulary-part-of-speech" className="sr-only">
        Part of speech
      </label>
      <select
        id="vocabulary-part-of-speech"
        value={partOfSpeech}
        onChange={(event) => onPartOfSpeechChange(event.target.value)}
        className="h-9 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-800 focus-visible:outline-2 focus-visible:outline-sky-500 sm:w-44"
      >
        <option value="">All parts of speech</option>
        {partOfSpeechOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="outline"
        onClick={onReset}
        disabled={!hasFilters}
        className="h-9 rounded-2xl border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Reset
      </Button>
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
