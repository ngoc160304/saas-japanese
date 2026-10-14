'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studyAPI, studyKeys } from '@/apis/study/study.api';
import { clientCoursesQueryKeys } from '@/apis/courses/client-courses.api';
import type { StudyLessonSummary } from '@/apis/study/study.type';
import { useAppStore } from '@/store/hooks';
import { assertLessonRoute } from '../utils/lesson-route';

export function useStudyLessons(userId: number | undefined, courseId: number, enabled = true) {
  return useQuery({
    queryKey: studyKeys.lessons(userId ?? 0, courseId),
    queryFn: ({ signal }) => studyAPI.getLessons(courseId, signal),
    enabled: userId !== undefined && enabled,
    retry: false,
  });
}

export function useStudyLesson(userId: number | undefined, courseId: number, lessonId: number) {
  return useQuery({
    queryKey: studyKeys.detail(userId ?? 0, courseId, lessonId),
    queryFn: async ({ signal }) =>
      assertLessonRoute(await studyAPI.getLesson(lessonId, signal), courseId, lessonId),
    enabled: userId !== undefined,
    retry: false,
  });
}

export function useStudyProgress(userId: number, courseId: number, lessonId: number) {
  const lesson = useQuery({
    queryKey: studyKeys.progress(userId, courseId, lessonId),
    queryFn: ({ signal }) => studyAPI.getLessonProgress(lessonId, signal),
    retry: false,
  });
  const course = useQuery({
    queryKey: studyKeys.courseProgress(userId, courseId),
    queryFn: ({ signal }) => studyAPI.getCourseProgress(courseId, signal),
    retry: false,
  });
  return { lesson, course };
}

export function useSaveLessonProgress(userId: number, courseId: number, lessonId: number) {
  const queryClient = useQueryClient();
  const store = useAppStore();
  return useMutation({
    mutationKey: [...studyKeys.progress(userId, courseId, lessonId), 'save'],
    mutationFn: studyAPI.updateProgress,
    retry: false,
    onMutate: () => ({ revision: store.getState().auth.revision }),
    onSuccess: (response, variables, context) => {
      const auth = store.getState().auth;
      if (
        auth.user?.id !== userId ||
        auth.revision !== context.revision ||
        variables.lessonId !== lessonId
      )
        return;
      queryClient.setQueryData(studyKeys.progress(userId, courseId, lessonId), response);
      queryClient.setQueryData<StudyLessonSummary[]>(
        studyKeys.lessons(userId, courseId),
        (lessons) =>
          lessons?.map((lesson) =>
            lesson.id === lessonId
              ? {
                  ...lesson,
                  watchDuration: response.watchDuration,
                  videoDuration: response.videoDuration,
                  progressPercent: response.progressPercent,
                  isCompleted: response.isCompleted,
                  lastWatchedAt: response.lastWatchedAt,
                  completedAt: response.completedAt,
                }
              : lesson,
          ),
      );
      void queryClient.invalidateQueries({ queryKey: studyKeys.lessons(userId, courseId) });
      void queryClient.invalidateQueries({ queryKey: studyKeys.courseProgress(userId, courseId) });
      void queryClient.invalidateQueries({ queryKey: clientCoursesQueryKeys.myCourses(userId) });
    },
  });
}
