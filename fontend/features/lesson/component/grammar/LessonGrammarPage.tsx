'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { courseAPI } from '@/apis/courses/courses.api';
import { lessonAPI } from '@/apis/lessons/lessons.api';
import { Button } from '@/components/ui/button';
import { getApiError } from '@/lib/api-error';
import { LessonContentWorkspace } from '../LessonContentWorkspace';

export function LessonGrammarPage({ courseId, lessonId }: { courseId: number; lessonId: number }) {
  const courseQuery = useQuery({
    queryKey: ['courses', 'detail', courseId],
    queryFn: () => courseAPI.getById(courseId, { localErrorHandling: true }),
    retry: false,
  });
  const lessonQuery = useQuery({
    queryKey: ['lessons', 'detail', lessonId],
    queryFn: () => lessonAPI.getById(lessonId),
    retry: false,
  });
  const course = courseQuery.data;
  const lesson = lessonQuery.data;
  const error = getApiError(courseQuery.error ?? lessonQuery.error);

  if (courseQuery.isPending || lessonQuery.isPending)
    return (
      <p role="status" className="p-8 text-center text-sm text-slate-600">
        Đang tải bài học...
      </p>
    );

  if (
    !course ||
    !lesson ||
    course.id !== courseId ||
    lesson.id !== lessonId ||
    lesson.courseId !== courseId ||
    lesson.isDeleted
  ) {
    const unavailable =
      error.status === 404 ||
      Boolean(
        course &&
        lesson &&
        (course.id !== courseId ||
          lesson.id !== lessonId ||
          lesson.courseId !== courseId ||
          lesson.isDeleted),
      );
    return (
      <div
        role="alert"
        className="mx-auto mt-8 max-w-xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-soft"
      >
        <h1 className="text-lg font-bold text-slate-900">
          {unavailable
            ? 'Bài học không khả dụng'
            : error.status === 403
              ? 'Không có quyền truy cập'
              : 'Không thể tải bài học'}
        </h1>
        <p>
          {unavailable
            ? 'Không tìm thấy khóa học hoặc bài học trong khóa học này.'
            : error.status === 403
              ? 'Bạn không có quyền xem khóa học hoặc bài học này.'
              : error.message}
        </p>
        <div className="flex items-center gap-4">
          {!unavailable && error.status !== 403 && (
            <Button
              variant="outline"
              onClick={() => {
                void courseQuery.refetch();
                void lessonQuery.refetch();
              }}
            >
              Thử lại
            </Button>
          )}
          <Link href="/admin/courses" className="font-semibold text-sky-700 hover:underline">
            Về danh sách khóa học
          </Link>
        </div>
      </div>
    );
  }
  return (
    <LessonContentWorkspace
      key={`${courseId}-${lessonId}`}
      courseId={courseId}
      lessonId={lessonId}
      course={course}
      lesson={lesson}
    />
  );
}
