'use client';

import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { adminJlptExamsAPI as api } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.api';
import { adminJlptExamKeys as keys } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.keys';
import type {
  AdminJlptExamPath,
  AdminJlptExamDetail,
  AdminJlptExamQuery,
  AdminJlptExamStatsQuery,
} from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';
import { getApiError } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import { selectAuthInitialized, selectIsAuthenticated } from '@/store/authSlice';

function useSessionReady() {
  const initialized = useAppSelector(selectAuthInitialized);
  const authenticated = useAppSelector(selectIsAuthenticated);
  return initialized && authenticated;
}

export function useAdminJlptExamList(params: AdminJlptExamQuery) {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: keys.list(params),
    queryFn: ({ signal }) => api.list(params, signal),
    enabled,
    retry: false,
  });
}

export function useAdminJlptExamStats(params: AdminJlptExamStatsQuery, verifyAccess = false) {
  const enabled = useSessionReady();
  return useQuery({
    queryKey: keys.stats(params),
    queryFn: ({ signal }) => api.stats(params, signal),
    enabled,
    retry: false,
    ...(verifyAccess ? { staleTime: 0, refetchOnMount: 'always' as const } : {}),
  });
}

export function useAdminJlptExamDetail(examId: number, freshOnMount = false) {
  const ready = useSessionReady();
  const client = useQueryClient();
  return useQuery({
    queryKey: keys.detail(examId),
    queryFn: async ({ signal }) => {
      const data = await api.detail(examId, signal);
      const previous = client.getQueryData<AdminJlptExamDetail>(keys.detail(examId));
      // A background read may discover another admin's changes. There is no server revision token.
      if (previous && JSON.stringify(previous) !== JSON.stringify(data))
        await invalidateAdminJlptValidation(client, examId);
      return data;
    },
    enabled: ready && Number.isSafeInteger(examId) && examId > 0,
    retry: false,
    ...(freshOnMount ? { staleTime: 0, refetchOnMount: 'always' as const } : {}),
  });
}

export function useAdminJlptExamValidation(examId: number, enabled = true) {
  const ready = useSessionReady();
  return useQuery({
    queryKey: keys.validation(examId),
    queryFn: ({ signal }) => api.validation(examId, signal),
    enabled: ready && enabled && Number.isSafeInteger(examId) && examId > 0,
    retry: false,
    // Content mutations explicitly mark this snapshot stale. Only a new check can certify it.
    staleTime: Infinity,
    refetchOnMount: 'always',
  });
}

async function invalidateAdminJlptValidation(client: QueryClient, examId: number) {
  const queryKey = keys.validation(examId);
  // A late read snapshot must not turn changed content back into a fresh "ready" result.
  await client.cancelQueries({ queryKey });
  await client.invalidateQueries({ queryKey, refetchType: 'none' });
}

export async function invalidateAdminJlptExam(client: QueryClient, examId?: number) {
  await Promise.all([
    client.invalidateQueries({ queryKey: keys.lists() }),
    client.invalidateQueries({ queryKey: keys.statistics() }),
    ...(examId === undefined
      ? []
      : [
          client.invalidateQueries({ queryKey: keys.detail(examId) }),
          invalidateAdminJlptValidation(client, examId),
        ]),
  ]);
}

// All content/lifecycle writes can change counts, duration, locks or readiness.
// Do not splice partial hierarchy responses or optimistically reorder cached data.
function useExamMutation<Variables extends AdminJlptExamPath, Result>(
  mutationFn: (v: Variables) => Promise<Result>,
  detailResult?: (result: Result) => AdminJlptExamDetail,
) {
  const client = useQueryClient();
  return useMutation({
    mutationKey: [...keys.all, 'write'],
    mutationFn,
    retry: false,
    onSuccess: (data, variables) => {
      if (detailResult) client.setQueryData(keys.detail(variables.examId), detailResult(data));
      return invalidateAdminJlptExam(client, variables.examId);
    },
    onError: (error, variables) => {
      const status = getApiError(error).status;
      if (status === 400 || status === 404 || status === 409)
        return invalidateAdminJlptExam(client, variables.examId);
    },
  });
}

export function adminJlptWriteFilter(examId: number) {
  return {
    mutationKey: [...keys.all, 'write'],
    predicate: (mutation: { state: { variables?: unknown } }) => {
      const value = mutation.state.variables;
      return (
        typeof value === 'object' && value !== null && 'examId' in value && value.examId === examId
      );
    },
  };
}

export function useAdminJlptExamWriting(examId: number) {
  return useIsMutating(adminJlptWriteFilter(examId)) > 0;
}

export function useCreateAdminJlptExam() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.create,
    retry: false,
    onSuccess: async (data) => {
      client.setQueryData(keys.detail(data.id), data);
      await invalidateAdminJlptExam(client);
    },
  });
}

export const useUpdateAdminJlptExam = () => useExamMutation(api.update);
export const useArchiveAdminJlptExam = () => useExamMutation(api.archive);
export const usePublishAdminJlptExam = () => useExamMutation(api.publish, (detail) => detail);
export const useUnpublishAdminJlptExam = () => useExamMutation(api.unpublish, (detail) => detail);
export const useCreateAdminJlptSession = () => useExamMutation(api.createSession);
export const useUpdateAdminJlptSession = () => useExamMutation(api.updateSession);
export const useSortAdminJlptSession = () => useExamMutation(api.sortSession);
export const useDeleteAdminJlptSession = () => useExamMutation(api.deleteSession);
export const useReorderAdminJlptSessions = () => useExamMutation(api.reorderSessions);
export const useCreateAdminJlptPart = () => useExamMutation(api.createPart);
export const useUpdateAdminJlptPart = () => useExamMutation(api.updatePart);
export const useSortAdminJlptPart = () => useExamMutation(api.sortPart);
export const useDeleteAdminJlptPart = () => useExamMutation(api.deletePart);
export const useReorderAdminJlptParts = () => useExamMutation(api.reorderParts);
export const useCreateAdminJlptQuestion = () => useExamMutation(api.createQuestion);
export const useUpdateAdminJlptQuestion = () => useExamMutation(api.updateQuestion);
export const useCreateAdminJlptQuestionWithAnswers = () =>
  useExamMutation(api.createQuestionWithAnswers);
export const useUpdateAdminJlptQuestionWithAnswers = () =>
  useExamMutation(api.updateQuestionWithAnswers);
export const useSortAdminJlptQuestion = () => useExamMutation(api.sortQuestion);
export const useDeleteAdminJlptQuestion = () => useExamMutation(api.deleteQuestion);
export const useReorderAdminJlptQuestions = () => useExamMutation(api.reorderQuestions);
export const useCreateAdminJlptAnswer = () => useExamMutation(api.createAnswer);
export const useUpdateAdminJlptAnswer = () => useExamMutation(api.updateAnswer);
export const useSortAdminJlptAnswer = () => useExamMutation(api.sortAnswer);
export const useDeleteAdminJlptAnswer = () => useExamMutation(api.deleteAnswer);
export const useReorderAdminJlptAnswers = () => useExamMutation(api.reorderAnswers);
// Upload alone creates unused media; attachment mutations invalidate the exam.
export const useUploadAdminJlptImage = () =>
  useMutation({ mutationFn: api.uploadImage, retry: false });
export const useUploadAdminJlptAudio = () =>
  useMutation({ mutationFn: api.uploadAudio, retry: false });
