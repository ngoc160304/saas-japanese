'use client';

import { LoaderCircle } from 'lucide-react';
import type { ClientCourse } from '@/apis/courses/client-courses.type';
import { CourseCard } from '@/features/client-course/components/CourseCard';
import { useEnrollFeaturedCourse } from '../hooks/useEnrollFeaturedCourse';

export function FeaturedCourseCard({ course }: { course: ClientCourse }) {
  const { enroll, isPending, isEnrolled, isAddedToCart, disabled } =
    useEnrollFeaturedCourse(course.id);
  const isFree = course.price === 0;
  const label = isEnrolled
    ? 'Đã đăng ký học'
    : isAddedToCart
      ? 'Đã thêm vào giỏ hàng'
      : isPending
        ? isFree
          ? 'Đang đăng ký…'
          : 'Đang thêm…'
        : isFree
          ? 'Đăng ký học'
          : 'Thêm vào giỏ hàng';

  return (
    <CourseCard
      course={course}
      variant="featured"
      featuredAction={
        <button
          type="button"
          onClick={enroll}
          disabled={disabled}
          aria-busy={isPending}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-navy px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:cursor-not-allowed disabled:opacity-55"
        >
          {isPending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
          <span aria-live="polite">{label}</span>
        </button>
      }
    />
  );
}
