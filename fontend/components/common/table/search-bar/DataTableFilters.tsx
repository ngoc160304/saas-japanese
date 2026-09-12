'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataTableFilterOption {
  label: string;
  value: string;
}

interface DataTableFilterProps {
  value?: string;
  onChange?: (value: string) => void;
  options: DataTableFilterOption[];
  placeholder?: string;
  className?: string;
}

export function DataTableFilter({
  value,
  onChange,
  options,
  placeholder = 'ALL',
  className,
}: DataTableFilterProps) {
  return (
    <Select
      items={options}
      // onValueChange={onChange}
    >
      <SelectTrigger
        className={[
          'h-10',
          'w-auto',
          'rounded-2xl',
          'border-slate-100',
          'bg-slate-50',
          'px-3.5',
          'text-xs',
          'font-semibold',
          'text-slate-700',
          'shadow-none',
          'outline-none',
          'cursor-pointer',
          'focus:ring-2',
          'focus:ring-sky-500',
          'focus:ring-offset-0',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <SelectValue placeholder={options[0].label} />
      </SelectTrigger>

      <SelectContent alignItemWithTrigger={false} className="bg-white">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-xs font-semibold">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
