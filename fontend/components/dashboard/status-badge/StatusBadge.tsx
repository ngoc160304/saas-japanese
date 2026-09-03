import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Status = 'active' | 'draft';

interface StatusBadgeProps {
  status: Status;
  label?: string;
  className?: string;
}

const statusStyles: Record<Status, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100 [&>span]:bg-emerald-500',

  draft: 'bg-amber-50 text-amber-700 border-amber-100 [&>span]:bg-amber-500',
};

const defaultLabels: Record<Status, string> = {
  active: 'Active',
  draft: 'Draft',
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold',
        statusStyles[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" />
      {label ?? defaultLabels[status]}
    </Badge>
  );
}
