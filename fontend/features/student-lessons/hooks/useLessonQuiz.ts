'use client';

import { useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { studyAPI, studyKeys } from '@/apis/study/study.api';

export function useLessonQuiz(userId: number, courseId: number, lessonId: number, active: boolean) {
  return useQuery({
    queryKey: [...studyKeys.lesson(userId, courseId, lessonId), 'quiz'],
    queryFn: ({ signal }) => studyAPI.getQuiz(lessonId, signal),
    enabled: active,
    retry: false,
  });
}

export function useQuizAnswer(
  userId: number,
  courseId: number,
  lessonId: number,
  quizId: number,
  questionId: number,
) {
  const busy = useRef(false);
  const mutation = useMutation({
    mutationKey: [
      ...studyKeys.lesson(userId, courseId, lessonId),
      'quiz',
      quizId,
      questionId,
      'answer',
    ],
    mutationFn: studyAPI.answerQuestion,
    retry: false,
  });
  async function submit(optionId: number) {
    if (busy.current || mutation.isPending || mutation.isSuccess) return;
    busy.current = true;
    try {
      await mutation.mutateAsync({ lessonId, quizId, questionId, optionId });
    } catch {
      // Keep the selected option and show the mutation's local error for explicit retry.
    } finally {
      busy.current = false;
    }
  }
  return { mutation, submit };
}
