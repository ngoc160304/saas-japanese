'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { clientCoursesAPI, clientCoursesQueryKeys } from '@/apis/courses/client-courses.api';
import { getApiError, getApiErrorMessage } from '@/lib/api-error';
import { useAddCourseToCart } from '../hooks/useAddCourseToCart';
import { CourseDetailHero } from './CourseDetailHero';
import { CoursePurchaseCard } from './CoursePurchaseCard';
import { CourseSyllabus } from './CourseSyllabus';

export function CourseDetailPage({ courseId }: { courseId: number }) {
  const courseQuery = useQuery({
    queryKey: clientCoursesQueryKeys.detail(courseId),
    queryFn: ({ signal }) => clientCoursesAPI.getDetail(courseId, signal),
    retry: false,
  });
  const lessonsQuery = useQuery({
    queryKey: clientCoursesQueryKeys.lessons(courseId),
    queryFn: ({ signal }) => clientCoursesAPI.getLessons(courseId, signal),
    enabled: courseQuery.isSuccess && courseQuery.data.id === courseId,
    retry: false,
  });
  const unavailable =
    (courseQuery.isError && getApiError(courseQuery.error).status === 404) ||
    (lessonsQuery.isError && getApiError(lessonsQuery.error).status === 404);
  const course =
    courseQuery.isSuccess && courseQuery.data.id === courseId && !unavailable
      ? courseQuery.data
      : undefined;
  const cartAction = useAddCourseToCart(course?.id);

  if (courseQuery.isPending) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8" role="status" aria-busy="true">
        <p className="text-sm text-slate-600">Đang tải khóa học…</p>
        <div className="mt-6 h-56 animate-pulse rounded-2xl bg-slate-200" />
      </main>
    );
  }
  if (!course) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <section
          className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-soft"
          role="alert"
        >
          <h1 className="mb-3 text-2xl font-bold text-slate-800">
            {unavailable ? 'Khóa học không còn khả dụng' : 'Không thể tải khóa học'}
          </h1>
          <p className="mb-6 text-sm text-slate-600">
            {unavailable
              ? 'Khóa học không tồn tại hoặc chưa được công khai.'
              : getApiErrorMessage(courseQuery.error)}
          </p>
          {!unavailable && (
            <button
              type="button"
              onClick={() => void courseQuery.refetch()}
              disabled={courseQuery.isFetching}
              className="mr-4 rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {courseQuery.isFetching ? 'Đang tải…' : 'Thử lại'}
            </button>
          )}
          <Link
            href="/courses"
            className="rounded text-sm font-semibold text-brand-blue hover:underline"
          >
            Xem các khóa học
          </Link>
        </section>
      </main>
    );
  }
  return (
    <>
      <CourseDetailHero course={course} />
      <main className="relative z-10 mx-auto -mt-6 mb-16 w-full max-w-6xl px-4 sm:px-6 lg:-mt-10 lg:px-8">
        <div className="grid items-start gap-8 lg:grid-cols-3">
          <div className="order-2 min-w-0 space-y-8 lg:order-1 lg:col-span-2">
            <CourseSyllabus
              lessons={lessonsQuery.data}
              loading={lessonsQuery.isPending}
              error={lessonsQuery.isError ? getApiErrorMessage(lessonsQuery.error) : null}
              retrying={lessonsQuery.isFetching}
              onRetry={() => void lessonsQuery.refetch()}
              lessonCount={course.lessonCount}
              totalDurationMinutes={course.totalDurationMinutes}
            />
          </div>
          <div className="order-1 min-w-0 lg:sticky lg:top-24 lg:order-2">
            <CoursePurchaseCard
              course={course}
              onAddToCart={() => void cartAction.addToCart()}
              adding={cartAction.isPending}
              addDisabled={cartAction.disabled}
            />
          </div>
        </div>
      </main>
    </>
  );
}
