import authorizeAxiosInstance from '@/lib/authorize-axios';
import { getApiError } from '@/lib/api-error';
import type { ApiResponse } from '@/types/api';
import type { StudyQuizQuestion } from './lesson-content.api';

export interface AdminQuizQuestion extends StudyQuizQuestion {
  authoringSupported: boolean;
  createdAt: string;
  updatedAt: string;
  options: (StudyQuizQuestion['options'][number] & { isCorrect: boolean })[];
}
export interface AdminQuiz {
  id: number;
  lessonId: number;
  title: string;
  description: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  questions: AdminQuizQuestion[];
}
export interface QuizMetadataInput {
  title: string;
  description: string;
}
export interface QuizQuestionInput {
  questionText: string;
  questionType: 'SINGLE_CHOICE';
  options: { id?: number; optionText: string; isCorrect: boolean }[];
}
type QuizTarget = { lessonId: number; quizId: number };
const path = (lessonId: number) => `/admin/lessons/${lessonId}/quiz`;
const config = { localErrorHandling: true };
export const adminQuizKey = (lessonId: number) => ['admin', 'lessons', lessonId, 'quiz'] as const;
function normalize(quiz: AdminQuiz): AdminQuiz {
  return {
    ...quiz,
    questions: [...quiz.questions]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
      .map((question) => ({
        ...question,
        options: [...question.options].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
      })),
  };
}
export const adminQuizAPI = {
  get: async (lessonId: number, signal?: AbortSignal): Promise<AdminQuiz | null> => {
    const response = await authorizeAxiosInstance.get<ApiResponse<AdminQuiz>>(path(lessonId), {
      ...config,
      signal,
    });
    return response.status === 204 ? null : normalize(response.data.data);
  },
  create: async ({ lessonId, data }: { lessonId: number; data: QuizMetadataInput }) =>
    normalize(
      (await authorizeAxiosInstance.post<ApiResponse<AdminQuiz>>(path(lessonId), data, config)).data
        .data,
    ),
  update: async ({ lessonId, quizId, data }: QuizTarget & { data: QuizMetadataInput }) =>
    normalize(
      (
        await authorizeAxiosInstance.put<ApiResponse<AdminQuiz>>(
          `${path(lessonId)}/${quizId}`,
          data,
          config,
        )
      ).data.data,
    ),
  publication: async ({ lessonId, quizId, isPublished }: QuizTarget & { isPublished: boolean }) =>
    normalize(
      (
        await authorizeAxiosInstance.patch<ApiResponse<AdminQuiz>>(
          `${path(lessonId)}/${quizId}/publication`,
          { isPublished },
          config,
        )
      ).data.data,
    ),
  delete: async ({ lessonId, quizId }: QuizTarget) => {
    await authorizeAxiosInstance.delete(`${path(lessonId)}/${quizId}`, config);
  },
  createQuestion: async ({ lessonId, quizId, data }: QuizTarget & { data: QuizQuestionInput }) =>
    normalize(
      (
        await authorizeAxiosInstance.post<ApiResponse<AdminQuiz>>(
          `${path(lessonId)}/${quizId}/questions`,
          data,
          config,
        )
      ).data.data,
    ),
  updateQuestion: async ({
    lessonId,
    quizId,
    questionId,
    data,
  }: QuizTarget & { questionId: number; data: QuizQuestionInput }) =>
    normalize(
      (
        await authorizeAxiosInstance.put<ApiResponse<AdminQuiz>>(
          `${path(lessonId)}/${quizId}/questions/${questionId}`,
          data,
          config,
        )
      ).data.data,
    ),
  deleteQuestion: async ({ lessonId, quizId, questionId }: QuizTarget & { questionId: number }) => {
    await authorizeAxiosInstance.delete(
      `${path(lessonId)}/${quizId}/questions/${questionId}`,
      config,
    );
  },
  reorder: async ({ lessonId, quizId, questionIds }: QuizTarget & { questionIds: number[] }) =>
    normalize(
      (
        await authorizeAxiosInstance.put<ApiResponse<AdminQuiz>>(
          `${path(lessonId)}/${quizId}/questions/order`,
          { questionIds },
          config,
        )
      ).data.data,
    ),
};

/** Only whitelisted business messages are translated; infrastructure errors retain the shared safe fallback. */
export function getQuizError(error: unknown) {
  const failure = getApiError(error);
  const message = failure.message;
  if (message.includes('Multiple active quizzes'))
    failure.message =
      'Bài học có nhiều Quiz đang tồn tại. Vui lòng liên hệ quản trị để kiểm tra dữ liệu.';
  else if (message.includes('already has an active quiz'))
    failure.message =
      'Bài học đã có Quiz. Danh sách đang được cập nhật; hãy đóng biểu mẫu để xem Quiz hiện tại.';
  else if (message.includes('not publishable') || message.includes('Publishing requires'))
    failure.message =
      'Quiz cần ít nhất một câu hỏi chọn một đáp án, mỗi câu có ít nhất hai lựa chọn và đúng một đáp án đúng. Nếu đang xuất bản, hãy ẩn Quiz trước khi xóa câu hỏi cuối hoặc sửa nội dung chưa hợp lệ.';
  else if (
    message.includes('read-only') ||
    message.includes('unsupported question') ||
    message.includes('Only SINGLE_CHOICE')
  )
    failure.message =
      'Loại câu hỏi này hiện chỉ có thể xem. Chỉ hỗ trợ soạn câu hỏi chọn một đáp án.';
  else if (message.includes('referenced by existing'))
    failure.message =
      'Lựa chọn này đang được sử dụng trong dữ liệu đã lưu nên chưa thể xóa. Hãy giữ lại lựa chọn đó.';
  else if (message.includes('every active question'))
    failure.message = 'Danh sách câu hỏi đã thay đổi. Hãy tải lại rồi sắp xếp lại.';
  else if (message.includes('Option IDs'))
    failure.message =
      'Các lựa chọn đã thay đổi hoặc không còn thuộc câu hỏi này. Hãy mở lại câu hỏi.';
  else if (failure.status === 404)
    failure.message = 'Quiz, câu hỏi hoặc bài học không còn tồn tại. Hãy tải lại nội dung.';
  return failure;
}

/** Strip grading fields before handing data to a learner-style presentational component. */
export function quizPreviewQuestions(quiz: AdminQuiz): StudyQuizQuestion[] {
  return quiz.questions.map(({ id, questionType, questionText, sortOrder, options }) => ({
    id,
    questionType,
    questionText,
    sortOrder,
    options: options.map(({ id: optionId, optionText, sortOrder: order }) => ({
      id: optionId,
      optionText,
      sortOrder: order,
    })),
  }));
}
