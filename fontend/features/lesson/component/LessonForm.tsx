'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle } from 'lucide-react';
import type { Course } from '@/apis/courses/courses.type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getApiError } from '@/lib/api-error';
import { lessonSchema, type LessonFormValues } from '../schemas/lesson.schema';

export function LessonForm({
  course,
  onSubmit,
}: {
  course: Course;
  onSubmit: (values: LessonFormValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: { title: '', durationMinutes: 45, isPublished: false, grammar: '' },
  });
  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      const failure = getApiError(error);
      for (const field of ['title', 'durationMinutes', 'isPublished', 'grammar'] as const) {
        if (failure.fieldErrors[field]) setError(field, { message: failure.fieldErrors[field] });
      }
      setError('root', { message: failure.message });
    }
  });
  const inputClass =
    'h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm focus-visible:ring-sky-500';
  const backHref = `/admin/courses/${course.id}`;
  return (
    <div className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-100 bg-white p-6 shadow-soft md:p-8 lg:p-10">
      <form id="lesson-form" noValidate className="space-y-6" onSubmit={submit}>
        <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
          <p className="text-xs text-slate-500">Khóa học</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{course.title}</p>
        </div>
        <div>
          <label htmlFor="lesson-title" className="mb-1.5 block text-xs font-bold text-slate-700">
            Tên bài học <span className="text-rose-500">*</span>
          </label>
          <Input
            id="lesson-title"
            maxLength={200}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'lesson-title-error' : undefined}
            placeholder="Ví dụ: Bài 1: Cấu trúc ngữ pháp cơ bản"
            className={inputClass}
            {...register('title')}
          />
          {errors.title && (
            <p id="lesson-title-error" className="mt-1 text-xs text-rose-600">
              {errors.title.message}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="lesson-duration"
              className="mb-1.5 block text-xs font-bold text-slate-700"
            >
              Thời lượng (phút)
            </label>
            <Input
              id="lesson-duration"
              type="number"
              min={0}
              max={2147483647}
              step={1}
              disabled={isSubmitting}
              className={inputClass}
              aria-invalid={Boolean(errors.durationMinutes)}
              aria-describedby={errors.durationMinutes ? 'lesson-duration-error' : undefined}
              {...register('durationMinutes', {
                setValueAs: (value: string | number | null) =>
                  value === '' || value === null ? null : Number(value),
              })}
            />
            {errors.durationMinutes && (
              <p id="lesson-duration-error" className="mt-1 text-xs text-rose-600">
                {errors.durationMinutes.message}
              </p>
            )}
          </div>
          <div>
            <p className="mb-1.5 text-xs font-bold text-slate-700">Trạng thái xuất bản</p>
            <div className="flex h-12 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <label htmlFor="lesson-published" className="text-xs font-bold text-slate-800">
                Xuất bản
              </label>
              <input
                id="lesson-published"
                type="checkbox"
                disabled={isSubmitting}
                className="size-5 accent-emerald-500 focus-visible:outline-sky-500"
                {...register('isPublished')}
              />
            </div>
            {errors.isPublished && (
              <p className="mt-1 text-xs text-rose-600">{errors.isPublished.message}</p>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="lesson-grammar" className="mb-1.5 block text-xs font-bold text-slate-700">
            Giới thiệu / ghi chú bài học
          </label>
          <Textarea
            id="lesson-grammar"
            rows={3}
            disabled={isSubmitting}
            placeholder="Giới thiệu mục tiêu bài học hoặc kiến thức trọng tâm..."
            className="rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            {...register('grammar')}
          />
          {errors.grammar && <p className="mt-1 text-xs text-rose-600">{errors.grammar.message}</p>}
        </div>
        {errors.root && (
          <p role="alert" className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">
            {errors.root.message}
          </p>
        )}
        <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center">
          <Link
            href={backHref}
            className="rounded-2xl border border-slate-200 px-5 py-2.5 text-center text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Hủy
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-auto rounded-2xl bg-slate-900 px-6 py-3 text-xs font-bold text-white hover:bg-sky-600"
          >
            {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
            {isSubmitting ? 'Đang lưu…' : 'Tạo bài học'}
          </Button>
        </div>
      </form>
    </div>
  );
}
