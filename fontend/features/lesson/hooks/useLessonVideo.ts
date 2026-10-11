'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { lessonAPI } from '@/apis/lessons/lessons.api';
import type { Lesson } from '@/apis/lessons/lessons.type';
import { uploadAPI } from '@/apis/upload/upload.api';
import type { MediaResponse } from '@/apis/upload/upload.type';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAppStore } from '@/store/hooks';
import { validateVideoFile } from './videoUpload';

type VideoPhase = 'idle' | 'uploading' | 'attaching' | 'detaching';

export function useLessonVideo(lesson: Lesson) {
  const queryClient = useQueryClient();
  const store = useAppStore();
  const active = useRef(true);
  const busy = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState<MediaResponse | null>(null);
  const [phase, setPhase] = useState<VideoPhase>('idle');
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  const currentSession = (revision: number) => store.getState().auth.revision === revision;

  function updateVideoCache(saved: Lesson, lessonId: number, courseId: number) {
    const merge = (current: Lesson): Lesson => ({
      ...current,
      videoMediaId: saved.videoMediaId,
      videoUrl: saved.videoUrl,
      updatedAt: saved.updatedAt,
    });
    queryClient.setQueryData<Lesson>(['lessons', 'detail', lessonId], (current) => current ? merge(current) : saved);
    queryClient.setQueryData<Lesson[]>(['lessons', 'curriculum', courseId], (current) =>
      current?.map((item) => item.id === lessonId ? merge(item) : item),
    );
    void queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
  }

  async function reconcile(lessonId: number, courseId: number, revision: number, expectedId: number | null) {
    try {
      const saved = await lessonAPI.getById(lessonId);
      if (!currentSession(revision)) return false;
      updateVideoCache(saved, lessonId, courseId);
      return saved.videoMediaId === expectedId;
    } catch {
      return false;
    }
  }

  function selectFile(next: File | null) {
    if (busy.current || uploaded || !next) return;
    const validationError = validateVideoFile(next);
    setError(validationError);
    setFile(validationError ? null : next);
    setProgress(null);
  }

  function discardPrepared() {
    if (busy.current) return;
    setFile(null);
    setUploaded(null);
    setProgress(null);
    setError(null);
  }

  async function uploadAndAttach() {
    if (busy.current || (!file && !uploaded)) return;
    busy.current = true;
    const lessonId = lesson.id;
    const courseId = lesson.courseId;
    const revision = store.getState().auth.revision;
    let media = uploaded;
    try {
      setError(null);
      if (!media) {
        setPhase('uploading');
        setProgress(null);
        media = await uploadAPI.uploadVideo(file!, (percent) => {
          if (active.current && currentSession(revision)) setProgress(percent);
        });
        if (!Number.isSafeInteger(media?.id) || media.id <= 0)
          throw new Error('Máy chủ không trả về mã video hợp lệ.');
        if (!active.current || !currentSession(revision)) return;
        setUploaded(media);
      }
      setPhase('attaching');
      try {
        const saved = await lessonAPI.attachVideo({ id: lessonId, data: { videoMediaId: media.id } });
        if (!currentSession(revision)) return;
        updateVideoCache(saved, lessonId, courseId);
      } catch (attachError) {
        if (!currentSession(revision)) return;
        if (!(await reconcile(lessonId, courseId, revision, media.id))) {
          if (active.current) setError(getApiErrorMessage(attachError));
          return;
        }
      }
      if (active.current) {
        setUploaded(null);
        setFile(null);
        setProgress(null);
        toast.success('Đã gắn video vào bài học.');
      }
    } catch (uploadError) {
      if (active.current && currentSession(revision)) setError(getApiErrorMessage(uploadError));
    } finally {
      busy.current = false;
      if (active.current) setPhase('idle');
    }
  }

  async function detach() {
    if (busy.current) return;
    busy.current = true;
    const lessonId = lesson.id;
    const courseId = lesson.courseId;
    const revision = store.getState().auth.revision;
    setPhase('detaching');
    setError(null);
    try {
      try {
        const saved = await lessonAPI.detachVideo(lessonId);
        if (!currentSession(revision)) return;
        updateVideoCache(saved, lessonId, courseId);
      } catch (detachError) {
        if (!currentSession(revision)) return;
        if (!(await reconcile(lessonId, courseId, revision, null))) {
          if (active.current) setError(getApiErrorMessage(detachError));
          return;
        }
      }
      if (active.current) toast.success('Đã gỡ video khỏi bài học.');
    } finally {
      busy.current = false;
      if (active.current) setPhase('idle');
    }
  }

  return {
    file, uploaded, phase, progress, error,
    selectFile, discardPrepared, uploadAndAttach, detach,
    isBusy: phase !== 'idle',
    hasPendingWork: phase !== 'idle' || Boolean(file) || Boolean(uploaded),
  };
}
