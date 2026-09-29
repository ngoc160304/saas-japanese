'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { courseAPI } from '@/apis/courses/courses.api';
import { lessonAPI } from '@/apis/lessons/lessons.api';
import type { Lesson } from '@/apis/lessons/lessons.type';
import { useDataTableQuery } from '@/components/common/table/hooks/useDataTableQuery';
import { IsLoading } from '@/components/common/loading/IsLoading';
import { Button } from '@/components/ui/button';
import { LessonDeleteDialog } from '@/features/lesson/component/LessonDeleteDialog';
import { getApiErrorMessage } from '@/lib/api-error';
import { CourseDetailHeader } from './CourseDetailHeader';
import { CourseLessonsSection } from './CourseLessonsSection';
import { CourseSummaryCard } from './CourseSummaryCard';

export function CourseDetailPage({ courseId }: { courseId: number }) {
  return <CourseDetailContent key={courseId} courseId={courseId} />;
}

function CourseDetailContent({ courseId }: { courseId: number }) {
  const courseQuery = useQuery({
    queryKey: ['courses', 'detail', courseId],
    queryFn: () => courseAPI.getById(courseId),
    retry: false,
  });
  const lessons = useDataTableQuery({
    queryKey: ['lessons', courseId],
    queryFn: (params) => lessonAPI.getLessons({ ...params, courseId }),
    maxSize: 12,
    enabled: courseQuery.isSuccess,
    preservePreviousData: false,
  });
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const course = courseQuery.data;
  const page = lessons.data;
  const createHref = `/admin/courses/${courseId}/lessons/create`;
  if (!course && courseQuery.isPending)
    return <IsLoading className="min-h-64 rounded-3xl bg-white" size={28} />;
  if (!course)
    return (
      <div
        role="alert"
        className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 text-sm text-rose-600 shadow-soft"
      >
        <h1 className="text-lg font-bold text-slate-900">Không thể tải khóa học</h1>
        <p>{getApiErrorMessage(courseQuery.error)}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            disabled={courseQuery.isFetching}
            onClick={() => void courseQuery.refetch()}
          >
            Thử lại
          </Button>
          <Link href="/admin/courses" className="font-semibold text-sky-700 hover:underline">
            Quay lại khóa học
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-w-0 max-w-full">
      <CourseDetailHeader
        courseId={courseId}
        courseTitle={course.title}
        createHref={createHref}
      />
      <CourseSummaryCard course={course} />
      <CourseLessonsSection
        page={page}
        currentPage={lessons.page}
        searchValue={lessons.search}
        loading={lessons.isLoading || lessons.isPlaceholderData}
        busy={lessons.isFetching}
        error={lessons.isError ? getApiErrorMessage(lessons.error) : null}
        createHref={createHref}
        onSearchChange={lessons.setSearch}
        onReset={lessons.reset}
        onRetry={() => void lessons.refetch()}
        onPageChange={(next) => {
          if (!lessons.isFetching) lessons.setPage(next);
        }}
        onDelete={setSelectedLesson}
      />
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
