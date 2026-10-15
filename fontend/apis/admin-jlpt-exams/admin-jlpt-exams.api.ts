import authorizeAxios, { waitForSessionRefresh } from '@/lib/authorize-axios';
import type { ApiResponse } from '@/types/api';
import { uploadAPI } from '@/apis/upload/upload.api';
import { validateAdminJlptMedia } from './admin-jlpt-media';
import type {
  AdminJlptAnswer,
  AdminJlptAnswerInput,
  AdminJlptAnswerPath,
  AdminJlptExamDetail,
  AdminJlptExamInput,
  AdminJlptExamPage,
  AdminJlptExamPath,
  AdminJlptExamQuery,
  AdminJlptExamStats,
  AdminJlptExamStatsQuery,
  AdminJlptExamValidation,
  AdminJlptPart,
  AdminJlptPartInput,
  AdminJlptPartPath,
  AdminJlptQuestion,
  AdminJlptQuestionInput,
  AdminJlptQuestionPath,
  AdminJlptReorderInput,
  AdminJlptSession,
  AdminJlptSessionInput,
  AdminJlptSessionPath,
  AdminJlptSortOrderInput,
  AdminJlptWrite,
  CreateAdminJlptQuestionWithAnswersInput,
  UpdateAdminJlptQuestionWithAnswersInput,
} from './admin-jlpt-exams.type';

const base = '/admin/jlpt-exams';
const examPath = ({ examId }: AdminJlptExamPath) => `${base}/${examId}`;
const sessionPath = (path: AdminJlptSessionPath) => `${examPath(path)}/sessions/${path.sessionId}`;
const partPath = (path: AdminJlptPartPath) => `${sessionPath(path)}/parts/${path.partId}`;
const questionPath = (path: AdminJlptQuestionPath) =>
  `${partPath(path)}/questions/${path.questionId}`;
const answerPath = (path: AdminJlptAnswerPath) => `${questionPath(path)}/answers/${path.answerId}`;

async function read<T>(url: string, signal?: AbortSignal, params?: AdminJlptExamQuery) {
  await waitForSessionRefresh();
  const response = await authorizeAxios.get<ApiResponse<T>>(url, {
    params,
    signal,
    localErrorHandling: true,
  });
  return response.data.data;
}

async function write<T>(method: 'post' | 'put' | 'patch', url: string, data?: unknown) {
  await waitForSessionRefresh();
  const response = await authorizeAxios.request<ApiResponse<T>>({
    method,
    url,
    data,
    localErrorHandling: true,
  });
  return response.data.data;
}

async function remove(url: string): Promise<void> {
  await waitForSessionRefresh();
  await authorizeAxios.delete(url, { localErrorHandling: true });
}

function requireValidMedia(file: File, kind: 'image' | 'audio') {
  const message = validateAdminJlptMedia(file, kind);
  if (message) throw { status: 400, message, fieldErrors: { file: message } };
}

/** Stats deliberately strip list-only parameters, even if a caller supplies a wider object. */
export function adminJlptStatsParams({
  search,
  level,
}: AdminJlptExamStatsQuery): AdminJlptExamStatsQuery {
  return { ...(search ? { search } : {}), ...(level ? { level } : {}) };
}

