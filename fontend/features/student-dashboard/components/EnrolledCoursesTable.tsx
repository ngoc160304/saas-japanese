import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import type { CourseEnrollment } from '@/apis/courses/client-courses.api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function EnrolledCoursesTable({
  courses,
  loading,
  error,
  retrying,
  onRetry,
  page,
  totalPages,
  onPageChange,
}: {
  courses: CourseEnrollment[];
  loading: boolean;
  error: string | null;
  retrying: boolean;
  onRetry: () => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <Card className="shadow-soft gap-0 rounded-3xl border-slate-100 bg-white p-5 md:p-6">
      <section aria-labelledby="enrolled-courses-heading">
        <div className="mb-5">
          <h2
            id="enrolled-courses-heading"
            className="text-base font-bold text-slate-900 md:text-lg"
          >
            Your Enrolled Courses
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">Các khóa học và tiến độ đã lưu của bạn.</p>
        </div>
        {error ? (
          <div role="alert" className="space-y-3 py-6 text-center">
            <p className="text-sm text-rose-700">{error}</p>
            <Button variant="outline" onClick={onRetry} disabled={retrying}>
              Thử tải lại
            </Button>
          </div>
        ) : loading ? (
          <p role="status" className="py-8 text-center text-sm text-slate-500">
            Đang tải khóa học…
          </p>
        ) : !courses.length ? (
          <div className="space-y-3 py-8 text-center text-sm text-slate-500">
            <p>Chưa có khóa học trong trang này.</p>
            <Link href="/courses" className="font-semibold text-sky-700">
              Khám phá khóa học
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-500">
                  <th className="pb-3 pl-2">Course Name</th>
                  <th className="px-4 pb-3">Enrolled Date</th>
                  <th className="pr-2 pb-3">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50">
                    <td className="py-4 pl-2">
                      <Link
                        href={`/student/courses/${course.courseId}`}
                        className="flex items-center gap-3 font-bold text-slate-800 hover:text-sky-600"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-primary">
                          <BookOpen className="size-5" aria-hidden="true" />
                        </span>
                        <span className="break-words">{course.courseTitle}</span>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                      {new Date(course.enrollAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-4 pr-2">
                      <div className="flex items-center gap-2">
                        <progress
                          className="h-2 w-20 accent-sky-500"
                          max={100}
                          value={course.progressPercent}
                          aria-label={`Tiến độ ${course.courseTitle}`}
                        />
                        <span className="font-bold text-slate-700">{course.progressPercent}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              disabled={page === 0 || retrying}
              onClick={() => onPageChange(page - 1)}
            >
              Trước
            </Button>
            <span className="self-center text-xs">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page + 1 >= totalPages || retrying}
              onClick={() => onPageChange(page + 1)}
            >
              Sau
            </Button>
          </div>
        )}
      </section>
    </Card>
  );
}
