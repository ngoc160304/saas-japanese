'use client';

import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AuthFieldProps extends ComponentProps<'input'> {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
}

export function AuthField({
  id,
  label,
  icon: Icon,
  error,
  type,
  required,
  ...props
}: AuthFieldProps) {
  const [visible, setVisible] = useState(false);
  const password = type === 'password';
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-rose-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <Input
          {...props}
          id={id}
          type={password && visible ? 'text' : type}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-11 rounded-2xl border-slate-200 bg-slate-50/80 pr-11 pl-10 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus-visible:border-sky-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-sky-500/40 aria-invalid:border-rose-400 aria-invalid:bg-rose-50 aria-invalid:ring-rose-400/20 dark:bg-slate-50/80"
        />
        {password && (
          <button
            type="button"
            disabled={props.disabled}
            onClick={() => setVisible(!visible)}
            aria-label={`${visible ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-2xl text-slate-400 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-sky-500"
          >
            {visible ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-rose-600" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
