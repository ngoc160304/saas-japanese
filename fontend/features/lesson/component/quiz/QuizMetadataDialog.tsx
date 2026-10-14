'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getQuizError, type AdminQuiz } from '@/apis/lessons/admin-quiz.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { quizMetadataSchema, type QuizMetadataValues } from '../../schemas/quiz.schema';
import { LessonContentFormDialog } from '../LessonContentFormDialog';

export function QuizMetadataDialog({
  quiz,
  pending,
  unavailable,
  onClose,
  onSubmit,
}: {
  quiz: AdminQuiz | null;
  pending: boolean;
  unavailable: boolean;
  onClose: () => void;
  onSubmit: (values: QuizMetadataValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<QuizMetadataValues>({
    resolver: zodResolver(quizMetadataSchema),
    defaultValues: { title: quiz?.title ?? '', description: quiz?.description ?? '' },
  });
  const busy = pending || isSubmitting;
  return (
    <LessonContentFormDialog
      title={quiz ? 'Sửa thông tin Quiz' : 'Tạo Quiz'}
      dirty={isDirty}
      pending={busy}
      onClose={onClose}
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          try {
            await onSubmit(values);
          } catch (error) {
            const failure = getQuizError(error);
            for (const name of ['title', 'description'] as const)
              if (failure.fieldErrors[name]) setError(name, { message: failure.fieldErrors[name] });
            setError('root', { message: failure.message });
          }
        })}
      >
        <div>
          <label htmlFor="quiz-title" className="mb-1 block font-semibold">
            Tên Quiz *
          </label>
          <Input
            id="quiz-title"
            {...register('title')}
            maxLength={200}
            disabled={busy || unavailable}
            aria-invalid={!!errors.title}
            aria-describedby="quiz-title-error"
          />
          <p id="quiz-title-error" className="text-xs text-rose-700">
            {errors.title?.message}
          </p>
        </div>
        <div>
          <label htmlFor="quiz-description" className="mb-1 block font-semibold">
            Mô tả
          </label>
          <Textarea
            id="quiz-description"
            {...register('description')}
            maxLength={500}
            disabled={busy || unavailable}
            aria-invalid={!!errors.description}
            aria-describedby="quiz-description-error"
          />
          <p id="quiz-description-error" className="text-xs text-rose-700">
            {errors.description?.message}
          </p>
        </div>
        {unavailable && (
          <p role="alert">
            Quiz đã thay đổi hoặc không còn tồn tại. Hãy đóng biểu mẫu để xem nội dung hiện tại.
          </p>
        )}
        {errors.root && (
          <p role="alert" className="text-sm text-rose-700">
            {errors.root.message}
          </p>
        )}
        <Button
          type="submit"
          disabled={busy || unavailable}
          className="w-full bg-primary text-white hover:bg-primary/90"
        >
          {busy ? 'Đang lưu…' : quiz ? 'Lưu thông tin Quiz' : 'Tạo Quiz nháp'}
        </Button>
      </form>
    </LessonContentFormDialog>
  );
}
