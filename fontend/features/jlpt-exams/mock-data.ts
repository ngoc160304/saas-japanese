import type { JlptExam } from './types';

export const mockExams: JlptExam[] = [
  {
    id: 'n5-korean-2026', detailId: '1', category: 'JLPT KOREAN PRACTICE EXAM',
    title: 'JLPT N5 Korean Practice Test 1 – 2026', level: 'N5', year: 2026,
    durationMinutes: 91, totalQuestions: 67, accessTier: 'free', popularity: 'standard', completion: 'unattempted',
    sections: { vocabulary: { total: 21, earned: null }, grammar: { total: 17, earned: null }, reading: { total: 5, earned: null }, listening: { total: 24, earned: null } },
  },
  {
    id: 'n5-december-2025', category: 'JLPT MOCK EXAM',
    title: 'JLPT N5 Mock Test – December 2025', level: 'N5', year: 2025,
    durationMinutes: 91, totalQuestions: 65, accessTier: 'premium', popularity: 'popular', completion: 'unattempted',
    sections: { vocabulary: { total: 20, earned: null }, grammar: { total: 16, earned: null }, reading: { total: 5, earned: null }, listening: { total: 24, earned: null } },
  },
  {
    id: 'n5-july-2025', category: 'JLPT MOCK EXAM',
    title: 'JLPT N5 Mock Test – July 2025', level: 'N5', year: 2025,
    durationMinutes: 90, totalQuestions: 67, accessTier: 'free', popularity: 'popular', completion: 'completed',
    sections: { vocabulary: { total: 21, earned: 20 }, grammar: { total: 17, earned: 12 }, reading: { total: 5, earned: 3 }, listening: { total: 24, earned: 17 } },
  },
  {
    id: 'n5-december-2012', category: 'JLPT MOCK EXAM',
    title: 'JLPT N5 Mock Test – December 2012', level: 'N5', year: 2012,
    durationMinutes: 105, totalQuestions: 91, accessTier: 'free', popularity: 'standard', completion: 'unattempted',
    sections: { vocabulary: { total: 33, earned: null }, grammar: { total: 26, earned: null }, reading: { total: 6, earned: null }, listening: { total: 26, earned: null } },
  },
  {
    id: 'n5-july-2013', category: 'JLPT MOCK EXAM',
    title: 'JLPT N5 Mock Test – July 2013', level: 'N5', year: 2013,
    durationMinutes: 105, totalQuestions: 85, accessTier: 'free', popularity: 'standard', completion: 'unattempted',
    sections: { vocabulary: { total: 30, earned: null }, grammar: { total: 25, earned: null }, reading: { total: 6, earned: null }, listening: { total: 24, earned: null } },
  },
  {
    id: 'n5-july-2017', category: 'JLPT MOCK EXAM',
    title: 'JLPT N5 Mock Test – July 2017', level: 'N5', year: 2017,
    durationMinutes: 105, totalQuestions: 85, accessTier: 'free', popularity: 'standard', completion: 'unattempted',
    sections: { vocabulary: { total: 30, earned: null }, grammar: { total: 25, earned: null }, reading: { total: 6, earned: null }, listening: { total: 24, earned: null } },
  },
  {
    id: 'n4-fictional-2026', category: 'JLPT MOCK EXAM',
    title: 'JLPT N4 Fictional Practice Test – 2026', level: 'N4', year: 2026,
    durationMinutes: 100, totalQuestions: 70, accessTier: 'free', popularity: 'standard', completion: 'completed',
    sections: { vocabulary: { total: 20, earned: 12 }, grammar: { total: 20, earned: 10 }, reading: { total: 10, earned: 0 }, listening: { total: 20, earned: 13 } },
  },
  {
    id: 'n3-fictional-2026', category: 'JLPT MOCK EXAM',
    title: 'JLPT N3 Fictional Practice Test – 2026', level: 'N3', year: 2026,
    durationMinutes: 110, totalQuestions: 75, accessTier: 'free', popularity: 'standard', completion: 'unattempted',
    sections: { vocabulary: { total: 20, earned: null }, grammar: { total: 20, earned: null }, reading: { total: 15, earned: null }, listening: { total: 20, earned: null } },
  },
  {
    id: 'n2-fictional-2026', category: 'JLPT MOCK EXAM',
    title: 'JLPT N2 Fictional Practice Test – 2026', level: 'N2', year: 2026,
    durationMinutes: 120, totalQuestions: 80, accessTier: 'premium', popularity: 'standard', completion: 'unattempted',
    sections: { vocabulary: { total: 20, earned: null }, grammar: { total: 20, earned: null }, reading: { total: 20, earned: null }, listening: { total: 20, earned: null } },
  },
  {
    id: 'n1-fictional-2026', category: 'JLPT MOCK EXAM',
    title: 'JLPT N1 Fictional Practice Test – 2026', level: 'N1', year: 2026,
    durationMinutes: 130, totalQuestions: 90, accessTier: 'premium', popularity: 'standard', completion: 'unattempted',
    sections: { vocabulary: { total: 25, earned: null }, grammar: { total: 20, earned: null }, reading: { total: 25, earned: null }, listening: { total: 20, earned: null } },
  },
];
