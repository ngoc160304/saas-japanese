import authorizeAxiosInstance from '@/lib/authorize-axios';
import type { ApiResponse } from '@/types/api';
import type {
  AnswerQuestion,
  CourseProgress,
  LessonProgress,
  QuizAnswer,
  StudyKanji,
  StudyLesson,
  StudyLessonSummary,
  StudyQuiz,
  StudyVocabulary,
  UpdateLessonProgress,
} from './study.type';

async function getData<T>(url: string, signal?: AbortSignal) {
  const response = await authorizeAxiosInstance.get<ApiResponse<T>>(url, {
    signal,
    localErrorHandling: true,
  });
  return response.data.data;
}

export const studyAPI = {
  getLessons: (courseId: number, signal?: AbortSignal) =>
    getData<StudyLessonSummary[]>(`/study/courses/${courseId}/lessons`, signal),
  getLesson: (lessonId: number, signal?: AbortSignal) =>
    getData<StudyLesson>(`/study/lessons/${lessonId}`, signal),
  getVocabularies: (lessonId: number, signal?: AbortSignal) =>
    getData<StudyVocabulary[]>(`/study/lessons/${lessonId}/vocabularies`, signal),
  getKanjis: (lessonId: number, signal?: AbortSignal) =>
    getData<StudyKanji[]>(`/study/lessons/${lessonId}/kanjis`, signal),
  getLessonProgress: (lessonId: number, signal?: AbortSignal) =>
    getData<LessonProgress>(`/study/lessons/${lessonId}/progress`, signal),
  getCourseProgress: (courseId: number, signal?: AbortSignal) =>
    getData<CourseProgress>(`/study/courses/${courseId}/progress`, signal),
  async getQuiz(lessonId: number, signal?: AbortSignal): Promise<StudyQuiz | null> {
    const response = await authorizeAxiosInstance.get<ApiResponse<StudyQuiz> | ''>(
      `/study/lessons/${lessonId}/quiz`,
      { signal, localErrorHandling: true },
    );
    if (response.status === 204) return null;
    if (response.data === '') throw new Error('Unexpected empty quiz response');
    return response.data.data;
  },
  async answerQuestion({ lessonId, quizId, questionId, optionId }: AnswerQuestion) {
    const response = await authorizeAxiosInstance.post<ApiResponse<QuizAnswer>>(
      `/study/lessons/${lessonId}/quiz/${quizId}/questions/${questionId}/answer`,
      undefined,
      { params: { optionId }, localErrorHandling: true },
    );
    return response.data.data;
  },
  async updateProgress({ lessonId, data }: { lessonId: number; data: UpdateLessonProgress }) {
    const response = await authorizeAxiosInstance.post<ApiResponse<LessonProgress>>(
      `/study/lessons/${lessonId}/progress`,
      data,
      { localErrorHandling: true },
    );
    return response.data.data;
  },
};

export const studyKeys = {
  course: (userId: number, courseId: number) => ['study', userId, courseId] as const,
  lessons: (userId: number, courseId: number) =>
    [...studyKeys.course(userId, courseId), 'lessons'] as const,
  courseProgress: (userId: number, courseId: number) =>
    [...studyKeys.course(userId, courseId), 'progress'] as const,
  lesson: (userId: number, courseId: number, lessonId: number) =>
    [...studyKeys.course(userId, courseId), 'lesson', lessonId] as const,
  detail: (userId: number, courseId: number, lessonId: number) =>
    [...studyKeys.lesson(userId, courseId, lessonId), 'detail'] as const,
  progress: (userId: number, courseId: number, lessonId: number) =>
    [...studyKeys.lesson(userId, courseId, lessonId), 'progress'] as const,
};
