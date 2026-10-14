'use client';

import { useEffect, useReducer, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { lessonAPI } from '@/apis/lessons/lessons.api';
import type { Lesson } from '@/apis/lessons/lessons.type';
import { useAppStore } from '@/store/hooks';
import { comparableGrammar, draftReducer, type DraftState } from './grammarDraft';

export function useLessonWorkspaceActions(lesson: Lesson) {
  const queryClient = useQueryClient();
  const store = useAppStore();
  const draftKey = ['admin', 'lesson-draft', lesson.courseId, lesson.id];
  const [draftState, dispatch] = useReducer(draftReducer, lesson.grammar ?? '', (grammar) =>
    queryClient.getQueryData<DraftState>(draftKey) ?? {
      draft: grammar,
      baseline: grammar,
      server: grammar,
    });
  const active = useRef(true);
  const submitting = useRef(false);
  const draftRef = useRef(draftState.draft);
  const dirty = comparableGrammar(draftState.draft) !== comparableGrammar(draftState.baseline);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  useEffect(() => {
    dispatch({ type: 'sync', value: lesson.grammar ?? '' });
  }, [lesson.grammar]);

  useEffect(() => {
    draftRef.current = draftState.draft;
    queryClient.setQueryData(['admin', 'lesson-draft', lesson.courseId, lesson.id], draftState);
  }, [draftState, lesson.courseId, lesson.id, queryClient]);

  async function cancelReads() {
    await Promise.all([
      queryClient.cancelQueries({ queryKey: ['lessons', 'detail', lesson.id] }),
      queryClient.cancelQueries({ queryKey: ['lessons', 'curriculum', lesson.courseId] }),
    ]);
  }

  function reconcile(saved: Lesson, field: 'grammar' | 'isPublished') {
    const merge = (current: Lesson) => ({ ...current, [field]: saved[field], updatedAt: saved.updatedAt });
    queryClient.setQueryData<Lesson>(['lessons', 'detail', lesson.id], current => current ? merge(current) : saved);
    queryClient.setQueryData<Lesson[]>(['lessons', 'curriculum', lesson.courseId], current =>
      current?.map(item => item.id === lesson.id ? merge(item) : item));
    void queryClient.invalidateQueries({ queryKey: ['client-courses'] });
    void queryClient.invalidateQueries({ queryKey: ['lessons', lesson.courseId] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'lessons', lesson.id, 'preview'] });
    void queryClient.invalidateQueries({ queryKey: ['study'] });
  }

  const grammarMutation = useMutation({ mutationFn: lessonAPI.updateGrammar, retry: false });
  const publicationMutation = useMutation({ mutationFn: lessonAPI.updatePublication, retry: false });

  function setDraft(value: string) {
    draftRef.current = value;
    dispatch({ type: 'edit', value });
  }

  function discardDraft() {
    draftRef.current = draftState.server;
    dispatch({ type: 'discard' });
    queryClient.setQueryData(draftKey, draftReducer(draftState, { type: 'discard' }));
  }

  async function saveGrammar(): Promise<boolean> {
    if (submitting.current || !dirty) return false;
    submitting.current = true;
    const submitted = draftRef.current;
    const authRevision = store.getState().auth.revision;
    try {
      await cancelReads();
      if (store.getState().auth.revision !== authRevision) return false;
      const saved = await grammarMutation.mutateAsync({
        id: lesson.id,
        data: { grammar: comparableGrammar(submitted) ? submitted : '' },
      });
      if (store.getState().auth.revision !== authRevision) return false;
      await cancelReads();
      if (store.getState().auth.revision !== authRevision) return false;
      reconcile(saved, 'grammar');
      queryClient.setQueryData<DraftState>(draftKey, current => current &&
        draftReducer(current, { type: 'saved', submitted, saved: saved.grammar ?? '' }));
      if (!active.current) return false;
      draftRef.current = comparableGrammar(draftRef.current) === comparableGrammar(submitted)
        ? saved.grammar ?? ''
        : draftRef.current;
      dispatch({ type: 'saved', submitted, saved: saved.grammar ?? '' });
      toast.success('Đã lưu ngữ pháp.');
      return true;
    } catch {
      return false;
    } finally {
      submitting.current = false;
    }
  }

  async function changePublication(isPublished: boolean): Promise<boolean> {
    if (submitting.current || publicationMutation.isPending) return false;
    if (isPublished && comparableGrammar(draftRef.current) !== comparableGrammar(draftState.baseline))
      return false;
    submitting.current = true;
    const authRevision = store.getState().auth.revision;
    try {
      await cancelReads();
      if (store.getState().auth.revision !== authRevision) return false;
      const saved = await publicationMutation.mutateAsync({
        id: lesson.id,
        data: { isPublished },
      });
      if (store.getState().auth.revision !== authRevision) return false;
      await cancelReads();
      if (store.getState().auth.revision !== authRevision) return false;
      reconcile(saved, 'isPublished');
      void queryClient.invalidateQueries({ queryKey: ['lessons', 'curriculum', lesson.courseId] });
      if (!active.current) return false;
      toast.success(isPublished ? 'Đã xuất bản bài học.' : 'Đã ẩn bài học.');
      return true;
    } catch {
      return false;
    } finally {
      submitting.current = false;
    }
  }

  return {
    draft: draftState.draft,
    dirty,
    setDraft,
    discardDraft,
    saveGrammar,
    changePublication,
    isSaving: grammarMutation.isPending,
    saveError: grammarMutation.error,
    isChangingPublication: publicationMutation.isPending,
    publicationError: publicationMutation.error,
  };
}
