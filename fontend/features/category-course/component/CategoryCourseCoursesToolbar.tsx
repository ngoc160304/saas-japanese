'use client';

import type { ReactNode } from 'react';
import { DataTableReset } from '@/components/common/table/search-bar/DataTableReset';
import { DataTableSearch } from '@/components/common/table/search-bar/DataTableSearch';

interface CategoryCourseCoursesToolbarProps {
  totalCourses?: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
  children: ReactNode;
}

export function CategoryCourseCoursesToolbar({
  totalCourses,
  searchValue,
  onSearchChange,
  onReset,
  children,
}: CategoryCourseCoursesToolbarProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center">
      {/* <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-bold text-slate-900">Khóa học trong danh mục</h2>
        {totalCourses !== undefined && (
          <span className="text-xs font-bold text-slate-400">{totalCourses} khóa học</span>
        )}
      </div> */}

      <div className="flex flex-wrap items-center gap-2">
        <DataTableSearch
          className="min-w-[220px] flex-1 sm:flex-initial"
          value={searchValue}
          onChange={onSearchChange}
          placeholder="Tìm theo tên khóa học…"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <DataTableReset onReset={onReset} />
      </div>
    </div>
  );
}
