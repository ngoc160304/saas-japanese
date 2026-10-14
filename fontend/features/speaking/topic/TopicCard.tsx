import { MessageCircle } from 'lucide-react';

interface TopicCardProps {
  title: string;
  description: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}

export default function TopicCard({
  title,
  description,
  selected,
  disabled,
  onClick,
}: TopicCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
      className={`flex h-full items-start gap-4 rounded-2xl border p-5 text-left shadow-soft transition-colors focus-visible:outline-2 focus-visible:outline-sky-500 disabled:opacity-60 ${selected ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-200' : 'border-slate-200 bg-white hover:border-sky-300'}`}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-primary">
        <MessageCircle className="size-6" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block break-words text-base font-semibold text-slate-900">{title}</span>
        <span className="mt-1 block break-words text-sm leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </button>
  );
}
