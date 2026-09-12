import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface PageSectionProps {
  children: ReactNode;
  className?: string;
}

export default function PageSection({ children, className }: PageSectionProps) {
  return (
    <section
      className={cn(
        'bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-soft',
        className,
      )}
    >
      {children}
    </section>
  );
}
