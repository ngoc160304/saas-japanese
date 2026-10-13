import authorizeAxiosInstance, { waitForSessionRefresh } from '@/lib/authorize-axios';
import type { GetJlptAttemptHistoryResponse, GetJlptAttemptResultResponse, GetJlptAttemptReviewResponse, GetJlptExamResponse, GetJlptExamStructureResponse, GetJlptExamsResponse, JlptAttemptHistoryQuery, JlptExamsQuery, SaveJlptAnswerRequest, SaveJlptAnswerResponse, StartJlptAttemptRequest, StartJlptAttemptResponse, SubmitJlptAttemptResponse } from './jlpt-exams.type';

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

async function startJlptAttempt(examId: number, data: StartJlptAttemptRequest) {
  await waitForSessionRefresh();
  const response = await authorizeAxiosInstance.post<StartJlptAttemptResponse>(
    `/jlpt-exams/${examId}/attempts`,
    data,
    { localErrorHandling: true },
  );
  return response.data.data;
}

async function saveJlptAnswer(attemptId: number, attemptSessionId: number, data: SaveJlptAnswerRequest) {
  await waitForSessionRefresh();
  const response = await authorizeAxiosInstance.put<SaveJlptAnswerResponse>(
    `/jlpt-exams/attempts/${attemptId}/sessions/${attemptSessionId}/answers`, data,
    { localErrorHandling: true },
  );
  return response.data.data;
}

async function submitJlptAttempt(attemptId: number) {
  await waitForSessionRefresh();
  const response = await authorizeAxiosInstance.post<SubmitJlptAttemptResponse>(
    `/jlpt-exams/attempts/${attemptId}/submit`, undefined, { localErrorHandling: true },
  );
  return response.data.data;
}

async function getJlptAttemptReview(attemptId: number, signal?: AbortSignal) {
  await waitForSessionRefresh();
  const response = await authorizeAxiosInstance.get<GetJlptAttemptReviewResponse>(
    `/jlpt-exams/attempts/${attemptId}/review`, { signal, localErrorHandling: true },
  );
  return response.data.data;
}

async function getJlptAttemptResult(attemptId: number, signal?: AbortSignal) {
  await waitForSessionRefresh();
  const response = await authorizeAxiosInstance.get<GetJlptAttemptResultResponse>(
    `/jlpt-exams/attempts/${attemptId}/result`, { signal, localErrorHandling: true },
  );
  return response.data.data;
}

async function getJlptAttemptHistory(params: JlptAttemptHistoryQuery, signal?: AbortSignal) {
  await waitForSessionRefresh();
  const response = await authorizeAxiosInstance.get<GetJlptAttemptHistoryResponse>(
    '/jlpt-exams/attempts/history', { params, signal, localErrorHandling: true },
  );
  return response.data.data;
}

export const jlptExamsQueryKeys = {
  list: (params: JlptExamsQuery) => ['jlpt-exams', 'list', params] as const,
  detail: (examId: number) => ['jlpt-exams', 'detail', examId] as const,
  structure: (examId: number) => ['jlpt-exams', 'structure', examId] as const,
  review: (attemptId: number) => ['jlpt-exams', 'attempts', attemptId, 'review'] as const,
  result: (attemptId: number) => ['jlpt-exams', 'attempts', attemptId, 'result'] as const,
  history: (params: JlptAttemptHistoryQuery) => ['jlpt-exams', 'attempts', 'history', params] as const,
};

export const jlptExamsAPI = { getJlptExams, getJlptExam, getJlptExamStructure, startJlptAttempt, saveJlptAnswer, submitJlptAttempt, getJlptAttemptReview, getJlptAttemptResult, getJlptAttemptHistory };
