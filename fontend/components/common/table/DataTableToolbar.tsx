'use client';

import type { ReactNode } from 'react';
import { DataTableSearch } from './search-bar/DataTableSearch';
import { DataTableReset } from './search-bar/DataTableReset';

interface DataTableToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  children?: ReactNode;

  onReset?: () => void;
  showReset?: boolean;
}

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  children,
  onReset,
  showReset = true,
}: DataTableToolbarProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-center">
      <DataTableSearch
        value={searchValue ?? ''}
        onChange={onSearchChange ?? (() => {})}
        placeholder={searchPlaceholder}
      />

      <div className="flex flex-wrap items-center gap-2.5">
        {children}

        {showReset && <DataTableReset />}
      </div>
    </div>
  );
}
