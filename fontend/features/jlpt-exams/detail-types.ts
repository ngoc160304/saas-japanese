import type { JlptLevel } from './types';

export interface JlptMondaiSection {
  id: string;
  label: string;
  description: string;
  questionCount: number;
}

export interface JlptExamSession {
  id: string;
  number: number;
  japaneseTitle: string;
  englishSubtitle: string;
  durationMinutes: number;
  mondaiSections: JlptMondaiSection[];
}

export interface JlptExamDetail {
  id: string;
  level: JlptLevel;
  category: string;
  title: string;
  description: string;
  passingScore: number;
  maximumScore: number;
  sessions: JlptExamSession[];
}
