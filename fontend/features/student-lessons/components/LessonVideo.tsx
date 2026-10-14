'use client';

import { useEffect, useRef, useState } from 'react';
import type { LessonProgress } from '@/apis/study/study.type';
import { useVideoProgress } from '../hooks/useVideoProgress';
import { studyButtonClass } from './StudyState';

export function LessonVideo({
  url,
  title,
  userId,
  courseId,
  lessonId,
  progress,
  active,
}: {
  url: string;
  title: string;
  userId: number;
  courseId: number;
  lessonId: number;
  progress: LessonProgress | undefined;
  active: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [playbackError, setPlaybackError] = useState(false);
  const tracking = useVideoProgress({ userId, courseId, lessonId, progress });
  useEffect(() => {
    if (!active) video.current?.pause();
  }, [active]);
  return (
    <div className="space-y-3">
      <video
        ref={video}
        src={url}
        controls
        playsInline
        preload="metadata"
        aria-label={`Lesson video: ${title}`}
        className="aspect-video w-full rounded-2xl bg-slate-950"
        onPlay={(event) => tracking.sample(event.currentTarget)}
        onTimeUpdate={(event) => tracking.sample(event.currentTarget)}
        onPause={(event) => tracking.sample(event.currentTarget, true)}
        onEnded={(event) => tracking.sample(event.currentTarget, true)}
        onSeeking={tracking.resetAnchor}
        onSeeked={(event) => tracking.sample(event.currentTarget)}
        onRateChange={tracking.resetAnchor}
        onError={() => setPlaybackError(true)}
        onLoadedData={() => setPlaybackError(false)}
      >
        Your browser does not support this video.
      </video>
      {playbackError && (
        <div role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <p>This video could not be played. You can continue with the other lesson sections.</p>
          <button
            type="button"
            className="mt-2 rounded-md font-bold underline focus-visible:outline-2"
            onClick={() => {
              tracking.resetAnchor();
              setPlaybackError(false);
              video.current?.load();
            }}
          >
            Reload video
          </button>
        </div>
      )}
      <p className="text-xs text-slate-500">
        Progress is saved during playback. Completion is confirmed by the server.
      </p>
      {!progress && (
        <p className="text-xs text-amber-800">
          Video progress tracking is waiting for your saved progress to load.
        </p>
      )}
      {tracking.mutation.isPending && (
        <p role="status" className="text-xs text-slate-600">
          Saving progress…
        </p>
      )}
      {tracking.mutation.isError && (
        <div role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          <p>Your latest viewing progress could not be saved.</p>
          <button type="button" className={`${studyButtonClass} mt-2`} onClick={tracking.retry}>
            Retry save
          </button>
        </div>
      )}
      {tracking.mutation.isSuccess && !tracking.mutation.isPending && (
        <p role="status" className="text-xs text-emerald-700">
          Progress saved.
        </p>
      )}
    </div>
  );
}
