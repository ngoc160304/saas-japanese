import { RotateCcw, Search } from 'lucide-react';
import type { CoursesPricing, CoursesSort } from '../utils/course-list-query';

const selectClassName =
  'block w-full cursor-pointer rounded-lg border border-slate-200 bg-white py-2.5 pr-8 pl-3 text-sm font-medium text-slate-700 transition-colors focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue sm:w-auto';

interface CoursesToolbarProps {
  search: string;
  pricing: CoursesPricing;
  sort: CoursesSort;
  onSearchChange: (value: string) => void;
  onPricingChange: (value: CoursesPricing) => void;
  onSortChange: (value: CoursesSort) => void;
  onReset: () => void;
}

function isCoursesPricing(value: string): value is CoursesPricing {
  return value === 'all' || value === 'free' || value === 'paid';
}

function isCoursesSort(value: string): value is CoursesSort {
  return value === 'newest' || value === 'price-asc' || value === 'price-desc';
}

export function CoursesToolbar({
  search,
  pricing,
  sort,
  onSearchChange,
  onPricingChange,
  onSortChange,
  onReset,
}: CoursesToolbarProps) {
  return (
    <section
      aria-label="Tìm kiếm, lọc và sắp xếp khóa học"
      className="shadow-soft mb-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 lg:flex-row"
    >
      <div className="relative w-full shrink-0 lg:w-1/3">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400"
        />
        <label htmlFor="course-title-search" className="sr-only">
          Tìm kiếm tên khóa học
        </label>
        <input
          id="course-title-search"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm kiếm tên khóa học..."
          autoComplete="off"
          className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-10 text-sm leading-5 text-slate-800 transition-colors placeholder:text-slate-400 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
      </div>

      <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:flex-nowrap">
        <div className="w-full sm:w-auto">
          <label htmlFor="course-pricing" className="sr-only">
            Lọc theo giá
          </label>
          <select
            id="course-pricing"
            value={pricing}
            onChange={(event) => {
              if (isCoursesPricing(event.target.value)) onPricingChange(event.target.value);
            }}
            className={`${selectClassName} sm:w-36`}
          >
            <option value="all">Mọi mức giá</option>
            <option value="free">Miễn phí</option>
            <option value="paid">Trả phí</option>
          </select>
        </div>

        <div aria-hidden="true" className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

        <div className="w-full sm:w-auto">
          <label htmlFor="course-sort" className="sr-only">
            Sắp xếp khóa học
          </label>
          <select
            id="course-sort"
            value={sort}
            onChange={(event) => {
              if (isCoursesSort(event.target.value)) onSortChange(event.target.value);
            }}
            className={`${selectClassName} sm:w-48`}
          >
            <option value="newest">Mới nhất</option>
            <option value="price-asc">Giá: Thấp đến cao</option>
            <option value="price-desc">Giá: Cao đến thấp</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="flex w-full items-center justify-center gap-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue sm:w-auto"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Đặt lại
        </button>
      </div>
    </section>
  );
}
