import { Badge } from '@/components/ui/badge';
import type { ReactNode } from 'react';

export interface StatCardItemProps {
  label: string;
  value: string | number;
  description?: string;
  valueClassName?: string;
  descriptionClassName?: string;
  icon?: ReactNode;
}

export function StatCardItem({
  label,
  value,
  description,
  valueClassName = 'text-slate-900',
  descriptionClassName = 'text-slate-600 bg-slate-50',
  icon,
}: StatCardItemProps) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-soft shadow-hover">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400">{label}</p>

        {icon}
      </div>

      <p className={`text-2xl lg:text-3xl font-extrabold mt-1 ${valueClassName}`}>{value}</p>

      {description && (
        <Badge
          variant="outline"
          className={`text-[10px] font-bold px-2 py-0.5 mt-2 ${descriptionClassName}`}
        >
          {description}
        </Badge>
      )}
    </div>
  );
}
