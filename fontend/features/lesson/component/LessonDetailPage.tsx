'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { courseAPI } from '@/apis/courses/courses.api';
import { lessonAPI } from '@/apis/lessons/lessons.api';
import { IsLoading } from '@/components/common/loading/IsLoading';
import Header from '@/components/layout/management/header/Header';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { Button } from '@/components/ui/button';
import { CourseStatusBadge } from '@/features/course/component/CourseStatusBadge';
import { getApiErrorMessage } from '@/lib/api-error';

export function LessonDetailPage({ courseId, lessonId }: { courseId: number; lessonId: number }) {
  const courseQuery = useQuery({
    queryKey: ['courses', 'detail', courseId],
    queryFn: () => courseAPI.getById(courseId),
    retry: false,
  });
  const lessonQuery = useQuery({
    queryKey: ['lessons', 'detail', lessonId],
    queryFn: () => lessonAPI.getById(lessonId),
    retry: false,
  });
  const backHref = `/admin/courses/${courseId}`;
  const lesson = lessonQuery.data;
  const course = courseQuery.data;
  const loading = courseQuery.isPending || lessonQuery.isPending;
  const invalidLesson = lesson && lesson.courseId !== courseId;

  if (loading) return <IsLoading className="min-h-64 rounded-3xl bg-white" size={28} />;
  if (!course || !lesson || invalidLesson)
    return (
      <div
        role="alert"
        className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 text-sm text-rose-700 shadow-soft"
      >
        <p>
          {invalidLesson
            ? 'Bài học không thuộc khóa học này.'
            : getApiErrorMessage(courseQuery.error ?? lessonQuery.error)}
        </p>
        <div className="flex flex-wrap gap-3">
          {!invalidLesson && (
            <Button
              variant="outline"
              disabled={courseQuery.isFetching || lessonQuery.isFetching}
              onClick={() => {
                void courseQuery.refetch();
                void lessonQuery.refetch();
              }}
            >
              Thử lại
            </Button>
          )}
          <Link href={backHref} className="font-semibold text-sky-700 hover:underline">
            Quay lại khóa học
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-w-0 max-w-full">
      <Header
        title={lesson.title}
        description="Thông tin chi tiết và nội dung tổng quan của bài học."
        showProfile={false}
        breadcrumbs={
          <nav className="mb-1 flex min-w-0 flex-wrap gap-2 text-xs font-semibold text-slate-600">
            <Link href="/admin/courses">Khóa học</Link>
            <span>/</span>
            <Link href={backHref} className="max-w-48 truncate">
              {course.title}
            </Link>
            <span>/</span>
            <span className="text-slate-900">{lesson.title}</span>
          </nav>
        }
      >
        <Link
          href={`${backHref}/lessons/${lessonId}/edit`}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-700"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          Sửa bài học
        </Link>
      </Header>

      <PageSection>
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wider text-slate-600 uppercase">Bài học</p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-900">{lesson.title}</h2>
            <p className="mt-1 text-xs font-medium text-slate-700">Slug: {lesson.slug}</p>
          </div>
          <CourseStatusBadge published={lesson.isPublished} />
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <dt className="text-xs font-bold text-slate-600">Thời lượng</dt>
            <dd className="mt-1 text-sm font-bold text-slate-900">
              {lesson.durationMinutes === null ? 'Chưa cập nhật' : `${lesson.durationMinutes} phút`}
            </dd>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <dt className="text-xs font-bold text-slate-600">Video</dt>
            <dd className="mt-1 text-sm font-bold text-slate-900">
              {lesson.videoUrl ? (
                <a
                  href={lesson.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-700 hover:underline"
                >
                  Mở video bài học
                </a>
              ) : (
                'Chưa đính kèm'
              )}
            </dd>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-2">
            <dt className="text-xs font-bold text-slate-600">Giới thiệu / ghi chú</dt>
            <dd className="mt-2 whitespace-pre-wrap text-sm leading-6 font-medium text-slate-800">
              {lesson.grammar || 'Chưa có nội dung giới thiệu.'}
            </dd>
          </div>
        </dl>
      </PageSection>
    </div>
  );
}
