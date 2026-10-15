'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PageSection from '@/components/layout/management/page-section/PageSection';
import type { AdminJlptQuestionValues } from '../admin-jlpt-question';

export function AdminJlptQuestionFields({
  form,
  maximum,
  disabled,
  children,
}: {
  form: UseFormReturn<AdminJlptQuestionValues>;
  maximum: number;
  disabled: boolean;
  children: ReactNode;
}) {
  const errors = form.formState.errors;
  const textField = (
    name: 'questionText' | 'passageText' | 'explanation',
    label: string,
    max: number,
    rows: number,
  ) => (
    <div className="space-y-2">
      <label htmlFor={`question-${name}`} className="text-sm font-semibold text-slate-900">
        {label}
      </label>
      <Textarea
        id={`question-${name}`}
        {...form.register(name)}
        rows={rows}
        maxLength={max}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={`question-${name}-help${errors[name] ? ` question-${name}-error` : ''}`}
        className="min-h-28 rounded-2xl bg-slate-50 text-sm leading-relaxed text-slate-900"
      />
      <p id={`question-${name}-help`} className="text-xs text-slate-600">
        Tối đa {max.toLocaleString('vi-VN')} ký tự. Hỗ trợ HTML như &lt;u&gt;, &lt;p&gt;,
        &lt;br&gt;; máy chủ lọc và chuẩn hóa định dạng khi lưu.
      </p>
      {errors[name] && (
        <p id={`question-${name}-error`} className="text-xs text-rose-700">
          {errors[name].message}
        </p>
      )}
    </div>
  );
  return (
    <>
      <PageSection>
        <fieldset disabled={disabled} className="min-w-0 space-y-4">
          <div className="space-y-1 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-semibold text-slate-900">Thiết lập câu hỏi</h2>
            <p className="text-sm text-slate-600">
              Trắc nghiệm một lựa chọn · Chọn đúng một đáp án đúng.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="question-position" className="text-sm font-semibold text-slate-700">
                Vị trí câu hỏi
              </label>
              <Input
                id="question-position"
                type="number"
                min={1}
                max={maximum}
                step={1}
                {...form.register('position', { valueAsNumber: true })}
                aria-invalid={Boolean(errors.position)}
                aria-describedby="question-position-help question-position-error"
                className="h-11 bg-slate-50 text-slate-900"
              />
              <p id="question-position-help" className="text-xs text-slate-600">
                Vị trí trong phần thi: 1–{maximum}.
              </p>
              <p id="question-position-error" className="text-xs text-rose-700">
                {errors.position?.message}
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="question-points" className="text-sm font-semibold text-slate-700">
                Điểm câu hỏi *
              </label>
              <Input
                id="question-points"
                type="number"
                min={0.01}
                max={999.99}
                step={0.01}
                {...form.register('points', { valueAsNumber: true })}
                aria-invalid={Boolean(errors.points)}
                aria-describedby="question-points-error"
                className="h-11 bg-slate-50 text-slate-900"
              />
              <p id="question-points-error" className="text-xs text-rose-700">
                {errors.points?.message}
              </p>
            </div>
          </div>
        </fieldset>
      </PageSection>
      <PageSection>
        <fieldset disabled={disabled} className="min-w-0 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Nội dung câu hỏi</h2>
          {textField('questionText', 'Câu hỏi tiếng Nhật *', 20000, 5)}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {textField('passageText', 'Đoạn văn / ngữ cảnh (tùy chọn)', 50000, 7)}
          </div>
        </fieldset>
        {children}
      </PageSection>
    </>
  );
}

export function AdminJlptQuestionExplanation({
  form,
}: {
  form: UseFormReturn<AdminJlptQuestionValues>;
}) {
  const error = form.formState.errors.explanation;
  return (
    <PageSection>
      <label htmlFor="question-explanation" className="text-lg font-semibold text-slate-900">
        Giải thích đáp án
      </label>
      <Textarea
        id="question-explanation"
        {...form.register('explanation')}
        rows={6}
        maxLength={20000}
        aria-invalid={Boolean(error)}
        aria-describedby="question-explanation-help question-explanation-error"
        className="min-h-36 rounded-2xl bg-slate-50 text-sm leading-relaxed text-slate-900"
      />
      <p id="question-explanation-help" className="text-xs text-slate-600">
        Tùy chọn, tối đa 20.000 ký tự. Có thể dùng HTML được máy chủ hỗ trợ.
      </p>
      <p id="question-explanation-error" className="text-xs text-rose-700">
        {error?.message}
      </p>
    </PageSection>
  );
}
