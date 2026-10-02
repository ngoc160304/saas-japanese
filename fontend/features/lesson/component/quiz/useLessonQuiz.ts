import { useQuery } from '@tanstack/react-query';
import { getLessonQuiz } from '@/apis/lessons/lesson-quiz.api';

export function useLessonQuiz(lessonId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['lesson-quiz', lessonId],
    queryFn: ({ signal }) => getLessonQuiz(lessonId, signal),
    enabled: enabled && Number.isSafeInteger(lessonId) && lessonId > 0,
    retry: false,
  });
}
