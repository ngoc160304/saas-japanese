'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { courseAPI } from '@/apis/courses/courses.api';
import { lessonAPI } from '@/apis/lessons/lessons.api';
import { IsLoading } from '@/components/common/loading/IsLoading';
import Header from '@/components/layout/management/header/Header';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-error';
import { LessonForm } from './LessonForm';
import type { LessonFormValues } from '../schemas/lesson.schema';
import { useAppStore } from '@/store/hooks';

export function LessonEditPage({ courseId, lessonId }: { courseId: number; lessonId: number }) {
  return <LessonEditForm key={`${courseId}-${lessonId}`} courseId={courseId} lessonId={lessonId} />;
}

function LessonEditForm({ courseId, lessonId }: { courseId: number; lessonId: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const store = useAppStore();
  const busy = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const courseQuery = useQuery({
    queryKey: ['courses', 'detail', courseId],
    queryFn: () => courseAPI.getById(courseId),
    retry: false,
  });
  const lessonQuery = useQuery({
    queryKey: ['lessons', 'detail', lessonId],
    queryFn: ({ signal }) => lessonAPI.getById(lessonId, signal),
    retry: false,
  });
  const update = useMutation({ mutationFn: lessonAPI.update });
  const backHref = `/admin/courses/${courseId}`;
  const lesson = lessonQuery.data;
  const course = courseQuery.data;
  const loading = courseQuery.isPending || lessonQuery.isPending;
  const invalidLesson = lesson && lesson.courseId !== courseId;

  const submit = async (values: LessonFormValues) => {
    if (!lesson || busy.current) return;
    busy.current = true;
    const revision = store.getState().auth.revision;
    try {
      await update.mutateAsync({
        id: lesson.id,
        data: {
          title: values.title,
          courseId,
          durationMinutes: values.durationMinutes,
          isPublished: values.isPublished,
        },
      });
      if (store.getState().auth.revision !== revision) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['lessons', 'curriculum', courseId] }),
        queryClient.invalidateQueries({ queryKey: ['lessons', courseId] }),
        queryClient.invalidateQueries({ queryKey: ['lessons', 'detail', lessonId] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
        queryClient.invalidateQueries({ queryKey: ['categories-course'] }),
      ]);
      if (!active.current || store.getState().auth.revision !== revision) return;
      toast.success('Đã cập nhật bài học.');
      router.push(backHref);
    } finally {
      busy.current = false;
    }
  };

  if (loading) return <IsLoading className="min-h-64 rounded-3xl bg-white" size={28} />;
  if (!course || !lesson || invalidLesson || courseQuery.isError || lessonQuery.isError)
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
        <Button variant="outline" nativeButton={false} render={<Link href={backHref} />}>
          Quay lại khóa học
        </Button>
      </div>
    );

  return (
    <div className="min-w-0 max-w-full">
      <Header
        title="Sửa bài học"
        description="Cập nhật thông tin và trạng thái của bài học."
        showProfile={false}
        breadcrumbs={
          <nav className="mb-1 flex min-w-0 flex-wrap gap-2 text-xs font-semibold text-slate-600">
            <Link href="/admin/courses">Khóa học</Link>
            <span>/</span>
            <Link href={backHref} className="max-w-48 truncate">
              {course.title}
            </Link>
            <span>/</span>
            <span className="text-slate-900">Sửa bài học</span>
          </nav>
        }
      />
      <LessonForm
        key={`${courseId}-${lessonId}`}
        grammarHref={`/admin/courses/${courseId}/lessons/${lessonId}?tab=grammar`}
        course={course}
        initialValues={{
          title: lesson.title,
          durationMinutes: lesson.durationMinutes,
          isPublished: lesson.isPublished,
          grammar: lesson.grammar ?? '',
        }}
        submitLabel="Lưu thay đổi"
        onSubmit={submit}
      />
    </div>
  );
}
