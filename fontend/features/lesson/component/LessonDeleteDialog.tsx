'use client';

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { lessonAPI } from '@/apis/lessons/lessons.api';
import type { Lesson } from '@/apis/lessons/lessons.type';
import { useCrudDelete } from '@/hooks/crud/useCrudDelete';
import { getApiErrorMessage } from '@/lib/api-error';
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
    try {
      await deletion.mutateAsync(lesson.id);
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
      void queryClient.invalidateQueries({ queryKey: ['categories-course'] });
      toast.success('Đã xóa bài học.');
      onDeleted();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
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
            className="bg-rose-500 text-white hover:bg-rose-600"
          >
            {pending && <LoaderCircle className="size-4 animate-spin" />}
            {pending ? 'Đang xóa…' : 'Xóa bài học'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
