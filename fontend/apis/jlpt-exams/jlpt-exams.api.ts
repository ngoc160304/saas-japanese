import authorizeAxiosInstance, { waitForSessionRefresh } from '@/lib/authorize-axios';
import type { GetJlptExamResponse, GetJlptExamStructureResponse, GetJlptExamsResponse, JlptExamsQuery } from './jlpt-exams.type';

async function getJlptExams(params: JlptExamsQuery, signal?: AbortSignal) {
  await waitForSessionRefresh();
  const response = await authorizeAxiosInstance.get<GetJlptExamsResponse>('/jlpt-exams', {
    params,
    signal,
    localErrorHandling: true,
  });
  return response.data.data;
}

async function getJlptExam(examId: number, signal?: AbortSignal) {
  await waitForSessionRefresh();
  const response = await authorizeAxiosInstance.get<GetJlptExamResponse>(`/jlpt-exams/${examId}`, {
    signal,
    localErrorHandling: true,
  });
  return response.data.data;
}

async function getJlptExamStructure(examId: number, signal?: AbortSignal) {
  await waitForSessionRefresh();
  const response = await authorizeAxiosInstance.get<GetJlptExamStructureResponse>(`/jlpt-exams/${examId}/detail`, {
    signal,
    localErrorHandling: true,
  });
  return response.data.data;
}

export const jlptExamsQueryKeys = {
  list: (params: JlptExamsQuery) => ['jlpt-exams', 'list', params] as const,
  detail: (examId: number) => ['jlpt-exams', 'detail', examId] as const,
  structure: (examId: number) => ['jlpt-exams', 'structure', examId] as const,
};

export const jlptExamsAPI = { getJlptExams, getJlptExam, getJlptExamStructure };
