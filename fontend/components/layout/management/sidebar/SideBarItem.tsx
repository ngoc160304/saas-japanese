'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface SideBarItemProps {
  icon: ReactNode;
  title: string;
  href?: string;
  activePaths?: readonly string[];
}

const SideBarItem = ({ icon, title, href, activePaths = [] }: SideBarItemProps) => {
  const pathname = usePathname();

  const isActive = href ? [href, ...activePaths].some((path) => pathname === path || pathname.startsWith(`${path}/`)) : false;
  const className = `
        flex items-center gap-3.5
        px-4 py-3
        rounded-2xl
        font-medium text-sm
        transition-all
        group
        ${isActive ? 'bg-slate-100 text-slate-900 ring-2 ring-sky-500' : href ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-50' : 'text-slate-500'}
      `;
  if (!href) {
    return (
      <span className={className} aria-disabled="true">
        {icon}
        <span>{title}</span>
      </span>
    );
  }
  return (
    <Link href={href} aria-current={pathname === href ? 'page' : isActive ? 'location' : undefined} className={className}>
      {icon}
      <span>{title}</span>
    </Link>
  );
};

export default SideBarItem;
