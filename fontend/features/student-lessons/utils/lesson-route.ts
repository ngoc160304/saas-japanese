import type { StudyLesson } from '@/apis/study/study.type';

export function parseStudyId(value: string): number | null {
  const id = Number(value);
  return /^\d+$/.test(value) && Number.isSafeInteger(id) && id > 0 ? id : null;
}

export const lessonHref = (courseId: number, lessonId: number) =>
  `/student/courses/${courseId}/lessons/${lessonId}`;

export function assertLessonRoute(lesson: StudyLesson, courseId: number, lessonId: number) {
  if (lesson.courseId !== courseId || lesson.id !== lessonId) {
    throw { status: 404, message: 'Lesson not found in this course', fieldErrors: {} };
  }
  return lesson;
}
