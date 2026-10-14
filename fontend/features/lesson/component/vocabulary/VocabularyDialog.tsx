'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { VocabularyItem } from '@/apis/lessons/lesson-content.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getApiError } from '@/lib/api-error';
import { vocabularySchema, type VocabularyValues } from '../../schemas/lesson-content.schema';
import { LessonContentFormDialog } from '../LessonContentFormDialog';

const fields = [
  {
    name: 'word',
    label: 'Từ vựng',
    required: true,
    max: 100,
    example: '食べる / コーヒー',
    multiline: false,
  },
  {
    name: 'reading',
    label: 'Cách đọc',
    required: true,
    max: 150,
    example: 'たべる',
    multiline: false,
  },
  {
    name: 'meaningVi',
    label: 'Nghĩa tiếng Việt',
    required: true,
    max: 500,
    example: 'Ăn',
    multiline: true,
  },
  {
    name: 'partOfSpeech',
    label: 'Từ loại',
    required: false,
    max: 50,
    example: 'Động từ nhóm 2',
    multiline: false,
  },
  {
    name: 'exampleSentenceJp',
    label: 'Ví dụ tiếng Nhật',
    required: false,
    max: 1000,
    example: '毎日、朝ご飯を食べます。',
    multiline: true,
  },
  {
    name: 'exampleSentenceVi',
    label: 'Dịch nghĩa ví dụ',
    required: false,
    max: 1000,
    example: 'Tôi ăn sáng mỗi ngày.',
    multiline: true,
  },
] as const;

export function VocabularyDialog({
  item,
  pending,
  unavailable,
  onClose,
  onSubmit,
}: {
  item?: VocabularyItem;
  pending: boolean;
  unavailable: boolean;
  onClose: () => void;
  onSubmit: (values: VocabularyValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<VocabularyValues>({
    resolver: zodResolver(vocabularySchema),
    defaultValues: {
      word: item?.word ?? '',
      reading: item?.reading ?? '',
      meaningVi: item?.meaningVi ?? '',
      partOfSpeech: item?.partOfSpeech ?? '',
      exampleSentenceJp: item?.exampleSentenceJp ?? '',
      exampleSentenceVi: item?.exampleSentenceVi ?? '',
    },
  });
  const busy = pending || isSubmitting;
  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      const failure = getApiError(error);
      for (const { name } of fields)
        if (failure.fieldErrors[name]) setError(name, { message: failure.fieldErrors[name] });
      setError('root', { message: failure.message });
    }
  });
  return (
    <LessonContentFormDialog
      title={item ? 'Sửa từ vựng' : 'Thêm từ vựng'}
      dirty={isDirty}
      pending={busy}
      onClose={onClose}
      actions={
        <Button type="submit" form="vocabulary-form" disabled={busy || unavailable} className="bg-primary text-white hover:bg-primary/90">
          {busy ? 'Đang lưu…' : 'Lưu từ vựng'}
        </Button>
      }
    >
      <form id="vocabulary-form" noValidate onSubmit={submit} className="space-y-4">
        {fields.map(({ name, label, required, max, example, multiline }) => {
          const Component = multiline ? Textarea : Input;
          return (
            <div key={name}>
              <label htmlFor={`vocabulary-${name}`} className="mb-1 block text-sm font-semibold">
                {label}
                {required && ' *'}
              </label>
              <Component
                id={`vocabulary-${name}`}
                {...register(name)}
                required={required}
                maxLength={max}
                placeholder={example}
                disabled={busy || unavailable}
                aria-invalid={Boolean(errors[name])}
                aria-describedby={errors[name] ? `vocabulary-${name}-error` : undefined}
                className="rounded-xl border-slate-200 bg-slate-50 text-slate-900"
              />
              {errors[name] && (
                <p id={`vocabulary-${name}-error`} className="text-xs text-rose-700">
                  {errors[name]?.message}
                </p>
              )}
            </div>
          );
        })}
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
