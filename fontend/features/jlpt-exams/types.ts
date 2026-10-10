export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type ExamAccessTier = 'free' | 'premium';
export type ExamPopularity = 'standard' | 'popular';
export type ExamCompletion = 'unattempted' | 'completed';
export type ExamSection = 'vocabulary' | 'grammar' | 'reading' | 'listening';

export interface SectionResult {
  total: number;
  earned: number | null;
}

export interface JlptExam {
  id: string;
  detailId?: string;
  category: string;
  title: string;
  level: JlptLevel;
  year: number;
  durationMinutes: number;
  totalQuestions: number;
  accessTier: ExamAccessTier;
  popularity: ExamPopularity;
  completion: ExamCompletion;
  sections: Record<ExamSection, SectionResult>;
}
