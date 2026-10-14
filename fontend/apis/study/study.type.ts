import type { KanjiItem, VocabularyItem } from '@/apis/lessons/lesson-content.api';

export interface StudyLesson {
  id: number;
  courseId: number;
  title: string;
  slug: string;
  grammar: string | null;
  durationMinutes: number | null;
  videoUrl: string | null;
}

export interface LessonProgress {
  lessonId: number;
  watchDuration: number;
  videoDuration: number;
  progressPercent: number;
  isCompleted: boolean;
  lastWatchedAt: string | null;
  completedAt: string | null;
  courseProgressPercent: number;
}

export interface StudyLessonSummary extends Omit<StudyLesson, 'grammar' | 'videoUrl'> {
  watchDuration: number;
  videoDuration: number;
  progressPercent: number;
  isCompleted: boolean;
  lastWatchedAt: string | null;
  completedAt: string | null;
}

export interface CourseProgress {
  courseId: number;
  courseTitle: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  completedAt: string | null;
}

/** Whole seconds, measured from actual playback; cumulative, never a position or delta. */
export interface UpdateLessonProgress {
  watchDuration: number;
  videoDuration: number;
}

export interface StudyVocabulary extends VocabularyItem {
  lessonId: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudyKanji extends KanjiItem {
  lessonId: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudyQuizOption {
  id: number;
  optionText: string;
  sortOrder: number;
}

export interface StudyQuizQuestion {
  id: number;
  questionText: string;
  questionType: string | null;
  sortOrder: number;
  options: StudyQuizOption[];
}

export interface StudyQuiz {
  id: number;
  title: string;
  description: string;
  questions: StudyQuizQuestion[];
}

export interface QuizAnswer {
  correct: boolean;
  correctOptionId: number | null;
  message: string;
}

export interface AnswerQuestion {
  lessonId: number;
  quizId: number;
  questionId: number;
  optionId: number;
}
