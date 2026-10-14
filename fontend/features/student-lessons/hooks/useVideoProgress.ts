'use client';

import { useEffect, useRef, useState } from 'react';
import { CanceledError } from 'axios';
import type { LessonProgress } from '@/apis/study/study.type';
import { useAppStore } from '@/store/hooks';
import { ProgressWriter, VideoWatchTracker } from '../utils/video-progress';
import { useSaveLessonProgress } from './useStudyQueries';

export function useVideoProgress({
  userId,
  courseId,
  lessonId,
  progress,
}: {
  userId: number;
  courseId: number;
  lessonId: number;
  progress: LessonProgress | undefined;
}) {
  const mutation = useSaveLessonProgress(userId, courseId, lessonId);
  const store = useAppStore();
  const tracker = useRef<VideoWatchTracker | null>(null);
  const lastSubmitted = useRef(progress?.watchDuration ?? 0);
  const [writer] = useState(() => {
    const revision = store.getState().auth.revision;
    return new ProgressWriter(async (data) => {
      const auth = store.getState().auth;
      if (auth.user?.id !== userId || auth.revision !== revision)
        throw new CanceledError('Session changed');
      return mutation.mutateAsync({ lessonId, data });
    }, progress?.watchDuration ?? 0);
  });

  function flush() {
    const data = tracker.current?.read();
    if (data) {
      lastSubmitted.current = data.watchDuration;
      writer.enqueue(data);
    }
  }

  function sample(video: HTMLVideoElement, force = false) {
    if (!progress) return;
    if (!tracker.current) {
      tracker.current = new VideoWatchTracker(progress.watchDuration);
      lastSubmitted.current = progress.watchDuration;
    }
    tracker.current.sample({
      currentTime: video.currentTime,
      duration: video.duration,
      now: performance.now(),
      playing: !video.paused && !video.ended,
      seeking: video.seeking,
      playbackRate: video.playbackRate,
    });
    const data = tracker.current.read();
    if (data && (force || data.watchDuration - lastSubmitted.current >= 15)) flush();
  }

  useEffect(() => {
    const flushLatest = () => {
      const data = tracker.current?.read();
      if (data) writer.enqueue(data);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushLatest();
    };
    window.addEventListener('pagehide', flushLatest);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flushLatest);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      // Finish/coalesce this lesson's own writes. Old responses only update its scoped cache.
      // Aborting a POST cannot undo a committed write. Browser shutdown delivery is best effort.
      flushLatest();
    };
  }, [writer]);

  return {
    mutation,
    sample,
    resetAnchor: () => tracker.current?.resetAnchor(),
    retry: () => {
      flush();
      writer.retry();
    },
  };
}
