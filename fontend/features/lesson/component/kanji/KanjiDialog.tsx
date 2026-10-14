'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { KanjiItem } from '@/apis/lessons/lesson-content.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getApiError } from '@/lib/api-error';
import { kanjiSchema, type KanjiValues } from '../../schemas/lesson-content.schema';
import { LessonContentFormDialog } from '../LessonContentFormDialog';

const fields = [
  { name: 'kanji', label: 'Kanji', required: true, max: 10, example: '食', multiline: false },
  {
    name: 'meaningVi',
    label: 'Nghĩa tiếng Việt',
    required: true,
    max: 255,
    example: 'Ăn, thức ăn',
    multiline: false,
  },
  {
    name: 'onyomi',
    label: 'Âm On',
    required: false,
    max: 150,
    example: 'ショク、ジキ',
    multiline: false,
  },
  {
    name: 'kunyomi',
    label: 'Âm Kun',
    required: false,
    max: 150,
    example: 'た.べる、く.う',
    multiline: false,
  },
  {
    name: 'exampleWords',
    label: 'Từ ghép minh họa',
    required: false,
    max: 1000,
    example: '食事（しょくじ）: bữa ăn',
    multiline: true,
  },
] as const;

export function KanjiDialog({
  item,
  pending,
  unavailable,
  onClose,
  onSubmit,
}: {
  item?: KanjiItem;
  pending: boolean;
  unavailable: boolean;
  onClose: () => void;
  onSubmit: (values: KanjiValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<KanjiValues>({
    resolver: zodResolver(kanjiSchema),
    defaultValues: {
      kanji: item?.kanji ?? '',
      meaningVi: item?.meaningVi ?? '',
      onyomi: item?.onyomi ?? '',
      kunyomi: item?.kunyomi ?? '',
      exampleWords: item?.exampleWords ?? '',
      strokeCount: item?.strokeCount ?? null,
    },
  });
  const busy = pending || isSubmitting;
  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      const failure = getApiError(error);
      for (const name of [...fields.map((field) => field.name), 'strokeCount'] as const) {
        if (failure.fieldErrors[name]) setError(name, { message: failure.fieldErrors[name] });
      }
      setError('root', { message: failure.message });
    }
  });
  return (
    <LessonContentFormDialog
      title={item ? 'Sửa Kanji' : 'Thêm Kanji'}
      dirty={isDirty}
      pending={busy}
      onClose={onClose}
      actions={
        <Button type="submit" form="kanji-form" disabled={busy || unavailable} className="bg-primary text-white hover:bg-primary/90">
          {busy ? 'Đang lưu…' : 'Lưu Kanji'}
        </Button>
      }
    >
      <form id="kanji-form" noValidate onSubmit={submit} className="space-y-4">
        {fields.map(({ name, label, required, max, example, multiline }) => {
          const Component = multiline ? Textarea : Input;
          return (
            <div key={name}>
              <label htmlFor={`kanji-${name}`} className="mb-1 block text-sm font-semibold">
                {label}
                {required && ' *'}
              </label>
              <Component
                id={`kanji-${name}`}
                {...register(name)}
                required={required}
                maxLength={max}
                placeholder={example}
                disabled={busy || unavailable}
                aria-invalid={Boolean(errors[name])}
                aria-describedby={errors[name] ? `kanji-${name}-error` : undefined}
                className="rounded-xl border-slate-200 bg-slate-50 text-slate-900"
              />
              {errors[name] && (
                <p id={`kanji-${name}-error`} className="text-xs text-rose-700">
                  {errors[name]?.message}
                </p>
              )}
            </div>
          );
        })}
        <div>
          <label htmlFor="kanji-strokeCount" className="mb-1 block text-sm font-semibold">
            Số nét (có thể bỏ trống)
          </label>
          <Input
            id="kanji-strokeCount"
            type="number"
            min={1}
            max={2147483647}
            step={1}
            disabled={busy || unavailable}
            aria-invalid={Boolean(errors.strokeCount)}
            aria-describedby="kanji-strokeCount-error"
            {...register('strokeCount', {
              setValueAs: (value: string | number | null) =>
                value === '' || value === null ? null : Number(value),
            })}
          />
          <p id="kanji-strokeCount-error" className="text-xs text-rose-700">
            {errors.strokeCount?.message}
          </p>
        </div>
        {unavailable ? (
          <p role="alert" className="text-sm text-rose-700">
            Nội dung đã bị xóa hoặc chuyển khỏi bài học. Hãy đóng biểu mẫu và tải lại danh sách.
          </p>
        ) : (
          errors.root && (
            <p role="alert" className="text-sm text-rose-700">
              {errors.root.message}
            </p>
          )
        )}
      </form>
    </LessonContentFormDialog>
  );
}
