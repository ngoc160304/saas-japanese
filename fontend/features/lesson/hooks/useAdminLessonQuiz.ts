'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminQuizAPI,
  adminQuizKey,
  getQuizError,
  type AdminQuiz,
  type AdminQuizQuestion,
  type QuizMetadataInput,
  type QuizQuestionInput,
} from '@/apis/lessons/admin-quiz.api';
import { useAppSelector, useAppStore } from '@/store/hooks';

type Session = { revision: number; userId: number | undefined };
export type QuizDialog = (
  | { kind: 'metadata'; quiz: AdminQuiz | null }
  | { kind: 'question'; quiz: AdminQuiz; question?: AdminQuizQuestion }
  | { kind: 'deleteQuiz' | 'publication'; quiz: AdminQuiz }
  | { kind: 'deleteQuestion'; quiz: AdminQuiz; question: AdminQuizQuestion }
) &
  Session;
type Command =
  | { kind: 'create'; data: QuizMetadataInput }
  | { kind: 'metadata'; quizId: number; data: QuizMetadataInput }
  | { kind: 'question'; quizId: number; questionId?: number; data: QuizQuestionInput }
  | { kind: 'deleteQuiz'; quizId: number }
  | { kind: 'deleteQuestion'; quizId: number; questionId: number }
  | { kind: 'publication'; quizId: number; isPublished: boolean }
  | { kind: 'reorder'; quizId: number; questionIds: number[] };
type DialogInput = QuizDialog extends infer T
  ? T extends QuizDialog
    ? Omit<T, keyof Session>
    : never
  : never;

