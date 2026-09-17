import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ICreateButtonProps {
  href?: string;
  label?: string;
  handleClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function CreateButton(props: ICreateButtonProps) {
  const { href, label = 'Create', handleClick } = props;

  return (
    <Button
      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-sky-600 text-white font-bold text-xs shadow-sm transition-all cursor-pointer h-auto"
      onClick={handleClick}
    >
      {href ? (
        <Link href={href}>
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span>{label}</span>
        </Link>
      ) : (
        <>
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span>{label}</span>
        </>
      )}
    </Button>
  );
}
