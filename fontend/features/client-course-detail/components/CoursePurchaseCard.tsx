import Link from 'next/link';
import { BookOpen, LoaderCircle, ShoppingCart } from 'lucide-react';
import type { ClientCourseDetail } from '@/apis/courses/client-courses.type';
import { CourseThumbnail } from '@/features/course/component/CourseThumbnail';
import { formatCoursePrice } from '@/features/course/utils/course-format';

interface CoursePurchaseCardProps {
  course: ClientCourseDetail;
  onAddToCart: () => void;
  adding: boolean;
  addDisabled: boolean;
  freeEnrollment: {
    enroll: () => void;
    isEnrolled: boolean;
    isPending: boolean;
    disabled: boolean;
    isChecking: boolean;
    checkError: string | null;
    isRetrying: boolean;
    retryCheck: () => void;
  };
}

export function CoursePurchaseCard({
  course,
  onAddToCart,
  adding,
  addDisabled,
  freeEnrollment,
}: CoursePurchaseCardProps) {
  const isFree = course.price === 0;
  return (
    <aside
      aria-label={isFree ? 'Thông tin đăng ký khóa học' : 'Thông tin mua khóa học'}
      className="shadow-soft rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div className="mb-6 h-44 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        <CourseThumbnail
          src={course.thumnailURL}
          title={course.title}
          className="h-full w-full rounded-none border-0 bg-slate-100 text-slate-300"
        />
      </div>
      <p className="mb-6 text-3xl font-extrabold text-slate-900">
        {formatCoursePrice(course.price)}
      </p>
      <div className="space-y-3">
        {isFree ? (
          freeEnrollment.isEnrolled ? (
            <Link
              href={`/student/courses/${course.id}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Vào học
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={freeEnrollment.enroll}
                disabled={freeEnrollment.disabled}
                aria-busy={freeEnrollment.isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:cursor-not-allowed disabled:opacity-55"
              >
                {freeEnrollment.isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                )}
                <span aria-live="polite">
                  {freeEnrollment.isPending
                    ? 'Đang đăng ký…'
                    : freeEnrollment.isChecking
                      ? 'Đang kiểm tra đăng ký…'
                      : 'Đăng ký miễn phí'}
                </span>
              </button>
              {freeEnrollment.checkError && (
                <div role="alert" className="text-center text-sm text-red-600">
                  <p>Không thể kiểm tra đăng ký: {freeEnrollment.checkError}</p>
                  <button
                    type="button"
                    onClick={freeEnrollment.retryCheck}
                    disabled={freeEnrollment.isRetrying}
                    className="mt-2 font-semibold text-brand-blue underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:opacity-55"
                  >
                    {freeEnrollment.isRetrying ? 'Đang thử lại…' : 'Thử lại'}
                  </button>
                </div>
              )}
            </>
          )
        ) : (
          <>
            <button
              type="button"
              onClick={onAddToCart}
              disabled={addDisabled}
              aria-busy={adding}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:cursor-not-allowed disabled:opacity-55"
            >
              {adding ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              )}
              <span aria-live="polite">{adding ? 'Đang thêm…' : 'Thêm vào giỏ hàng'}</span>
            </button>
            <button
              type="button"
              disabled
              aria-describedby="buy-now-unavailable"
              className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-lg border border-brand-blue bg-blue-50 px-4 py-2.5 text-sm font-semibold text-brand-blue opacity-55"
            >
              Mua ngay
            </button>
          </>
        )}
      </div>
      {!isFree && (
        <p id="buy-now-unavailable" className="mt-3 text-center text-xs text-slate-500">
          Chức năng mua ngay chưa khả dụng.
        </p>
      )}
    </aside>
  );
}