/** Mounted only within the validated course/lesson context. Never writes the lesson/grammar cache. */
export function useAdminLessonQuiz(lessonId: number, active: boolean) {
  const store = useAppStore();
  const revision = useAppSelector((state) => state.auth.revision);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const client = useQueryClient();
  const [target, setTarget] = useState<QuizDialog | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const query = useQuery({
    queryKey: adminQuizKey(lessonId),
    queryFn: ({ signal }) => adminQuizAPI.get(lessonId, signal),
    enabled: active && !pending,
    retry: false,
  });
  function sameSession(session: Session) {
    const auth = store.getState().auth;
    return auth.revision === session.revision && auth.user?.id === session.userId;
  }
  const dialog = target && target.revision === revision && target.userId === userId ? target : null;
  const unavailable =
    missing ||
    Boolean(
      dialog &&
      query.isSuccess &&
      (dialog.quiz
        ? query.data?.id !== dialog.quiz.id ||
          ('question' in dialog &&
            dialog.question &&
            !query.data.questions.some((item) => item.id === dialog.question?.id))
        : query.data !== null),
    );
  const mutation = useMutation({
    mutationFn: async (command: Command) => {
      if (command.kind === 'create') return adminQuizAPI.create({ lessonId, data: command.data });
      const variables = { ...command, lessonId };
      switch (command.kind) {
        case 'metadata':
          return adminQuizAPI.update({ lessonId, quizId: command.quizId, data: command.data });
        case 'publication':
          return adminQuizAPI.publication({
            lessonId,
            quizId: command.quizId,
            isPublished: command.isPublished,
          });
        case 'deleteQuiz':
          await adminQuizAPI.delete(variables);
          return null;
        case 'deleteQuestion':
          await adminQuizAPI.deleteQuestion({
            lessonId,
            quizId: command.quizId,
            questionId: command.questionId,
          });
          return undefined;
        case 'reorder':
          return adminQuizAPI.reorder({
            lessonId,
            quizId: command.quizId,
            questionIds: command.questionIds,
          });
        case 'question':
          return command.questionId === undefined
            ? adminQuizAPI.createQuestion({ lessonId, quizId: command.quizId, data: command.data })
            : adminQuizAPI.updateQuestion({
                lessonId,
                quizId: command.quizId,
                questionId: command.questionId,
                data: command.data,
              });
      }
    },
    retry: false,
  });

  async function run(command: Command, captured: Session, originDialog: QuizDialog | null) {
    if (busy.current || !sameSession(captured) || !mounted.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      await client.cancelQueries({ queryKey: adminQuizKey(lessonId) });
      if (!sameSession(captured) || !mounted.current) return;
      const result = await mutation.mutateAsync(command);
      if (!sameSession(captured)) return;
      await client.cancelQueries({ queryKey: adminQuizKey(lessonId) });
      if (!sameSession(captured)) return;
      if (result !== undefined) client.setQueryData(adminQuizKey(lessonId), result);
      else if (command.kind === 'deleteQuestion') {
        client.setQueryData<AdminQuiz | null>(adminQuizKey(lessonId), (current) =>
          current?.id === command.quizId
            ? {
                ...current,
                questions: current.questions.filter(
                  (question) => question.id !== command.questionId,
                ),
              }
            : current,
        );
      }
      void client.invalidateQueries({ queryKey: adminQuizKey(lessonId) });
      void client.invalidateQueries({ queryKey: ['study', 'lessons', lessonId, 'quiz'] });
      if (!mounted.current) return;
      setTarget((current) => (current === originDialog ? null : current));
      toast.success(
        command.kind.startsWith('delete')
          ? 'Đã xóa nội dung Quiz.'
          : command.kind === 'publication'
            ? command.isPublished
              ? 'Đã xuất bản Quiz.'
              : 'Đã ẩn Quiz.'
            : command.kind === 'reorder'
              ? 'Đã sắp xếp câu hỏi.'
              : 'Đã lưu Quiz.',
      );
    } catch (failure) {
      if (!sameSession(captured)) return;
      const normalized = getQuizError(failure);
      if ([400, 404, 409].includes(normalized.status ?? 0)) {
        void client.invalidateQueries({ queryKey: adminQuizKey(lessonId) });
      }
      if (!mounted.current) return;
      if (normalized.status === 404) setMissing(true);
      setError(normalized.message);
      throw normalized;
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }
  function open(value: DialogInput) {
    if (busy.current || dialog || (value.quiz && value.quiz.lessonId !== lessonId)) return;
    setMissing(false);
    setError(null);
    setTarget({ ...value, revision, userId });
  }
  async function submitMetadata(data: QuizMetadataInput) {
    if (dialog?.kind !== 'metadata' || unavailable) return;
    return run(
      dialog.quiz ? { kind: 'metadata', quizId: dialog.quiz.id, data } : { kind: 'create', data },
      dialog,
      dialog,
    );
  }
  async function submitQuestion(data: QuizQuestionInput) {
    if (dialog?.kind !== 'question' || unavailable) return;
    return run(
      { kind: 'question', quizId: dialog.quiz.id, questionId: dialog.question?.id, data },
      dialog,
      dialog,
    );
  }
  async function confirm() {
    if (!dialog || unavailable) return;
    if (dialog.kind === 'publication')
      return run(
        { kind: 'publication', quizId: dialog.quiz.id, isPublished: !dialog.quiz.isPublished },
        dialog,
        dialog,
      );
    if (dialog.kind === 'deleteQuiz')
      return run({ kind: 'deleteQuiz', quizId: dialog.quiz.id }, dialog, dialog);
    if (dialog.kind === 'deleteQuestion')
      return run(
        { kind: 'deleteQuestion', quizId: dialog.quiz.id, questionId: dialog.question.id },
        dialog,
        dialog,
      );
  }
  async function move(questionId: number, direction: -1 | 1) {
    const quiz = query.data;
    if (!quiz || dialog || quiz.questions.some((question) => !question.authoringSupported)) return;
    const ids = quiz.questions.map((question) => question.id);
    const index = ids.indexOf(questionId),
      next = index + direction;
    if (index < 0 || next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next], ids[index]];
    try {
      await run({ kind: 'reorder', quizId: quiz.id, questionIds: ids }, { revision, userId }, null);
    } catch {
      /* Inline error and refetch are handled by run. */
    }
  }
  return {
    query,
    dialog,
    pending,
    error,
    unavailable,
    open,
    submitMetadata,
    submitQuestion,
    confirm,
    move,
    close: () => {
      if (!busy.current) {
        setTarget(null);
        setError(null);
        setMissing(false);
      }
    },
  };
}
