import { Badge } from '@/components/ui/badge';
import type { ReactNode } from 'react';
import { CountUp, type NumberFormatProps } from './CountUp';

export interface StatCardItemProps extends NumberFormatProps {
  label: string;
  value: string | number;
  description?: string;
  valueClassName?: string;
  descriptionClassName?: string;
  icon?: ReactNode;
  animate?: boolean;
}

export function StatCardItem({
  label,
  value,
  description,
  valueClassName = 'text-slate-900',
  descriptionClassName = 'text-slate-600 bg-slate-50',
  icon,
  animate = false,
  locale = 'vi-VN',
  formatOptions,
  prefix = '',
  suffix = '',
}: StatCardItemProps) {
  return (
    <div className="min-w-0 bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-600">{label}</p>

        {icon}
      </div>

      <p className={`break-words text-2xl lg:text-3xl font-extrabold tabular-nums mt-1 ${valueClassName}`}>
        {typeof value === 'number' ? (
          animate ? <CountUp value={value} locale={locale} formatOptions={formatOptions} prefix={prefix} suffix={suffix} />
            : `${prefix}${new Intl.NumberFormat(locale, formatOptions ?? { maximumFractionDigits: 0 }).format(value)}${suffix}`
        ) : value}
      </p>

      {description && (
        <Badge
          variant="outline"
          className={`h-auto max-w-full whitespace-normal text-xs font-medium px-2 py-0.5 mt-2 ${descriptionClassName}`}
        >
          {description}
        </Badge>
      )}
    </div>
  );
}
