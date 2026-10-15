'use client';

import { useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  AdminJlptExamDetail,
  AdminJlptQuestion,
} from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';
import { adminJlptExamKeys } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.keys';
import { adminJlptContentLock } from '../admin-jlpt-structure';
import {
  adminJlptQuestionContext,
  adminJlptCreateQuestionPayload,
  adminJlptUpdateQuestionPayload,
  type AdminJlptQuestionTarget,
  type AdminJlptQuestionValues,
} from '../admin-jlpt-question';
import { getAdminJlptError } from '../admin-jlpt-error';
import {
  invalidateAdminJlptExam,
  useCreateAdminJlptQuestionWithAnswers,
  useUpdateAdminJlptQuestionWithAnswers,
} from './useAdminJlptExams';

const rejected = (message: string) => ({ status: 409, message, fieldErrors: {} });

export function useAdminJlptQuestionSave(examId: number) {
  const client = useQueryClient();
  const create = useCreateAdminJlptQuestionWithAnswers();
  const update = useUpdateAdminJlptQuestionWithAnswers();
  const inFlight = useRef(false);
  return async ({
    target,
    values,
  }: {
    target: AdminJlptQuestionTarget;
    values: AdminJlptQuestionValues;
  }) => {
    if (inFlight.current) throw rejected('Câu hỏi đang được lưu.');
    inFlight.current = true;
    let dispatched = false;
    try {
      const key = adminJlptExamKeys.detail(examId);
      const exam = client.getQueryData<AdminJlptExamDetail>(key);
      const state = client.getQueryState(key);
      if (!exam || state?.status !== 'success' || state.fetchStatus !== 'idle')
        throw rejected('Chưa xác minh được dữ liệu hiện tại. Hãy tải lại trước khi lưu.');
      const lock = adminJlptContentLock(exam);
      if (lock) throw rejected(lock);
      const context = adminJlptQuestionContext(exam, target);
      if (!context) throw rejected('Câu hỏi hoặc phần thi không còn thuộc ngữ cảnh này.');
      const maximum = context.part.questions.length + (target.questionId === undefined ? 1 : 0);
      if (values.position > maximum) throw rejected(`Vị trí hiện tại chỉ từ 1 đến ${maximum}.`);
      let question: AdminJlptQuestion;
      if (context.question) {
        const data = adminJlptUpdateQuestionPayload(values, context.question);
        dispatched = true;
        question = await update.mutateAsync({ ...target, questionId: context.question.id, data });
      } else {
        const data = adminJlptCreateQuestionPayload(values);
        dispatched = true;
        question = await create.mutateAsync({ ...target, data });
      }
      // Mutation onSuccess already awaits detail invalidation/refetch. Reuse that
      // authoritative result for Save & Next instead of issuing a duplicate GET.
      const reconciled = client.getQueryState<AdminJlptExamDetail>(key);
      const detail =
        reconciled?.status === 'success' &&
        reconciled.fetchStatus === 'idle' &&
        !reconciled.isInvalidated
          ? reconciled.data
          : null;
      return { question, detail };
    } catch (error) {
      // Existing hooks already reconcile 400/404/409. Also refresh uncertain errors.
      if (!dispatched || ![400, 404, 409].includes(getAdminJlptError(error).status ?? 0))
        await invalidateAdminJlptExam(client, examId);
      throw error;
    } finally {
      inFlight.current = false;
    }
  };
}
