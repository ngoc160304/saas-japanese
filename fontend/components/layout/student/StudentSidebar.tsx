'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  House,
  MessageCircle,
  Settings,
  Tags,
  TrendingUp,
} from 'lucide-react';
import SideBar, { type ISidebarItem } from '@/components/layout/management/sidebar/SideBar';

const iconClass = 'h-5 w-5 text-slate-400 group-hover:text-slate-700';
const studentItems: ISidebarItem[] = [
  {
    title: 'Overview',
    href: '/student/dashboard',
    icon: <House className={iconClass} aria-hidden="true" />,
  },
  { title: 'Courses', icon: <BookOpen className={iconClass} aria-hidden="true" /> },
  { title: 'Category', icon: <Tags className={iconClass} aria-hidden="true" /> },
  { title: 'JLPT Exams', icon: <GraduationCap className={iconClass} aria-hidden="true" /> },
  { title: 'Analytics', icon: <TrendingUp className={iconClass} aria-hidden="true" /> },
  { title: 'Flashcards', icon: <MessageCircle className={iconClass} aria-hidden="true" /> },
  { title: 'Settings', icon: <Settings className={iconClass} aria-hidden="true" /> },
];

export function StudentSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  return (
    <SideBar
      role="Student"
      title="Studify"
      sectionLabel="Main Menu"
      sidebarItems={studentItems}
      mobileMenuOpen={isOpen}
      mobileMenuButton={
        <button
          type="button"
          className="xl:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-controls="navMenu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" d="M5 5l14 14M19 5L5 19" />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      }
    />
  );
}
