'use client';

import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DataTableSearchProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DataTableSearch({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: DataTableSearchProps) {
  return (
    <div className={cn('relative w-full max-w-md', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

      <Input
        value={value}
        // onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="
          h-10
          rounded-2xl
          border-slate-100
          bg-slate-50
          pl-10
          pr-4
          text-xs
          text-slate-800
          placeholder:text-slate-400
          focus-visible:bg-white
          focus-visible:ring-2
          focus-visible:ring-sky-500
          md:text-sm
        "
      />
    </div>
  );
}
