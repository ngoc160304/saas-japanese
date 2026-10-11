export interface Lesson {
  id: number;
  courseId: number;
  title: string;
  slug: string;
  grammar: string | null;
  durationMinutes: number | null;
  isPublished: boolean;
  isDeleted: boolean;
  videoMediaId: number | null;
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLessonRequest {
  courseId: number;
  title: string;
  grammar?: string;
  durationMinutes?: number | null;
  isPublished?: boolean;
  videoMediaId?: number | null;
  sortOrder?: number;
}

export interface LessonQuery {
  courseId: number;
  page: number;
  size: number;
  search?: string;
  sortKey?: 'id';
  sortType?: 'ASC' | 'DESC';
}

export interface UpdateLessonRequest {
  title: string;
  courseId: number;
  slug: string;
  grammar: string | null;
  durationMinutes: number;
  isPublished: boolean;
}

export interface UpdateLessonGrammarRequest {
  grammar: string;
}

export interface UpdateLessonPublicationRequest {
  isPublished: boolean;
  /** Omit or send null to preserve the current video in the existing PUT contract. */
  videoMediaId?: number | null;
}

export interface AttachLessonVideoRequest {
  videoMediaId: number;
}
