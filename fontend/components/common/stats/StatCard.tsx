import { StatCardItem, type StatCardItemProps } from './StatCardItem';

interface StatCardProps {
  items: readonly StatCardItemProps[];
  className?: string;
  isMock?: boolean;
}

export function StatCard({ items, className = '', isMock = false }: StatCardProps) {
  return (
    <section className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 ${className}`}>
      {isMock && <p className="col-span-full text-xs font-medium text-slate-600">Dữ liệu mẫu</p>}
      {items.map((item, index) => (
        <StatCardItem key={`${item.label}-${index}`} animate={isMock} {...item} />
      ))}
    </section>
  );
}
