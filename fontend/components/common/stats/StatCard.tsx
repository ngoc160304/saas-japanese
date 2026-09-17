import type { StatCardItemProps } from './StatCardItem';
import { StatCardItem } from './StatCardItem';

interface StatCardProps {
  items: StatCardItemProps[];
  className?: string;
}

export function StatCard({ items, className = '' }: StatCardProps) {
  return (
    <section className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 ${className}`}>
      {items.map((item, index) => (
        <StatCardItem key={`${item.label}-${index}`} {...item} />
      ))}
    </section>
  );
}
