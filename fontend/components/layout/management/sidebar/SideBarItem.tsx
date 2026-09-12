'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface SideBarItemProps {
  icon: ReactNode;
  title: string;
  href: string;
}

const SideBarItem = ({ icon, title, href }: SideBarItemProps) => {
  const pathname = usePathname();

  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  console.log('isActive', isActive);
  console.log('href', href);
  console.log('pathname', pathname);
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3.5
        px-4 py-3
        rounded-2xl
        font-medium text-sm
        transition-all
        group
        ${isActive ? 'bg-slate-100 text-slate-900 ring-2 ring-sky-500' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
      `}
    >
      {icon}
      <span>{title}</span>
    </Link>
  );
};

export default SideBarItem;
