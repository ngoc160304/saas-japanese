'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil } from 'lucide-react';
import { courseAPI } from '@/apis/courses/courses.api';
import { lessonAPI } from '@/apis/lessons/lessons.api';
import type { Lesson } from '@/apis/lessons/lessons.type';
import { useDataTableQuery } from '@/components/common/table/hooks/useDataTableQuery';
import { DataTableToolbar } from '@/components/common/table/DataTableToolbar';
import { DataTablePagination } from '@/components/common/table/DataTablePagination';
import { IsLoading } from '@/components/common/loading/IsLoading';
import PageSection from '@/components/layout/management/page-section/PageSection';
import Header from '@/components/layout/management/header/Header';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-error';
import { LessonTable } from '@/features/lesson/component/LessonTable';
import { LessonDeleteDialog } from '@/features/lesson/component/LessonDeleteDialog';
import { CourseThumbnail } from './CourseThumbnail';
import { CourseStatusBadge } from './CourseStatusBadge';
import { formatCoursePrice } from '../utils/course-format';

export function CourseDetailPage({ courseId }: { courseId: number }) {
  const courseQuery = useQuery({
    queryKey: ['courses', 'detail', courseId],
    queryFn: () => courseAPI.getById(courseId),
    retry: false,
  });
  const lessons = useDataTableQuery({
    queryKey: ['lessons', courseId],
    queryFn: (params) => lessonAPI.getLessons({ ...params, courseId }),
    maxSize: 12,
    enabled: Boolean(courseQuery.data),
  });
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const course = courseQuery.data;
  const page = lessons.data;
  const createHref = `/admin/courses/${courseId}/lessons/create`;
  if (!course && courseQuery.isPending) return <IsLoading className="min-h-64" />;
  if (!course)
    return (
      <div role="alert" className="space-y-4 p-6 text-sm text-rose-600">
        <p>{getApiErrorMessage(courseQuery.error)}</p>
        <Button variant="outline" onClick={() => void courseQuery.refetch()}>
          Thử lại
        </Button>
        <Link href="/admin/courses" className="ml-4 text-sky-700">
          Quay lại khóa học
        </Link>
      </div>
    );

  return (
    <div className="min-w-0 max-w-full">
      <Header
        title={course.title}
        description="Danh sách bài học của khóa học."
        showProfile={false}
        breadcrumbs={
          <nav className="mb-1 flex flex-wrap gap-2 text-xs text-slate-500">
            <Link href="/admin/courses" className="hover:text-sky-600">
              Courses
            </Link>
            <span>/</span>
            <span>Lessons</span>
          </nav>
        }
      >
        <Link
          href={`/admin/courses/${courseId}/edit`}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          <Pencil className="size-4" />
          Sửa khóa học
        </Link>
        <Link
          href={createHref}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-600"
        >
          <Plus className="size-4" />
          Tạo bài học
        </Link>
      </Header>
      <section className="mb-6 flex flex-col justify-between gap-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-soft md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <CourseThumbnail src={course.thumnailURL} title={course.title} />
          <div className="min-w-0">
            <CourseStatusBadge published={course.published} />
            <p className="mt-2 text-xs break-words text-slate-500">
              {course.description || 'Chưa có mô tả.'}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <p className="text-xs text-slate-400">Giá khóa học</p>
          <p className="mt-1 font-bold text-sky-600">{formatCoursePrice(course.price)}</p>
        </div>
      </section>
      <PageSection>
        <h2 className="text-base font-bold text-slate-900">Danh sách bài học</h2>
        <DataTableToolbar
          searchValue={lessons.search}
          onSearchChange={lessons.setSearch}
          searchPlaceholder="Tìm bài học..."
          onReset={lessons.reset}
        />
        <LessonTable
          lessons={page?.content ?? []}
          offset={page?.pageable.offset ?? 0}
          loading={lessons.isLoading || lessons.isPlaceholderData}
          busy={lessons.isFetching}
          error={lessons.isError ? getApiErrorMessage(lessons.error) : null}
          onRetry={() => void lessons.refetch()}
          onDelete={setSelectedLesson}
        />
        {lessons.isFetching && !lessons.isLoading && (
          <p role="status" className="text-xs text-slate-500">
            Đang cập nhật bài học…
          </p>
        )}
        {page && !lessons.isError && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">{page.totalElements} bài học phù hợp</p>
            {page.totalPages > 0 && (
              <DataTablePagination
                page={page.number + 1}
                totalPages={page.totalPages}
                onPageChange={(next) => {
                  if (!lessons.isFetching) lessons.setPage(next);
                }}
              />
            )}
            {!page.content.length && lessons.page > 1 && (
              <Button variant="outline" onClick={() => lessons.setPage(1)}>
                Về trang đầu
              </Button>
            )}
            <Link
              href={createHref}
              className="inline-block text-xs font-bold text-sky-600 hover:underline"
            >
              + Tạo bài học
            </Link>
          </div>
        )}
      </PageSection>
      {selectedLesson && (
        <LessonDeleteDialog
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
          onDeleted={() => {
            if (page && page.content.length <= 1 && lessons.page > 1)
              lessons.setPage(lessons.page - 1);
          }}
        />
      )}
    </div>
  );
}
