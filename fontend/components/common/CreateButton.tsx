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
      <Button className="gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-sky-600 hover:shadow-md md:text-sm">
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        <span>{label}</span>
      </Button>
    </Link>
  );
}
