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
      type="button"
      nativeButton={!href}
      render={href ? <Link href={href} /> : undefined}
      className="h-10 rounded-xl px-4 text-sm font-semibold shadow-sm"
      onClick={handleClick}
    >
      <Plus className="size-4" aria-hidden="true" />
      <span>{label}</span>
    </Button>
  );
}
