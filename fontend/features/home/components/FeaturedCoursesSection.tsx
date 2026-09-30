'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { clientCoursesAPI, clientCoursesQueryKeys } from '@/apis/courses/client-courses.api';
import type { ClientCourse } from '@/apis/courses/client-courses.type';
import { CourseThumbnail } from '@/features/course/component/CourseThumbnail';
import { formatCoursePrice } from '@/features/course/utils/course-format';

const featuredCoursesParams = { page: 0, size: 3 } as const;

interface FeaturedCourseCardProps {
  course: ClientCourse;
}

function FeaturedCourseCard({ course }: FeaturedCourseCardProps) {
  const isFree = course.price === 0;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
      <div className="relative h-40 bg-slate-100">
        <CourseThumbnail
          src={course.thumnailURL}
          title={course.title}
          className="h-40 w-full rounded-none border-0 border-b border-slate-100"
        />
        <span className="absolute top-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 shadow-sm">
          {course.categoryName ?? 'Chưa phân loại'}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 line-clamp-2 text-sm font-bold text-slate-800">{course.title}</h3>
        <p className="mb-4 line-clamp-2 flex-1 text-xs text-slate-500">
          {course.description ?? 'Chưa có mô tả cho khóa học này.'}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-500">{course.lessonCount} Bài học</span>
          <span className={`text-sm font-bold ${isFree ? 'text-emerald-600' : 'text-slate-800'}`}>
            {isFree ? 'Miễn phí' : formatCoursePrice(course.price)}
          </span>
        </div>
        <Link
          href="/register"
          className="mt-4 block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          aria-label={`Đăng ký để xem chi tiết ${course.title}`}
        >
          Xem chi tiết
        </Link>
      </div>
    </article>
  );
}

function FeaturedCoursesSkeleton() {
  return (
    <div
      role="status"
      aria-label="Đang tải khóa học nổi bật"
      className="grid grid-cols-1 gap-6 md:grid-cols-3"
    >
      {Array.from({ length: featuredCoursesParams.size }, (_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="h-40 bg-slate-100" />
          <div className="space-y-4 p-5">
            <div className="h-4 w-4/5 rounded bg-slate-100" />
            <div className="space-y-2">
              <div className="h-3 rounded bg-slate-100" />
              <div className="h-3 w-3/4 rounded bg-slate-100" />
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex justify-between">
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="h-4 w-24 rounded bg-slate-100" />
            </div>
            <div className="h-9 rounded-lg bg-slate-100" />
          </div>
        </div>
      ))}
      <span className="sr-only">Đang tải khóa học nổi bật…</span>
    </div>
  );
}

export function FeaturedCoursesSection() {
  const coursesQuery = useQuery({
    queryKey: clientCoursesQueryKeys.list(featuredCoursesParams),
    queryFn: () => clientCoursesAPI.getClientCourses(featuredCoursesParams),
    retry: false,
  });

  return (
    <section id="courses" aria-labelledby="courses-title" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 id="courses-title" className="mb-2 text-2xl font-bold text-slate-800">
              Khóa học nổi bật
            </h2>
            <p className="text-sm text-slate-500">Tuyển chọn các khóa học được yêu thích nhất.</p>
          </div>
          <Link
            href="#levels"
            className="text-sm font-medium text-brand-blue transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            Xem tất cả khóa học →
          </Link>
        </div>
        {coursesQuery.isPending ? (
          <FeaturedCoursesSkeleton />
        ) : coursesQuery.isError ? (
          <div
            role="alert"
            className="rounded-2xl border border-rose-100 bg-rose-50 px-6 py-10 text-center"
          >
            <p className="text-sm font-medium text-rose-700">
              Không thể tải khóa học nổi bật. Vui lòng thử lại.
            </p>
            <button
              type="button"
              disabled={coursesQuery.isFetching}
              onClick={() => void coursesQuery.refetch()}
              className="mt-4 rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {coursesQuery.isFetching ? 'Đang thử lại…' : 'Thử lại'}
            </button>
          </div>
        ) : coursesQuery.data.content.length === 0 ? (
          <div
            role="status"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500"
          >
            Hiện chưa có khóa học nổi bật.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {coursesQuery.data.content.map((course) => (
              <FeaturedCourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
