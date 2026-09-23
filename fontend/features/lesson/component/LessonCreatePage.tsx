'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { courseAPI } from '@/apis/courses/courses.api';
import { lessonAPI } from '@/apis/lessons/lessons.api';
import { useCrudCreate } from '@/hooks/crud/useCrudCreate';
import { IsLoading } from '@/components/common/loading/IsLoading';
import Header from '@/components/layout/management/header/Header';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-error';
import { LessonForm } from './LessonForm';
import type { LessonFormValues } from '../schemas/lesson.schema';

export function LessonCreatePage({ courseId }: { courseId: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const submitting = useRef(false);
  const courseQuery = useQuery({
    queryKey: ['courses', 'detail', courseId],
    queryFn: () => courseAPI.getById(courseId),
    retry: false,
  });
  const creation = useCrudCreate({ queryKey: ['lessons', courseId], mutationFn: lessonAPI.create });
  const backHref = `/admin/courses/${courseId}`;
  const submit = async (values: LessonFormValues) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      await creation.mutateAsync({ ...values, courseId });
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
      void queryClient.invalidateQueries({ queryKey: ['categories-course'] });
      toast.success('Đã tạo bài học.');
      router.push(backHref);
    } catch (error) {
      submitting.current = false;
      toast.error(getApiErrorMessage(error));
      throw error;
    }
  };
  if (courseQuery.isPending) return <IsLoading className="min-h-64" />;
  if (courseQuery.isError || !courseQuery.data)
    return (
      <div role="alert" className="space-y-4 p-6 text-sm text-rose-600">
        <p>{getApiErrorMessage(courseQuery.error)}</p>
        <Button variant="outline" onClick={() => void courseQuery.refetch()}>
          Thử lại
        </Button>
        <Link href={backHref} className="ml-4 text-sky-700">
          Quay lại khóa học
        </Link>
      </div>
    );
  return (
    <div className="min-w-0 max-w-full">
      <Header
        title="Tạo bài học"
        description="Khởi tạo thông tin bài học cho khóa học hiện tại."
        showProfile={false}
        breadcrumbs={
          <nav className="mb-1 flex flex-wrap gap-2 text-xs text-slate-500">
            <Link href="/admin/courses">Courses</Link>
            <span>/</span>
            <Link href={backHref}>{courseQuery.data.title}</Link>
            <span>/</span>
            <span>Create Lesson</span>
          </nav>
        }
      >
        <Link
          href={backHref}
          className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          Hủy
        </Link>
        <Button
          type="submit"
          form="lesson-form"
          disabled={creation.isPending}
          className="rounded-2xl bg-slate-900 text-white hover:bg-sky-600"
        >
          {creation.isPending ? 'Đang lưu…' : 'Tạo bài học'}
        </Button>
      </Header>
      <LessonForm course={courseQuery.data} onSubmit={submit} />
    </div>
  );
}
