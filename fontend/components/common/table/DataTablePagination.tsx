'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface DataTablePaginationProps {
  page: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

type PageItem = number | '...';

function getPageNumbers(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  if (page >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, '...', page - 1, page, page + 1, '...', totalPages];
}

export function DataTablePagination({ page, totalPages, onPageChange }: DataTablePaginationProps) {
  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-end gap-1 border-t border-slate-100 pt-4">
      {/* Previous */}
      <Button
        type="button"
        size="icon"
        className="h-8 w-8 border-0 bg-black text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500"
        disabled={page <= 1}
        onClick={() => onPageChange?.(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Pages */}
      {pages.map((item, index) => {
        if (item === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="flex h-8 w-8 items-center justify-center text-sm text-slate-400"
            >
              ...
            </span>
          );
        }

        const isActive = item === page;

        return (
          <Button
            key={item}
            type="button"
            size="icon"
            className={
              isActive
                ? 'h-8 w-8 border-0 bg-black text-sm text-white hover:bg-slate-800'
                : 'h-8 w-8 border border-slate-200 bg-white text-sm text-black hover:bg-slate-100'
            }
            onClick={() => onPageChange?.(item)}
            aria-label={`Page ${item}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {item}
          </Button>
        );
      })}

      {/* Next */}
      <Button
        type="button"
        size="icon"
        className="h-8 w-8 border-0 bg-black text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500"
        disabled={page >= totalPages}
        onClick={() => onPageChange?.(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
