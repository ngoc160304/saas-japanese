'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Course } from '@/apis/courses/courses.type';
import { courseAPI } from '@/apis/courses/courses.api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useCrudDelete } from '@/hooks/crud/useCrudDelete';
import { getApiErrorMessage } from '@/lib/api-error';

export function CourseDeleteDialog({ course }: { course: Course }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const deletion = useCrudDelete({ queryKey: ['courses'], mutationFn: courseAPI.deleteById });

  const confirm = async () => {
    try {
      await deletion.mutateAsync(course.id);
      await queryClient.invalidateQueries({ queryKey: ['categories-course'] });
      toast.success('Đã xóa khóa học.');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => {
      if (!deletion.isPending) {
        if (next) deletion.reset();
        setOpen(next);
      }
    }}>
      <AlertDialogTrigger render={
        <Button type="button" variant="outline" size="icon" aria-label={`Xóa ${course.title}`} className="rounded-xl border-slate-200 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600" />
      }>
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
        <AlertDialogHeader className="text-center sm:place-items-center sm:text-center">
          <AlertDialogMedia className="mx-auto size-12 rounded-2xl bg-rose-50 text-rose-500">
            <Trash2 className="size-6" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-base font-bold text-slate-900">Xóa khóa học?</AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-slate-500">
            Bạn có chắc muốn xóa “{course.title}”?
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deletion.isError && <p role="alert" className="text-center text-xs text-rose-600">{getApiErrorMessage(deletion.error)}</p>}
        <AlertDialogFooter className="-mx-0 -mb-0 grid grid-cols-2 border-0 bg-transparent p-0">
          <AlertDialogCancel disabled={deletion.isPending} className="h-10 rounded-2xl border-slate-200 text-xs font-bold">Hủy</AlertDialogCancel>
          <AlertDialogAction type="button" disabled={deletion.isPending} onClick={() => void confirm()} className="h-10 rounded-2xl bg-rose-500 text-xs font-bold text-white hover:bg-rose-600">
            {deletion.isPending && <LoaderCircle className="size-4 animate-spin" />}
            {deletion.isPending ? 'Đang xóa…' : 'Xóa khóa học'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
