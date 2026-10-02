import type { KanjiItem } from '@/apis/lessons/lesson-content.api';
import { KanjiCard } from './KanjiCard';

interface KanjiListProps {
  items: readonly KanjiItem[];
  emptyMessage: string;
}

export function KanjiList({ items, emptyMessage }: KanjiListProps) {
  if (items.length === 0)
    return <p className="py-10 text-center text-xs text-slate-500">{emptyMessage}</p>;

  return (
    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
      {items.map((item) => (
        <KanjiCard key={item.id} item={item} />
      ))}
    </div>
  );
}
