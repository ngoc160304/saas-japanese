'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { adminJlptExamsAPI } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.api';
import { validateAdminJlptMedia } from '@/apis/admin-jlpt-exams/admin-jlpt-media';
import type { AdminJlptMedia } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';
import { getAdminJlptError } from '../admin-jlpt-error';

export type AdminJlptAttachment = Pick<AdminJlptMedia, 'id' | 'originalName' | 'secureUrl'>;
interface Candidate {
  file: File;
  url: string;
  status: 'selected' | 'uploading' | 'uploaded' | 'failed' | 'canceled';
  progress: number | null;
}

/** Local upload state only: File/blob URLs never enter a query or mutation cache.
 * Callers key forms by resource and call reset after a confirmed save/new draft. */
export function useAdminJlptMediaUpload({
  kind,
  canEdit,
  onStage,
  onAccessError,
}: {
  kind: 'image' | 'audio';
  canEdit: () => boolean;
  onStage: (id: number | null | undefined) => void;
  onAccessError: () => void;
}) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [staged, setStaged] = useState<AdminJlptAttachment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const current = useRef<Candidate | null>(null);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current += 1;
      controller.current?.abort();
      if (current.current) URL.revokeObjectURL(current.current.url);
      current.current = null;
    };
  }, []);
  const update = (value: Candidate | null) => {
    current.current = value;
    setCandidate(value);
  };
  const clearFile = () => {
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    if (current.current) URL.revokeObjectURL(current.current.url);
    update(null);
    setError(null);
  };
  const reset = () => {
    clearFile();
    setStaged(null);
  };
  const select = (file: File) => {
    if (!canEdit()) return;
    const message = validateAdminJlptMedia(file, kind);
    if (message) {
      setError(message);
      return;
    }
    clearFile();
    update({ file, url: URL.createObjectURL(file), status: 'selected', progress: null });
  };
  const cancel = () => {
    const selected = current.current;
    if (!selected || selected.status !== 'uploading') return;
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    update({ ...selected, status: 'canceled', progress: null });
    setError(null);
  };
  const upload = async () => {
    const selected = current.current;
    if (
      !canEdit() ||
      !selected ||
      selected.status === 'uploading' ||
      selected.status === 'uploaded'
    )
      return;
    const token = ++generation.current;
    const abort = new AbortController();
    controller.current = abort;
    setError(null);
    update({ ...selected, status: 'uploading', progress: null });
    const isCurrent = () => mounted.current && generation.current === token;
    try {
      const options = {
        file: selected.file,
        signal: abort.signal,
        onProgress: (progress: number | null) => {
          if (isCurrent() && current.current?.status === 'uploading')
            update({ ...selected, status: 'uploading', progress });
        },
      };
      const result =
        kind === 'image'
          ? await adminJlptExamsAPI.uploadImage(options)
          : await adminJlptExamsAPI.uploadAudio(options);
      if (!isCurrent()) return;
      // Upload response contains only media data; attachment waits for resource Save.
      setStaged({ id: result.id, originalName: result.originalName, secureUrl: result.secureUrl });
      update({ ...selected, status: 'uploaded', progress: 100 });
      onStage(result.id);
    } catch (cause) {
      if (!isCurrent()) return;
      if (axios.isCancel(cause)) {
        update({ ...selected, status: 'canceled', progress: null });
        return;
      }
      const parsed = getAdminJlptError(cause);
      update({ ...selected, status: 'failed', progress: null });
      setError(
        parsed.status === 400
          ? 'Tệp không được chấp nhận. Kiểm tra định dạng, nội dung và giới hạn dung lượng.'
          : parsed.status === 413
            ? 'Tệp vượt giới hạn dung lượng máy chủ cho phép.'
            : parsed.status === 415
              ? 'Máy chủ không hỗ trợ định dạng tệp này.'
              : parsed.status === 403
                ? 'Bạn không có quyền tải tệp lên. Hãy kiểm tra lại quyền truy cập.'
                : parsed.status === 401
                  ? parsed.message
                  : 'Chưa nhận được kết quả tải tệp. Tệp có thể đã được tải lên; chỉ thử lại khi bạn chủ động chọn.',
      );
      if (parsed.status === 401 || parsed.status === 403) onAccessError();
    } finally {
      if (isCurrent()) controller.current = null;
    }
  };
  return {
    candidate,
    staged,
    error,
    dirty: candidate !== null || staged !== null,
    unresolved: candidate !== null && candidate.status !== 'uploaded',
    hasUnresolved: () => current.current !== null && current.current.status !== 'uploaded',
    select,
    upload,
    cancel,
    reset,
    discardFile: () => {
      if (canEdit()) clearFile();
    },
    revert: () => {
      if (canEdit()) {
        reset();
        onStage(undefined);
      }
    },
    remove: () => {
      if (canEdit()) {
        reset();
        onStage(null);
      }
    },
  };
}
export type AdminJlptMediaUpload = ReturnType<typeof useAdminJlptMediaUpload>;
