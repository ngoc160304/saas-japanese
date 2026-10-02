import authorizeAxiosInstance from '@/lib/authorize-axios';
import type { ApiResponse } from '@/types/api';
import type { PageResponse } from '@/types/pagination';

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

export interface KanjiInput {
  lessonId: number;
  kanji: string;
  onyomi: string;
  kunyomi: string;
  meaningVi: string;
  strokeCount: number | null;
  exampleWords: string;
}

async function listAll<T>(path: string, lessonId: number): Promise<T[]> {
  const first = await authorizeAxiosInstance.get<ApiResponse<PageResponse<T>>>(path, {
    params: { lessonId, page: 0, size: 12, sortKey: 'id', sortType: 'ASC' },
    localErrorHandling: true,
  });
  const items = [...first.data.data.content];
  for (let page = 1; page < first.data.data.totalPages; page += 1) {
    const next = await authorizeAxiosInstance.get<ApiResponse<PageResponse<T>>>(path, {
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
  listByLesson: (lessonId: number) => listAll<VocabularyItem>(vocabularyPath, lessonId),
  create: async (data: VocabularyInput) => {
    const response = await authorizeAxiosInstance.post<ApiResponse<VocabularyItem>>(
      vocabularyPath,
      data,
      { localErrorHandling: true },
    );
    return response.data.data;
  },
  update: async ({ id, data }: { id: number; data: VocabularyInput }) => {
    const response = await authorizeAxiosInstance.put<ApiResponse<VocabularyItem>>(
      `${vocabularyPath}/${id}`,
      data,
      { localErrorHandling: true },
    );
    return response.data.data;
  },
  deleteById: async (id: number) => {
    await authorizeAxiosInstance.delete(`${vocabularyPath}/${id}`, { localErrorHandling: true });
  },
};

export const kanjiAPI = {
  listByLesson: async (lessonId: number, signal?: AbortSignal) => {
    const response = await authorizeAxiosInstance.get<ApiResponse<KanjiItem[]>>(
      `/study/lessons/${lessonId}/kanjis`,
      { localErrorHandling: true, signal },
    );
    if (!Array.isArray(response.data.data)) throw new Error('Invalid Kanji response');
    return response.data.data;
  },
  create: async (data: KanjiInput) => {
    const response = await authorizeAxiosInstance.post<ApiResponse<KanjiItem>>(kanjiPath, data, {
      localErrorHandling: true,
    });
    return response.data.data;
  },
  update: async ({ id, data }: { id: number; data: KanjiInput }) => {
    const response = await authorizeAxiosInstance.put<ApiResponse<KanjiItem>>(
      `${kanjiPath}/${id}`,
      data,
      { localErrorHandling: true },
    );
    return response.data.data;
  },
  deleteById: async (id: number) => {
    await authorizeAxiosInstance.delete(`${kanjiPath}/${id}`, { localErrorHandling: true });
  },
};
