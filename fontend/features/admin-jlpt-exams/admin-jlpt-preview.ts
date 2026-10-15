import type {
  AdminJlptExamDetail,
  AdminJlptMedia,
} from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';
import type { AdminJlptQuestionValues } from './admin-jlpt-question';

export interface AdminJlptPreviewMedia {
  url: string;
  name: string;
  local?: boolean;
}
export interface AdminJlptPreviewQuestion {
  id: string;
  number: number;
  prompt: string;
  passage: string | null;
  image: AdminJlptPreviewMedia | null;
  options: { id: string; text: string }[];
}
export interface AdminJlptPreviewPart {
  id: number;
  name: string;
  instructions: string | null;
  audio: AdminJlptPreviewMedia | null;
  questions: AdminJlptPreviewQuestion[];
}
export interface AdminJlptPreviewExam {
  id: number;
  title: string;
  description: string | null;
  level: string;
  duration: number;
  sessions: { id: number; name: string; duration: number; parts: AdminJlptPreviewPart[] }[];
}
const ordered = <T extends { id: number; sortOrder: number }>(items: readonly T[]) =>
  [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
export function adminJlptPreviewMedia(
  media: Pick<AdminJlptMedia, 'secureUrl' | 'originalName'> | null | undefined,
): AdminJlptPreviewMedia | null {
  return media ? { url: media.secureUrl, name: media.originalName } : null;
}

/** Explicit allowlist. Admin correctness, explanations and scoring internals never cross this boundary. */
export function adminJlptExamPreview(exam: AdminJlptExamDetail): AdminJlptPreviewExam {
  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    level: exam.level,
    duration: exam.totalTimeMinutes,
    sessions: ordered(exam.sessions).map((session) => ({
      id: session.id,
      name: session.name,
      duration: session.timeLimitMinutes,
      parts: ordered(session.parts).map((part) => ({
        id: part.id,
        name: part.name,
        instructions: part.instructions,
        audio: adminJlptPreviewMedia(part.audio),
        questions: ordered(part.questions).map((question, index) => ({
          id: String(question.id),
          number: index + 1,
          prompt: question.questionText,
          passage: question.passageText,
          image: adminJlptPreviewMedia(question.image),
          options: ordered(question.answers).map((answer) => ({
            id: String(answer.id),
            text: answer.answerText,
          })),
        })),
      })),
    })),
  };
}

/** Snapshot of authoring values; no reference to the RHF answer/correctness objects. */
export function adminJlptQuestionPreview(
  values: AdminJlptQuestionValues,
  image: AdminJlptPreviewMedia | null,
): AdminJlptPreviewQuestion {
  return {
    id: 'draft',
    number: Number.isFinite(values.position) && values.position > 0 ? values.position : 1,
    prompt: values.questionText,
    passage: values.passageText,
    image,
    options: values.answers.map((answer, index) => ({
      id: String(index),
      text: answer.answerText,
    })),
  };
}
