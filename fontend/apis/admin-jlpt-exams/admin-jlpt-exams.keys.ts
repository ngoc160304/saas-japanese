import { adminJlptStatsParams } from './admin-jlpt-exams.api';
import type { AdminJlptExamQuery, AdminJlptExamStatsQuery } from './admin-jlpt-exams.type';

export const adminJlptExamKeys = {
  all: ['admin-jlpt-exams'] as const,
  lists: () => [...adminJlptExamKeys.all, 'list'] as const,
  list: (params: AdminJlptExamQuery) => [...adminJlptExamKeys.lists(), params] as const,
  statistics: () => [...adminJlptExamKeys.all, 'stats'] as const,
  stats: (params: AdminJlptExamStatsQuery) =>
    [...adminJlptExamKeys.statistics(), adminJlptStatsParams(params)] as const,
  detail: (examId: number) => [...adminJlptExamKeys.all, 'detail', examId] as const,
  validation: (examId: number) => [...adminJlptExamKeys.all, 'validation', examId] as const,
};
