import { SearchX, TriangleAlert } from 'lucide-react';
import type { ClientCourse } from '@/apis/courses/client-courses.type';
import { CourseCard } from './CourseCard';

function CoursesGridSkeleton({ count }: { count: number }) {
  return (
    <div
      role="status"
      aria-label="Đang tải danh sách khóa học"
      className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="h-40 bg-slate-100" />
          <div className="space-y-4 p-5">
            <div className="h-4 w-4/5 rounded bg-slate-100" />
            <div className="space-y-2">
              <div className="h-3 rounded bg-slate-100" />
              <div className="h-3 w-3/4 rounded bg-slate-100" />
            </div>
            <div className="h-3 w-20 rounded bg-slate-100" />
            <div className="h-px bg-slate-100" />
            <div className="h-5 w-24 rounded bg-slate-100" />
            <div className="h-10 rounded-lg bg-slate-100" />
          </div>
        </div>
      ))}
      <span className="sr-only">Đang tải danh sách khóa học…</span>
    </div>
  );
}

interface CoursesErrorStateProps {
  retrying: boolean;
  onRetry: () => void;
}

function CoursesErrorState({ retrying, onRetry }: CoursesErrorStateProps) {
  return (
    <div
      role="alert"
      className="mb-12 rounded-2xl border border-rose-100 bg-white px-6 py-16 text-center"
    >
      <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
        <TriangleAlert className="h-8 w-8" aria-hidden="true" />
      </span>
      <h2 className="mb-2 text-base font-bold text-slate-800">Không thể tải khóa học</h2>
      <p className="mb-6 text-sm text-slate-500">
        Đã có lỗi khi kết nối đến hệ thống. Vui lòng thử lại.
      </p>
      <button
        type="button"
        disabled={retrying}
        onClick={onRetry}
        className="inline-flex rounded-lg bg-brand-navy px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:cursor-not-allowed disabled:opacity-60"
      >
        {retrying ? 'Đang thử lại…' : 'Thử lại'}
      </button>
    </div>
  );
}

function CoursesEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div
      role="status"
      className="mb-12 rounded-2xl border border-slate-200 bg-white py-16 text-center"
    >
      <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
        <SearchX className="h-8 w-8" aria-hidden="true" />
      </span>
      <h2 className="mb-2 text-base font-bold text-slate-800">Không tìm thấy khóa học</h2>
      <p className="mb-6 text-sm text-slate-500">
        Không có khóa học nào khớp với bộ lọc tìm kiếm của bạn.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}

interface CoursesGridProps {
  courses: ClientCourse[];
  loading: boolean;
  fetching: boolean;
  error: boolean;
  retrying: boolean;
  skeletonCount: number;
  onRetry: () => void;
  onReset: () => void;
}

export function CoursesGrid({
  courses,
  loading,
  fetching,
  error,
  retrying,
  skeletonCount,
  onRetry,
  onReset,
}: CoursesGridProps) {
  if (loading) return <CoursesGridSkeleton count={skeletonCount} />;
  if (error) return <CoursesErrorState retrying={retrying} onRetry={onRetry} />;
  if (courses.length === 0) return <CoursesEmptyState onReset={onReset} />;

  return (
    <div className="relative mb-12" aria-busy={fetching}>
      {fetching && (
        <div
          role="status"
          className="absolute inset-x-0 -top-4 z-10 mx-auto w-fit rounded-full border border-blue-100 bg-white px-4 py-1.5 text-xs font-semibold text-brand-blue shadow-sm"
        >
          Đang cập nhật kết quả…
        </div>
      )}
      <div
        className={`grid grid-cols-1 gap-6 transition-opacity md:grid-cols-2 lg:grid-cols-3 ${fetching ? 'opacity-50' : ''}`}
      >
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}

export function CoursesResultsFallback() {
  return <CoursesGridSkeleton count={9} />;
}
