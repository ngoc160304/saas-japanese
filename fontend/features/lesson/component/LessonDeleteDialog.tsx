'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { lessonAPI } from '@/apis/lessons/lessons.api';
import type { Lesson } from '@/apis/lessons/lessons.type';
import { useCrudDelete } from '@/hooks/crud/useCrudDelete';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAppStore } from '@/store/hooks';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function LessonDeleteDialog({
  lesson,
  onClose,
  onDeleted,
}: {
  lesson: Lesson;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const queryClient = useQueryClient();
  const store = useAppStore();
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  const deletion = useCrudDelete({
    queryKey: ['lessons', lesson.courseId],
    mutationFn: lessonAPI.deleteById,
  });
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const confirm = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    const revision = store.getState().auth.revision;
    try {
      await deletion.mutateAsync(lesson.id);
      if (store.getState().auth.revision !== revision) return;
      void queryClient.invalidateQueries({ queryKey: ['lessons', 'curriculum', lesson.courseId] });
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
      void queryClient.invalidateQueries({ queryKey: ['categories-course'] });
      queryClient.removeQueries({ queryKey: ['lessons', 'detail', lesson.id] });
      queryClient.removeQueries({ queryKey: ['admin', 'lessons', lesson.id] });
      queryClient.removeQueries({ queryKey: ['admin', 'lesson-draft', lesson.courseId, lesson.id] });
      if (!active.current) return;
      toast.success('Đã xóa bài học.');
      onDeleted();
      onClose();
    } catch (error) {
      if (active.current && store.getState().auth.revision === revision) toast.error(getApiErrorMessage(error));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  };
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !submitting.current) onClose();
      }}
    >
      <AlertDialogContent className="rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa bài học?</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xóa “{lesson.title}”? Bài học sẽ không còn hiển thị trong danh sách.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deletion.isError && (
          <p role="alert" className="text-sm text-rose-600">
            {getApiErrorMessage(deletion.error)}
          </p>
        )}
        <AlertDialogFooter className="m-0 border-0 bg-transparent p-0">
          <AlertDialogCancel disabled={pending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={() => void confirm()}
            className="bg-rose-700 text-white hover:bg-rose-800"
          >
            {pending && <LoaderCircle className="size-4 animate-spin" />}
            {pending ? 'Đang xóa…' : 'Xóa bài học'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
