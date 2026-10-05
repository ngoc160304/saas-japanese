'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { clientCoursesAPI, clientCoursesQueryKeys } from '@/apis/courses/client-courses.api';
import { CoursesPagination } from '@/features/client-course/components/CoursesPagination';
import { getApiErrorMessage } from '@/lib/api-error';
import { selectCurrentUser } from '@/store/authSlice';
import { useAppSelector } from '@/store/hooks';
import { useMyCoursesUrlState } from '../hooks/useMyCoursesUrlState';
import { toMyCoursesQuery } from '../utils/my-courses-query';
import { CourseCard } from './CourseCard';
import { CourseToolbar } from './CourseToolbar';

export function StudentCoursesPage() {
  const userId = useAppSelector(selectCurrentUser)?.id;
  const { state, searchText, setSearch, setPage, reset } = useMyCoursesUrlState();
  const params = useMemo(() => toMyCoursesQuery(state), [state]);
  const query = useQuery({
    queryKey: clientCoursesQueryKeys.myCoursesPage(userId ?? 0, params),
    queryFn: ({ signal }) => clientCoursesAPI.getMyCourses(params, signal),
    enabled: userId !== undefined,
    retry: false,
  });
  const data = query.data;

  useEffect(() => {
    if (!data || query.isError) return;
    if (data.totalPages === 0 && state.page !== 1) setPage(1, 'replace');
    else if (data.totalPages > 0 && state.page > data.totalPages)
      setPage(data.totalPages, 'replace');
  }, [data, query.isError, setPage, state.page]);

  return (
    <div className="min-w-0">
      <header className="mb-6">
        <nav
          aria-label="Breadcrumb"
          className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-400"
        >
          <Link href="/student/dashboard" className="hover:text-slate-600">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-slate-800">
            My Courses
          </span>
        </nav>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
          My Courses
        </h1>
        <p className="mt-0.5 text-sm font-medium text-slate-500">
          Continue learning from the courses you have enrolled in.
        </p>
      </header>

      <section
        aria-label="My Courses"
        className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft md:p-6"
      >
        <CourseToolbar
          search={searchText}
          onSearchChange={setSearch}
          onReset={reset}
        />
        {query.isError ? (
          <div role="alert" className="py-12 text-center">
            <p className="text-sm font-semibold text-slate-800">
              {getApiErrorMessage(query.error)}
            </p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {query.isFetching ? 'Retrying…' : 'Retry'}
            </button>
          </div>
        ) : !data ? (
          <div
            role="status"
            aria-busy="true"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-80 animate-pulse rounded-3xl bg-slate-100" />
            ))}
            <span className="sr-only">Loading my courses…</span>
          </div>
        ) : data.content.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-bold text-slate-800">
              {state.courseTitle ? 'No courses match your search' : 'You have no enrolled courses yet'}
            </p>
            {state.courseTitle ? (
              <>
                <p className="mt-1 text-xs text-slate-500">Try another course title.</p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
                >
                  Clear search
                </button>
              </>
            ) : (
              <Link href="/courses" className="mt-4 inline-block text-xs font-bold text-sky-600 hover:underline">
                Browse courses
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.content.map((enrollment) => (
              <CourseCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        )}
        {data && !query.isError && (
          <footer className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p aria-live="polite">
              Showing {data.numberOfElements === 0 ? 0 : data.number * data.size + 1}–
              {data.number * data.size + data.numberOfElements} of {data.totalElements} enrolled courses
            </p>
            <CoursesPagination
              page={data.number + 1}
              totalPages={data.totalPages}
              first={data.first}
              last={data.last}
              onPageChange={setPage}
            />
          </footer>
        )}
      </section>
    </div>
  );
}
