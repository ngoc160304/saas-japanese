'use client';

import { useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { AdminJlptQuestionValues } from '../admin-jlpt-question';

export function AdminJlptQuestionAnswers({
  form,
  disabled,
  canChange,
}: {
  form: UseFormReturn<AdminJlptQuestionValues>;
  disabled: boolean;
  canChange: () => boolean;
}) {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'answers',
  });
  const values = useWatch({ control: form.control, name: 'answers' });
  const errors = form.formState.errors.answers;
  return (
    <PageSection>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <h2 id="question-answers-title" className="text-lg font-semibold text-slate-900">
            Các lựa chọn trả lời
          </h2>
          <p className="text-xs text-slate-600">
            Ít nhất hai đáp án có nội dung; chọn duy nhất một đáp án đúng. Thứ tự được lưu cùng câu
            hỏi.
          </p>
        </div>
        <Button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (canChange())
              append(
                { answerText: '', isCorrect: false },
                { focusName: `answers.${fields.length}.answerText` },
              );
          }}
        >
          <Plus />
          Thêm đáp án
        </Button>
      </div>
      <div
        role="radiogroup"
        aria-labelledby="question-answers-title"
        aria-describedby="question-answers-error"
        className="space-y-3"
      >
        {fields.map((field, index) => {
          const correct = values[index]?.isCorrect === true;
          const error = errors?.[index];
          const label = `đáp án ${index + 1}`;
          return (
            <div
              key={field.id}
              data-answer-key={field.id}
              className={`min-w-0 space-y-3 rounded-2xl border p-4 ${correct ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correct}
                    disabled={disabled}
                    value={field.id}
                    aria-label={`Chọn ${label} đúng`}
                    className="size-4 accent-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2"
                    onChange={() => {
                      if (!canChange()) return;
                      form
                        .getValues('answers')
                        .forEach((_answer, i) =>
                          form.setValue(`answers.${i}.isCorrect`, i === index, {
                            shouldDirty: true,
                            shouldValidate: true,
                          }),
                        );
                    }}
                  />
                  {correct ? '✓ Đáp án đúng' : 'Chọn đáp án đúng'} · {index + 1}
                </label>
                <div className="flex gap-1" role="group" aria-label={`Thao tác ${label}`}>
                  {([-1, 1] as const).map((direction) => {
                    const blocked =
                      disabled || (direction === -1 ? index === 0 : index === fields.length - 1);
                    const Icon = direction === -1 ? ArrowUp : ArrowDown;
                    return (
                      <Button
                        key={direction}
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`${direction === -1 ? 'Chuyển lên' : 'Chuyển xuống'} ${label}`}
                        aria-disabled={blocked}
                        className="bg-white text-slate-700 aria-disabled:text-slate-400"
                        onClick={() => {
                          if (!blocked && canChange()) move(index, index + direction);
                        }}
                      >
                        <Icon />
                      </Button>
                    );
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={disabled || fields.length <= 2}
                    aria-label={`Xóa ${label}`}
                    className="bg-white text-rose-700"
                    onClick={() => {
                      if (fields.length > 2 && canChange()) {
                        remove(index);
                        void form.trigger('answers');
                      }
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <label htmlFor={`answer-${field.id}`} className="sr-only">
                Nội dung {label}
              </label>
              <Textarea
                id={`answer-${field.id}`}
                {...form.register(`answers.${index}.answerText`)}
                maxLength={500}
                rows={2}
                aria-invalid={Boolean(error?.answerText)}
                aria-describedby={`answer-${field.id}-error`}
                className="min-h-20 rounded-xl bg-white text-sm leading-relaxed text-slate-900"
              />
              <p id={`answer-${field.id}-error`} className="text-xs text-rose-700">
                {error?.answerText?.message ?? error?.isCorrect?.message}
              </p>
            </div>
          );
        })}
      </div>
      <p
        id="question-answers-error"
        role={errors ? 'alert' : undefined}
        className="text-sm text-rose-700"
      >
        {errors?.root?.message ?? errors?.message}
      </p>
    </PageSection>
  );
}
