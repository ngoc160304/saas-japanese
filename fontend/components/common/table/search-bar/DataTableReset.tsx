'use client';

import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface DataTableResetProps {
  onReset?: () => void;
  label?: string;
}

export function DataTableReset({ onReset, label = 'Reset' }: DataTableResetProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onReset}
      className="
        h-10
        rounded-2xl
        border-slate-200
        bg-white
        px-3
        text-xs
        font-semibold
        text-slate-500
        hover:bg-slate-50
        hover:text-slate-800
      "
    >
      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
