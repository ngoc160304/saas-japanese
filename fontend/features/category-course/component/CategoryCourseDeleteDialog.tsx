'use client';

import { useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { categoryCourseAPI } from '@/apis/categories-course/categories-course.api';
import type { CourseCategory } from '@/apis/categories-course/categories-course.type';
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
import { useCrudDelete } from '@/hooks/crud/useCrudDelete';
import { getApiErrorMessage } from '@/lib/api-error';

interface CategoryCourseDeleteDialogProps {
  category: CourseCategory | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function CategoryCourseDeleteDialog({
  category,
  onClose,
  onDeleted,
}: CategoryCourseDeleteDialogProps) {
  const submitting = useRef(false);
  const deletion = useCrudDelete({
    queryKey: ['categories-course'],
    mutationFn: categoryCourseAPI.deleteByid,
  });

  const handleDelete = async () => {
    if (!category || submitting.current) return;
    submitting.current = true;
    try {
      await deletion.mutateAsync(category.id);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      submitting.current = false;
      return;
    }
    submitting.current = false;
    toast.success('Đã xóa danh mục.');
    onClose();
    onDeleted();
  };

  return (
    <AlertDialog
      open={category !== null}
      onOpenChange={(open) => {
        if (!open && !submitting.current) onClose();
      }}
    >
      <AlertDialogContent className="w-[calc(100vw-32px)] rounded-3xl border border-slate-100 bg-white text-slate-900 sm:max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <Trash2 aria-hidden="true" className="h-6 w-6" />
          </div>
          <AlertDialogTitle>Xóa danh mục?</AlertDialogTitle>
          <AlertDialogDescription className="break-words text-slate-500">
            Bạn có chắc chắn muốn xóa danh mục <strong>{category?.name}</strong>? Bạn không thể hoàn
            tác thao tác này trên giao diện.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deletion.isError && (
          <p role="alert" className="text-sm text-rose-600">
            {getApiErrorMessage(deletion.error)}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletion.isPending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deletion.isPending}
            onClick={handleDelete}
          >
            {deletion.isPending ? 'Đang xóa…' : 'Xóa danh mục'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