export const adminJlptExamsAPI = {
  async uploadImage({ file }: { file: File }) {
    requireValidMedia(file, 'image');
    return (await uploadAPI.uploadImage(file)).data;
  },
  async uploadAudio({ file, onProgress }: { file: File; onProgress?: (percent: number) => void }) {
    requireValidMedia(file, 'audio');
    return uploadAPI.uploadAudio(file, onProgress);
  },
  list: (params: AdminJlptExamQuery, signal?: AbortSignal) =>
    read<AdminJlptExamPage>(base, signal, params),
  stats: (params: AdminJlptExamStatsQuery, signal?: AbortSignal) =>
    read<AdminJlptExamStats>(`${base}/stats`, signal, adminJlptStatsParams(params)),
  detail: (examId: number, signal?: AbortSignal) =>
    read<AdminJlptExamDetail>(examPath({ examId }), signal),
  validation: (examId: number, signal?: AbortSignal) =>
    read<AdminJlptExamValidation>(`${examPath({ examId })}/validation`, signal),
  create: ({ data }: { data: AdminJlptExamInput }) =>
    write<AdminJlptExamDetail>('post', base, data),
  update: (v: AdminJlptWrite<AdminJlptExamPath, AdminJlptExamInput>) =>
    write<AdminJlptExamDetail>('put', examPath(v), v.data),
  archive: (v: AdminJlptExamPath) => remove(examPath(v)),
  publish: (v: AdminJlptExamPath) => write<AdminJlptExamDetail>('post', `${examPath(v)}/publish`),
  unpublish: (v: AdminJlptExamPath) =>
    write<AdminJlptExamDetail>('post', `${examPath(v)}/unpublish`),

  session: (v: AdminJlptSessionPath, signal?: AbortSignal) =>
    read<AdminJlptSession>(sessionPath(v), signal),
  createSession: (v: AdminJlptWrite<AdminJlptExamPath, AdminJlptSessionInput>) =>
    write<AdminJlptSession>('post', `${examPath(v)}/sessions`, v.data),
  updateSession: (v: AdminJlptWrite<AdminJlptSessionPath, AdminJlptSessionInput>) =>
    write<AdminJlptSession>('put', sessionPath(v), v.data),
  sortSession: (v: AdminJlptWrite<AdminJlptSessionPath, AdminJlptSortOrderInput>) =>
    write<AdminJlptSession>('patch', `${sessionPath(v)}/sort-order`, v.data),
  deleteSession: (v: AdminJlptSessionPath) => remove(sessionPath(v)),
  reorderSessions: (v: AdminJlptWrite<AdminJlptExamPath, AdminJlptReorderInput>) =>
    write<AdminJlptSession[]>('patch', `${examPath(v)}/sessions/reorder`, v.data),

  part: (v: AdminJlptPartPath, signal?: AbortSignal) => read<AdminJlptPart>(partPath(v), signal),
  createPart: (v: AdminJlptWrite<AdminJlptSessionPath, AdminJlptPartInput>) =>
    write<AdminJlptPart>('post', `${sessionPath(v)}/parts`, v.data),
  updatePart: (v: AdminJlptWrite<AdminJlptPartPath, AdminJlptPartInput>) =>
    write<AdminJlptPart>('put', partPath(v), v.data),
  sortPart: (v: AdminJlptWrite<AdminJlptPartPath, AdminJlptSortOrderInput>) =>
    write<AdminJlptPart>('patch', `${partPath(v)}/sort-order`, v.data),
  deletePart: (v: AdminJlptPartPath) => remove(partPath(v)),
  reorderParts: (v: AdminJlptWrite<AdminJlptSessionPath, AdminJlptReorderInput>) =>
    write<AdminJlptPart[]>('patch', `${sessionPath(v)}/parts/reorder`, v.data),

  question: (v: AdminJlptQuestionPath, signal?: AbortSignal) =>
    read<AdminJlptQuestion>(questionPath(v), signal),
  createQuestion: (v: AdminJlptWrite<AdminJlptPartPath, AdminJlptQuestionInput>) =>
    write<AdminJlptQuestion>('post', `${partPath(v)}/questions`, v.data),
  updateQuestion: (v: AdminJlptWrite<AdminJlptQuestionPath, AdminJlptQuestionInput>) =>
    write<AdminJlptQuestion>('put', questionPath(v), v.data),
  createQuestionWithAnswers: (
    v: AdminJlptWrite<AdminJlptPartPath, CreateAdminJlptQuestionWithAnswersInput>,
  ) => write<AdminJlptQuestion>('post', `${partPath(v)}/questions/with-answers`, v.data),
  updateQuestionWithAnswers: (
    v: AdminJlptWrite<AdminJlptQuestionPath, UpdateAdminJlptQuestionWithAnswersInput>,
  ) => write<AdminJlptQuestion>('put', `${questionPath(v)}/with-answers`, v.data),
  sortQuestion: (v: AdminJlptWrite<AdminJlptQuestionPath, AdminJlptSortOrderInput>) =>
    write<AdminJlptQuestion>('patch', `${questionPath(v)}/sort-order`, v.data),
  deleteQuestion: (v: AdminJlptQuestionPath) => remove(questionPath(v)),
  reorderQuestions: (v: AdminJlptWrite<AdminJlptPartPath, AdminJlptReorderInput>) =>
    write<AdminJlptQuestion[]>('patch', `${partPath(v)}/questions/reorder`, v.data),

  answer: (v: AdminJlptAnswerPath, signal?: AbortSignal) =>
    read<AdminJlptAnswer>(answerPath(v), signal),
  createAnswer: (v: AdminJlptWrite<AdminJlptQuestionPath, AdminJlptAnswerInput>) =>
    write<AdminJlptAnswer>('post', `${questionPath(v)}/answers`, v.data),
  updateAnswer: (v: AdminJlptWrite<AdminJlptAnswerPath, AdminJlptAnswerInput>) =>
    write<AdminJlptAnswer>('put', answerPath(v), v.data),
  sortAnswer: (v: AdminJlptWrite<AdminJlptAnswerPath, AdminJlptSortOrderInput>) =>
    write<AdminJlptAnswer>('patch', `${answerPath(v)}/sort-order`, v.data),
  deleteAnswer: (v: AdminJlptAnswerPath) => remove(answerPath(v)),
  reorderAnswers: (v: AdminJlptWrite<AdminJlptQuestionPath, AdminJlptReorderInput>) =>
    write<AdminJlptAnswer[]>('patch', `${questionPath(v)}/answers/reorder`, v.data),
};
