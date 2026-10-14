'use client';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  getQuizError,
  type AdminQuizQuestion,
  type QuizQuestionInput,
} from '@/apis/lessons/admin-quiz.api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  questionInput,
  quizQuestionSchema,
  type QuizQuestionValues,
} from '../../schemas/quiz.schema';
import { LessonContentFormDialog } from '../LessonContentFormDialog';

export function QuizQuestionDialog({
  question,
  pending,
  unavailable,
  onClose,
  onSubmit,
}: {
  question?: AdminQuizQuestion;
  pending: boolean;
  unavailable: boolean;
  onClose: () => void;
  onSubmit: (values: QuizQuestionInput) => Promise<void>;
}) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<QuizQuestionValues>({
    resolver: zodResolver(quizQuestionSchema),
    defaultValues: {
      questionText: question?.questionText ?? '',
      options: question
        ? question.options.map((option) => ({
            persistedId: option.id,
            optionText: option.optionText,
            isCorrect: option.isCorrect,
          }))
        : [0, 1].map(() => ({ persistedId: null, optionText: '', isCorrect: false })),
    },
  });
  const { fields, append, remove, move } = useFieldArray({ control, name: 'options' });
  const values = useWatch({ control, name: 'options' });
  const busy = pending || isSubmitting;
  const disabled = busy || unavailable;
  return (
    <LessonContentFormDialog
      title={question ? 'Sửa câu hỏi' : 'Thêm câu hỏi'}
      dirty={isDirty}
      pending={busy}
      onClose={onClose}
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(async (data) => {
          try {
            await onSubmit(questionInput(data));
          } catch (error) {
            const failure = getQuizError(error);
            if (failure.fieldErrors.questionText)
              setError('questionText', { message: failure.fieldErrors.questionText });
            fields.forEach((_, index) => {
              const message = failure.fieldErrors[`options[${index}].optionText`];
              if (message) setError(`options.${index}.optionText`, { message });
            });
            setError('root', { message: failure.message });
          }
        })}
      >
        <p className="text-xs text-slate-600">
          Chọn một đáp án đúng. Lưu hoặc hủy biểu mẫu trước khi xuất bản hay xem trước.
        </p>
        <div>
          <label htmlFor="quiz-question-text" className="mb-1 block font-semibold">
            Nội dung câu hỏi *
          </label>
          <Textarea
            id="quiz-question-text"
            {...register('questionText')}
            placeholder="「学校」の読み方は？"
            disabled={disabled}
            aria-invalid={!!errors.questionText}
            aria-describedby="quiz-question-error"
          />
          <p id="quiz-question-error" className="text-xs text-rose-700">
            {errors.questionText?.message}
          </p>
        </div>
        <fieldset disabled={disabled} className="space-y-3">
          <legend className="mb-2 font-semibold">Lựa chọn và đáp án đúng *</legend>
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <label htmlFor={`option-${field.id}`} className="block text-sm font-semibold">
                Lựa chọn {index + 1} *
              </label>
              <Textarea
                id={`option-${field.id}`}
                {...register(`options.${index}.optionText`)}
                maxLength={500}
                aria-invalid={!!errors.options?.[index]?.optionText}
                aria-describedby={`option-error-${field.id}`}
              />
              <p id={`option-error-${field.id}`} className="text-xs text-rose-700">
                {errors.options?.[index]?.optionText?.message}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="quiz-correct-option"
                    value={field.id}
                    checked={values[index]?.isCorrect ?? false}
                    onChange={() =>
                      fields.forEach((_, itemIndex) =>
                        setValue(`options.${itemIndex}.isCorrect`, itemIndex === index, {
                          shouldDirty: true,
                          shouldValidate: true,
                        }),
                      )
                    }
                  />
                  Đáp án đúng {index + 1}
                </label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={index === 0}
                    aria-label={`Đưa lựa chọn ${index + 1} lên`}
                    onClick={() => move(index, index - 1)}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={index === fields.length - 1}
                    aria-label={`Đưa lựa chọn ${index + 1} xuống`}
                    onClick={() => move(index, index + 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-label={`Xóa lựa chọn ${index + 1}`}
                    onClick={() => remove(index)}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ persistedId: null, optionText: '', isCorrect: false })}
          >
            Thêm lựa chọn
          </Button>
          <p role="alert" className="text-sm text-rose-700">
            {errors.options?.root?.message ?? errors.options?.message}
          </p>
        </fieldset>
        {unavailable && (
          <p role="alert">Câu hỏi hoặc Quiz không còn tồn tại. Hãy đóng biểu mẫu và tải lại.</p>
        )}
        {errors.root && (
          <p role="alert" className="text-sm text-rose-700">
            {errors.root.message}
          </p>
        )}
        <Button
          type="submit"
          disabled={disabled}
          className="w-full bg-primary text-white hover:bg-primary/90"
        >
          {busy ? 'Đang lưu…' : 'Lưu câu hỏi'}
        </Button>
      </form>
    </LessonContentFormDialog>
  );
}
