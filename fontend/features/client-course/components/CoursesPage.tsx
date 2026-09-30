'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientCoursesAPI, clientCoursesQueryKeys } from '@/apis/courses/client-courses.api';
import { useCoursesUrlState } from '../hooks/useCoursesUrlState';
import { toClientCoursesQuery } from '../utils/course-list-query';
import { CoursesGrid, CoursesResultsFallback } from './CoursesGrid';
import { CoursesPagination } from './CoursesPagination';
import { CoursesToolbar } from './CoursesToolbar';

export function CoursesPage() {
  const { state, searchText, setSearch, setPricing, setSort, setPage, reset } =
    useCoursesUrlState();
  const queryParams = useMemo(() => toClientCoursesQuery(state), [state]);
  const coursesQuery = useQuery({
    queryKey: clientCoursesQueryKeys.list(queryParams),
    queryFn: ({ signal }) => clientCoursesAPI.getClientCourses(queryParams, signal),
    retry: false,
  });
  const pageData = coursesQuery.data;

  useEffect(() => {
    if (!pageData) return;
    if (pageData.totalPages === 0 && state.page !== 1) {
      setPage(1, 'replace');
      return;
    }
    if (pageData.totalPages > 0 && state.page > pageData.totalPages) {
      setPage(pageData.totalPages, 'replace');
    }
  }, [pageData, setPage, state.page]);

  const currentPage = pageData ? pageData.number + 1 : state.page;
  const rangeStart =
    pageData && pageData.numberOfElements > 0 ? pageData.number * pageData.size + 1 : 0;
  const rangeEnd = pageData ? rangeStart + pageData.numberOfElements - (rangeStart ? 1 : 0) : 0;

  const changePage = (page: number) => {
    setPage(page);
    window.requestAnimationFrame(() => {
      document
        .getElementById('courses-results')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
      <CoursesToolbar
        search={searchText}
        pricing={state.pricing}
        sort={state.sort}
        onSearchChange={setSearch}
        onPricingChange={setPricing}
        onSortChange={setSort}
        onReset={reset}
      />

      <section
        id="courses-results"
        aria-labelledby="courses-results-title"
        className="scroll-mt-28"
      >
        <h2 id="courses-results-title" className="sr-only">
          Kết quả khóa học
        </h2>
        <div className="mb-6 flex min-h-5 items-center justify-between" aria-live="polite">
          {pageData ? (
            <p className="text-sm font-medium text-slate-600">
              Hiển thị{' '}
              <span className="font-bold text-slate-800">
                {rangeStart > 0 ? `${rangeStart}–${rangeEnd} / ` : ''}
                {pageData.totalElements}
              </span>{' '}
              khóa học
            </p>
          ) : coursesQuery.isPending ? (
            <p className="text-sm font-medium text-slate-500">Đang tải khóa học…</p>
          ) : null}
        </div>

        <CoursesGrid
          courses={pageData?.content ?? []}
          loading={coursesQuery.isPending}
          fetching={coursesQuery.isFetching && !coursesQuery.isPending}
          error={coursesQuery.isError}
          retrying={coursesQuery.isFetching}
          skeletonCount={state.size}
          onRetry={() => void coursesQuery.refetch()}
          onReset={reset}
        />

        {pageData && !coursesQuery.isError && pageData.content.length > 0 && (
          <CoursesPagination
            page={currentPage}
            totalPages={pageData.totalPages}
            first={pageData.first}
            last={pageData.last}
            onPageChange={changePage}
          />
        )}
      </section>
    </div>
  );
}

export function CoursesPageFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
      <div className="shadow-soft mb-8 h-36 animate-pulse rounded-2xl border border-slate-200 bg-white sm:h-20" />
      <p className="mb-6 text-sm font-medium text-slate-500">Đang tải khóa học…</p>
      <CoursesResultsFallback />
    </div>
  );
}
