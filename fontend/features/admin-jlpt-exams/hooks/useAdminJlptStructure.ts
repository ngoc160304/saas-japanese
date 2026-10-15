'use client';

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios from 'axios';
import { adminJlptExamKeys } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.keys';
import type { AdminJlptExamDetail } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';
import { getAdminJlptError } from '../admin-jlpt-error';
import {
  adminJlptContentLock,
  adminJlptMoveIds,
  adminJlptPartPayload,
  adminJlptSessionPayload,
  type AdminJlptStructureAction,
} from '../admin-jlpt-structure';
import {
  invalidateAdminJlptExam,
  adminJlptWriteFilter,
  useCreateAdminJlptPart,
  useCreateAdminJlptSession,
  useDeleteAdminJlptPart,
  useDeleteAdminJlptQuestion,
  useDeleteAdminJlptSession,
  useReorderAdminJlptParts,
  useReorderAdminJlptQuestions,
  useReorderAdminJlptSessions,
  useUpdateAdminJlptPart,
  useUpdateAdminJlptSession,
} from './useAdminJlptExams';

const rejected = (message: string, status = 409) => ({ status, message, fieldErrors: {} });

export function useAdminJlptStructure(examId: number) {
  const client = useQueryClient();
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ReturnType<typeof getAdminJlptError> | null>(null);
  const createSession = useCreateAdminJlptSession(),
    updateSession = useUpdateAdminJlptSession();
  const createPart = useCreateAdminJlptPart(),
    updatePart = useUpdateAdminJlptPart();
  const deleteSession = useDeleteAdminJlptSession(),
    deletePart = useDeleteAdminJlptPart(),
    deleteQuestion = useDeleteAdminJlptQuestion();
  const reorderSessions = useReorderAdminJlptSessions(),
    reorderParts = useReorderAdminJlptParts(),
    reorderQuestions = useReorderAdminJlptQuestions();

  const run = async (action: AdminJlptStructureAction) => {
    // An exam-wide gate also covers synchronous double clicks before React renders.
    if (inFlight.current || client.isMutating(adminJlptWriteFilter(examId))) throw rejected('Một thay đổi đề thi đang được lưu.');
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      const key = adminJlptExamKeys.detail(examId);
      const exam = client.getQueryData<AdminJlptExamDetail>(key);
      const state = client.getQueryState(key);
      if (!exam || state?.status !== 'success' || state.fetchStatus !== 'idle')
        throw rejected('Chưa xác minh được cấu trúc hiện tại. Hãy tải lại trước khi lưu.');
      const lock = adminJlptContentLock(exam);
      if (lock) throw rejected(lock);
      const sessionId = 'target' in action ? action.target.sessionId : action.sessionId;
      const session = exam.sessions.find((item) => item.id === sessionId);
      if (action.kind !== 'save-session' || sessionId !== undefined) {
        if (!session) throw rejected('Phiên thi không còn thuộc đề thi này.', 404);
      }
      if (action.kind === 'save-session') {
        const data = adminJlptSessionPayload(action.values);
        if (action.sessionId === undefined) await createSession.mutateAsync({ examId, data });
        else await updateSession.mutateAsync({ examId, sessionId: action.sessionId, data });
      } else if (action.kind === 'save-part') {
        const part = session?.parts.find((item) => item.id === action.partId);
        if (action.partId !== undefined && !part)
          throw rejected('Phần thi không còn thuộc phiên thi này.', 404);
        const data = adminJlptPartPayload(action.values, part);
        if (action.partId === undefined)
          await createPart.mutateAsync({ examId, sessionId: action.sessionId, data });
        else
          await updatePart.mutateAsync({
            examId,
            sessionId: action.sessionId,
            partId: action.partId,
            data,
          });
      } else {
        const target = action.target;
        const path = { examId, sessionId: target.sessionId };
        const part =
          target.kind === 'session'
            ? undefined
            : session?.parts.find((item) => item.id === target.partId);
        if (target.kind !== 'session' && !part)
          throw rejected('Phần thi không còn thuộc phiên thi này.', 404);
        if (
          target.kind === 'question' &&
          !part?.questions.some((item) => item.id === target.questionId)
        )
          throw rejected('Câu hỏi không còn thuộc phần thi này.', 404);
        if (action.kind === 'delete') {
          if (target.kind === 'session') await deleteSession.mutateAsync(path);
          else if (target.kind === 'part')
            await deletePart.mutateAsync({ ...path, partId: target.partId });
          else
            await deleteQuestion.mutateAsync({
              ...path,
              partId: target.partId,
              questionId: target.questionId,
            });
        } else {
          const siblings =
            target.kind === 'session'
              ? exam.sessions
              : target.kind === 'part'
                ? session?.parts
                : part?.questions;
          const id =
            target.kind === 'session'
              ? target.sessionId
              : target.kind === 'part'
                ? target.partId
                : target.questionId;
          const ids = siblings && adminJlptMoveIds(siblings, id, action.direction);
          if (!ids) throw rejected('Không thể chuyển quá đầu hoặc cuối danh sách.');
          if (target.kind === 'session')
            await reorderSessions.mutateAsync({ examId, data: { ids } });
          else if (target.kind === 'part')
            await reorderParts.mutateAsync({ ...path, data: { ids } });
          else
            await reorderQuestions.mutateAsync({ ...path, partId: target.partId, data: { ids } });
        }
      }
      toast.success(
        action.kind === 'move'
          ? 'Đã lưu thứ tự.'
          : action.kind === 'delete'
            ? 'Đã xóa nội dung.'
            : 'Đã lưu thay đổi.',
      );
    } catch (cause) {
      const parsed = getAdminJlptError(cause);
      setError(parsed);
      // Existing hooks refresh 400/404/409; also reconcile uncertain network/auth failures.
      if (!axios.isAxiosError(cause) || ![400, 404, 409].includes(parsed.status ?? 0))
        await invalidateAdminJlptExam(client, examId);
      throw cause;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };
  return { run, pending, error };
}
