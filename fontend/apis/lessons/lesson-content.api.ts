import authorizeAxiosInstance from '@/lib/authorize-axios';
import { studyAPI } from '@/apis/study/study.api';
import type { ApiResponse } from '@/types/api';
import type { PageResponse } from '@/types/pagination';

export type { StudyQuiz, StudyQuizOption, StudyQuizQuestion } from '@/apis/study/study.type';

export interface VocabularyItem {
  id: number;
  lessonId: number | null;
  word: string;
  reading: string;
  meaningVi: string;
  exampleSentenceJp: string | null;
  exampleSentenceVi: string | null;
  partOfSpeech: string | null;
}

export interface VocabularyInput {
  lessonId: number;
  word: string;
  reading: string;
  meaningVi: string;
  exampleSentenceJp: string;
  exampleSentenceVi: string;
  partOfSpeech: string;
}

export interface KanjiItem {
  id: number;
  lessonId: number | null;
  kanji: string;
  onyomi: string | null;
  kunyomi: string | null;
  meaningVi: string;
  strokeCount: number | null;
  exampleWords: string | null;
}

/** Study Kanji filters are applied to its complete response in the client. */
export interface KanjiQuery {
  lessonId: number;
  kanji: string;
  meaningVi: string;
}

export interface KanjiInput {
  lessonId: number;
  kanji: string;
  onyomi: string;
  kunyomi: string;
  meaningVi: string;
  strokeCount: number | null;
  exampleWords: string;
}

async function listAll<T>(path: string, lessonId: number, signal?: AbortSignal): Promise<T[]> {
  const first = await authorizeAxiosInstance.get<ApiResponse<PageResponse<T>>>(path, {
    signal,
    params: { lessonId, page: 0, size: 12, sortKey: 'id', sortType: 'ASC' },
    localErrorHandling: true,
  });
  const items = [...first.data.data.content];
  for (let page = 1; page < first.data.data.totalPages; page += 1) {
    const next = await authorizeAxiosInstance.get<ApiResponse<PageResponse<T>>>(path, {
      signal,
      params: { lessonId, page, size: 12, sortKey: 'id', sortType: 'ASC' },
      localErrorHandling: true,
    });
    items.push(...next.data.data.content);
  }
  return items;
}

const vocabularyPath = '/vocabularies';
const kanjiPath = '/kanjis';

export const vocabularyAPI = {
  listByLesson: (lessonId: number, signal?: AbortSignal) =>
    listAll<VocabularyItem>(vocabularyPath, lessonId, signal),
  getById: async (id: number, lessonId: number): Promise<VocabularyItem> => {
    const response = await authorizeAxiosInstance.get<ApiResponse<VocabularyItem>>(
      `${vocabularyPath}/${id}`,
      { params: { lessonId }, localErrorHandling: true },
    );
    return response.data.data;
  },
  listStudyByLesson: studyAPI.getVocabularies,
  create: async (data: VocabularyInput) => {
    const response = await authorizeAxiosInstance.post<ApiResponse<VocabularyItem>>(
      vocabularyPath,
      data,
      { localErrorHandling: true },
    );
    return response.data.data;
  },
  update: async ({ id, data, lessonId }: { id: number; data: VocabularyInput; lessonId: number }) => {
    const response = await authorizeAxiosInstance.put<ApiResponse<VocabularyItem>>(
      `${vocabularyPath}/${id}`,
      data,
      { params: { lessonId }, localErrorHandling: true },
    );
    return response.data.data;
  },
  deleteById: async (id: number, lessonId: number) => {
    await authorizeAxiosInstance.delete(`${vocabularyPath}/${id}`, { params: { lessonId }, localErrorHandling: true });
  },
};

export const kanjiAPI = {
  listByLesson: (lessonId: number, signal?: AbortSignal) =>
    listAll<KanjiItem>(kanjiPath, lessonId, signal),
  getById: async (id: number, lessonId: number): Promise<KanjiItem> => {
    const response = await authorizeAxiosInstance.get<ApiResponse<KanjiItem>>(
      `${kanjiPath}/${id}`,
      { params: { lessonId }, localErrorHandling: true },
    );
    return response.data.data;
  },
  listStudyByLesson: studyAPI.getKanjis,
  create: async (data: KanjiInput) => {
    const response = await authorizeAxiosInstance.post<ApiResponse<KanjiItem>>(kanjiPath, data, {
      localErrorHandling: true,
    });
    return response.data.data;
  },
  update: async ({ id, data, lessonId }: { id: number; data: KanjiInput; lessonId: number }) => {
    const response = await authorizeAxiosInstance.put<ApiResponse<KanjiItem>>(
      `${kanjiPath}/${id}`,
      data,
      { params: { lessonId }, localErrorHandling: true },
    );
    return response.data.data;
  },
  deleteById: async (id: number, lessonId: number) => {
    await authorizeAxiosInstance.delete(`${kanjiPath}/${id}`, { params: { lessonId }, localErrorHandling: true });
  },
};

export const quizAPI = {
  getStudyByLesson: studyAPI.getQuiz,
};
