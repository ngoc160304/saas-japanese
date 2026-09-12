import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ICreateButtonProps {
  href: string;
  label?: string;
}

export function CreateButton(props: ICreateButtonProps) {
  const { href, label = 'Create' } = props;
  return (
    <Link href={href}>
      <Button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-sky-600 text-white font-bold text-xs shadow-sm transition-all cursor-pointer h-auto">
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        <span>Add New Category</span>
      </Button>
    </Link>
  );
}
