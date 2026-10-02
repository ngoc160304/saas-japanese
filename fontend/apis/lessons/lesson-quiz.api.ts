import authorizeAxiosInstance from '@/lib/authorize-axios';
import type { ApiResponse } from '@/types/api';

export interface LessonQuizOption {
  id: number;
  optionText: string;
  sortOrder: number;
}

export interface LessonQuizQuestion {
  id: number;
  questionText: string;
  questionType: string;
  sortOrder: number;
  options: LessonQuizOption[];
}

export interface LessonQuiz {
  id: number;
  title: string;
  description: string | null;
  questions: LessonQuizQuestion[];
}

export async function getLessonQuiz(
  lessonId: number,
  signal?: AbortSignal,
): Promise<LessonQuiz | null> {
  const response = await authorizeAxiosInstance.get<ApiResponse<LessonQuiz | null>>(
    `/study/lessons/${lessonId}/quiz`,
    { signal, localErrorHandling: true },
  );
  const body = response.data;
  if (body.error || body.statusCode !== 200) throw new Error('Unable to load lesson quiz');
  const quiz = body.data;
  if (!quiz) return null;
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
