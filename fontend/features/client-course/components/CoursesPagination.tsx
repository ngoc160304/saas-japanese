import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCoursesPaginationItems } from '../utils/course-list-query';

interface CoursesPaginationProps {
  page: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  onPageChange: (page: number) => void;
}

const buttonClassName =
  'flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-white disabled:text-slate-300';

export function CoursesPagination({
  page,
  totalPages,
  first,
  last,
  onPageChange,
}: CoursesPaginationProps) {
  if (totalPages <= 1) return null;
  const items = getCoursesPaginationItems(page, totalPages);

  return (
    <nav aria-label="Phân trang khóa học" className="mb-12 flex justify-center">
      <ul className="inline-flex items-center gap-1">
        <li>
          <button
            type="button"
            aria-label="Trang trước"
            disabled={first}
            onClick={() => onPageChange(page - 1)}
            className={`${buttonClassName} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        </li>
        {items.map((item, index) =>
          item === 'ellipsis' ? (
            <li
              key={`ellipsis-${index}`}
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center text-sm text-slate-400"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                aria-label={`Trang ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onPageChange(item)}
                className={`${buttonClassName} ${
                  item === page
                    ? 'border-brand-blue bg-brand-blue text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            aria-label="Trang tiếp theo"
            disabled={last}
            onClick={() => onPageChange(page + 1)}
            className={`${buttonClassName} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
