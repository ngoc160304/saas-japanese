import type { KanjiItem } from '@/apis/lessons/lesson-content.api';
import { KanjiCard } from './KanjiCard';

interface KanjiListProps {
  items: readonly KanjiItem[];
  emptyMessage: string;
  onEdit: (item: KanjiItem) => void;
  onDelete: (item: KanjiItem) => void;
}

export function KanjiList({ items, emptyMessage, onEdit, onDelete }: KanjiListProps) {
  if (items.length === 0)
    return <p className="py-10 text-center text-xs text-slate-500">{emptyMessage}</p>;

  return (
    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
      {items.map((item) => (
        <KanjiCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
