'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiError } from '@/lib/api-error';
import { useAppSelector, useAppStore } from '@/store/hooks';

type ContentItem = { id: number; lessonId: number | null };
type Session = { revision: number; userId: number | undefined };
type Target<T> = Session &
  ({ mode: 'create'; item?: never } | { mode: 'edit' | 'delete'; item: T });

/** Only mounted beneath the validated course/lesson workspace. Never writes lesson detail. */
export function useLessonContentMutation<T extends ContentItem, I extends { lessonId: number }>(
  lessonId: number,
  domain: 'vocabularies' | 'kanjis',
  api: {
    getById: (id: number, lessonId: number) => Promise<T>;
    create: (data: I) => Promise<T>;
    update: (variables: { id: number; data: I; lessonId: number }) => Promise<T>;
    deleteById: (id: number, lessonId: number) => Promise<void>;
  },
  matchesFilter: (item: T) => boolean,
  items: readonly T[] | undefined,
) {
  const store = useAppStore();
  const revision = useAppSelector((state) => state.auth.revision);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<Target<T> | null>(null);
  const [missingOnServer, setUnavailable] = useState(false);
  const targetItem = target?.item;
  const unavailable =
    missingOnServer ||
    Boolean(
      targetItem &&
      items &&
      !items.some((item) => item.id === targetItem.id && item.lessonId === lessonId),
    );
  const mounted = useRef(false);
  const busy = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  function sameSession(captured: Session) {
    const auth = store.getState().auth;
    return auth.revision === captured.revision && auth.user?.id === captured.userId;
  }

  const mutation = useMutation({
    mutationFn: async ({ captured, data }: { captured: Target<T>; data?: I }) => {
      if (!sameSession(captured)) throw new Error('Phiên đăng nhập đã thay đổi.');
      if (captured.item) {
        const current = await api.getById(captured.item.id, lessonId);
        if (current.lessonId !== lessonId) {
          throw { status: 404, message: 'Nội dung không còn thuộc bài học này.', fieldErrors: {} };
        }
      }
      // A session change during the preflight must not send a write using the next account.
      if (!sameSession(captured) || !mounted.current) return;
      if (captured.mode === 'delete') return api.deleteById(captured.item.id, lessonId);
      if (!data || data.lessonId !== lessonId) throw new Error('Bài học không hợp lệ.');
      return captured.mode === 'edit'
        ? api.update({ id: captured.item.id, data, lessonId })
        : api.create(data);
    },
  });

  async function submit(data?: I) {
    if (busy.current || !target || !sameSession(target) || unavailable) return;
    const captured = target;
    if (captured.item && captured.item.lessonId !== lessonId) return;
    busy.current = true;
    const reconcile = () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'lessons', lessonId, domain] });
    try {
      const result = await mutation.mutateAsync({ captured, data });
      if (!sameSession(captured)) return;
      // Reconcile the originating collection even if its workspace has since unmounted.
      void reconcile();
      if (!mounted.current) return;
      setTarget(null);
      toast.success(
        captured.mode === 'delete'
          ? 'Đã xóa nội dung.'
          : result && !matchesFilter(result)
            ? 'Đã lưu. Nội dung không khớp bộ lọc hiện tại.'
            : 'Đã lưu nội dung.',
      );
    } catch (error) {
      if (!sameSession(captured) || !mounted.current) return;
      if (getApiError(error).status === 404) {
        void reconcile();
        setUnavailable(true);
      }
      throw error;
    } finally {
      busy.current = false;
    }
  }

  function open(mode: 'create' | 'edit' | 'delete', item?: T) {
    if (busy.current || (item && item.lessonId !== lessonId)) return;
    setUnavailable(false);
    if (mode === 'create') setTarget({ mode, revision, userId });
    else if (item) setTarget({ mode, item, revision, userId });
  }

  return {
    target: target?.revision === revision && target.userId === userId ? target : null,
    unavailable,
    pending: mutation.isPending,
    open,
    close: () => {
      if (!busy.current) setTarget(null);
    },
    submit,
  };
}
