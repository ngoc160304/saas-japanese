'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { cartAPI, cartQueryKeys } from '@/apis/cart/cart.api';
import { clientCoursesAPI, clientCoursesQueryKeys } from '@/apis/courses/client-courses.api';
import { getApiError, getApiErrorMessage } from '@/lib/api-error';
import { formatCoursePrice } from '@/features/course/utils/course-format';
import { selectCurrentUser } from '@/store/authSlice';
import { useAppSelector } from '@/store/hooks';
import { useCourseEnrollment } from '../hooks/useCourseEnrollment';
import { LessonList } from './LessonList';

export function StudentCourseDetail({ courseId }: { courseId: number }) {
  const userId = useAppSelector(selectCurrentUser)?.id;
  const courseQuery = useQuery({
    queryKey: clientCoursesQueryKeys.detail(courseId),
    queryFn: ({ signal }) => clientCoursesAPI.getDetail(courseId, signal),
    retry: false,
  });
  const course = courseQuery.data?.id === courseId ? courseQuery.data : undefined;
  const lessonsQuery = useQuery({
    queryKey: clientCoursesQueryKeys.lessons(courseId),
    queryFn: ({ signal }) => clientCoursesAPI.getLessons(courseId, signal),
    enabled: Boolean(course),
    retry: false,
  });
  const enrollmentsQuery = useQuery({
    queryKey: clientCoursesQueryKeys.enrollments(userId ?? 0),
    queryFn: ({ signal }) => clientCoursesAPI.getAllMyCourseIds(signal),
    enabled: userId !== undefined && Boolean(course),
    retry: false,
  });
  const cartQuery = useQuery({
    queryKey: cartQueryKeys.detail,
    queryFn: cartAPI.getCurrent,
    enabled: userId !== undefined && Boolean(course && course.price > 0),
    retry: false,
  });
  const action = useCourseEnrollment(courseId);
  const unavailable =
    (courseQuery.isError && getApiError(courseQuery.error).status === 404) ||
    (lessonsQuery.isError && getApiError(lessonsQuery.error).status === 404);

  if (courseQuery.isPending)
    return (
      <div role="status" className="rounded-3xl bg-white p-8 text-sm text-slate-500">
        Loading course…
      </div>
    );
  if (!course || unavailable) {
    return (
      <section
        role="alert"
        className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-soft"
      >
        <h1 className="text-xl font-bold text-slate-900">
          {unavailable ? 'Course unavailable' : 'Could not load this course'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {unavailable
            ? 'This course is not available for enrollment.'
            : getApiErrorMessage(courseQuery.error)}
        </p>
        {!unavailable && (
          <button
            type="button"
            disabled={courseQuery.isFetching}
            onClick={() => void courseQuery.refetch()}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            Retry
          </button>
        )}
        <Link
          href="/student/courses"
          className="mt-4 block text-xs font-bold text-sky-600 hover:underline"
        >
          Back to My Courses
        </Link>
      </section>
    );
  }

  const enrolled = enrollmentsQuery.data?.includes(courseId) ?? false;
  const inCart = cartQuery.data?.items.some((item) => item.courseId === courseId) ?? false;
  const checkingStatus = enrollmentsQuery.isPending || (course.price > 0 && cartQuery.isPending);
  const statusError = enrollmentsQuery.isError || (course.price > 0 && cartQuery.isError);

  return (
    <div className="min-w-0">
      <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <nav
            aria-label="Breadcrumb"
            className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-400"
          >
            <Link
              href="/student/courses"
              className="flex items-center gap-1 font-bold text-sky-600 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to My Courses
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="max-w-xs truncate font-bold text-slate-900">
              {course.title}
            </span>
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
            {course.title}
          </h1>
          {course.description && (
            <p className="mt-0.5 text-sm font-medium text-slate-500">{course.description}</p>
          )}
        </div>
      </header>

      <section
        aria-label="Course information"
        className="mb-6 flex flex-col justify-between gap-5 rounded-3xl border border-slate-100 bg-white p-5 shadow-soft md:flex-row md:items-center md:p-6"
      >
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-sky-100 bg-sky-50 p-2 shadow-sm">
            {course.thumnailURL ? (
              <Image
                src={course.thumnailURL}
                alt={course.title}
                width={48}
                height={48}
                unoptimized
                className="h-full w-full object-contain"
              />
            ) : (
              <BookOpen className="h-8 w-8 text-sky-400" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              {enrolled && (
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  Enrolled
                </span>
              )}
              {inCart && !enrolled && (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                  In cart
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                {formatCoursePrice(course.price)}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-600">
              {course.categoryName || 'Japanese course'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3 md:border-0 md:pt-0">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Lessons</p>
            <p className="text-lg font-extrabold text-slate-900">{course.lessonCount}</p>
          </div>
          {statusError ? (
            <div role="alert" className="text-xs text-rose-700">
              <p>Could not check enrollment or cart status.</p>
              <button
                type="button"
                onClick={() => {
                  if (enrollmentsQuery.isError) void enrollmentsQuery.refetch();
                  if (cartQuery.isError) void cartQuery.refetch();
                }}
                className="mt-1 font-bold underline"
              >
                Retry
              </button>
            </div>
          ) : enrolled ? (
            <span className="rounded-2xl bg-emerald-50 px-5 py-2.5 text-xs font-bold text-emerald-700">
              Already enrolled
            </span>
          ) : inCart ? (
            <Link
              href="/cart"
              className="rounded-2xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-700"
            >
              View cart
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => void action.enroll()}
              disabled={checkingStatus || action.isPending}
              className="rounded-2xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            >
              {action.isPending
                ? 'Processing…'
                : checkingStatus
                  ? 'Checking status…'
                  : course.price === 0
                    ? 'Enroll for free'
                    : 'Add to cart'}
            </button>
          )}
        </div>
      </section>

      {lessonsQuery.isPending ? (
        <div role="status" className="rounded-3xl bg-white p-8 text-sm text-slate-500">
          Loading lessons…
        </div>
      ) : lessonsQuery.isError ? (
        <section role="alert" className="rounded-3xl bg-white p-8 text-center">
          <p className="text-sm text-slate-600">{getApiErrorMessage(lessonsQuery.error)}</p>
          <button
            type="button"
            disabled={lessonsQuery.isFetching}
            onClick={() => void lessonsQuery.refetch()}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            Retry lessons
          </button>
        </section>
      ) : (
        <LessonList lessons={lessonsQuery.data} />
      )}
    </div>
  );
}
