'use client';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { categoryCourseAPI } from '@/apis/categories-course/categories-course.api';
import type { CourseCategoryResponse } from '@/apis/categories-course/categories-course.type';
import { useCrudCreate } from '@/hooks/crud/useCrudCreate';
import { useCrudUpdate } from '@/hooks/crud/useCrudUpdate';
import { getApiErrorMessage } from '@/lib/api-error';
import { CategoryCourseForm } from './CategoryCourseForm';
import type { CategoryCourseFormValues } from '../schemas/category-course.schema';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  category?: CourseCategoryResponse | null;
}
export function CategoryCourseDialog(props: Props) {
  // A fresh form/mutation instance on every open also clears uploads and validation.
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl gap-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-0 text-slate-900 shadow-2xl sm:max-w-2xl">
        {props.open && <CategoryCourseDialogForm {...props} />}
      </DialogContent>
    </Dialog>
  );
}
function CategoryCourseDialogForm({ mode, category, onOpenChange }: Props) {
  const submitting = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const create = useCrudCreate({
    queryKey: ['categories-course'],
    mutationFn: categoryCourseAPI.create,
  });
  const update = useCrudUpdate({
    queryKey: ['categories-course'],
    mutationFn: categoryCourseAPI.update,
  });
  const mutation = mode === 'edit' ? update : create;
  const submit = async (data: CategoryCourseFormValues) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      if (mode === 'edit' && category) await update.mutateAsync({ id: category.id, data });
      else await create.mutateAsync(data);
      toast.success(mode === 'edit' ? 'Cập nhật category thành công.' : 'Tạo category thành công.');
      if (mounted.current) onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      submitting.current = false;
    }
  };
  return (
    <>
      <div className="space-y-2 px-6 pb-5 pt-6 pr-12">
        <DialogTitle className="text-xl font-semibold">
          {mode === 'edit' ? 'Cập nhật danh mục' : 'Tạo danh mục'}
        </DialogTitle>
        <DialogDescription className="text-sm text-slate-500">
          Thông tin danh mục khóa học tiếng Nhật.
        </DialogDescription>
      </div>
      <CategoryCourseForm
        defaultValues={{
          name: category?.name ?? '',
          description: category?.description ?? '',
          mediaId: category?.mediaId ?? undefined,
        }}
        initialImageUrl={category?.mediaUrl}
        onSubmit={submit}
        onCancel={() => onOpenChange(false)}
        submitLabel={mode === 'edit' ? 'Lưu thay đổi' : 'Tạo danh mục'}
        submittingLabel="Đang lưu…"
        isSubmitting={mutation.isPending}
        error={mutation.isError ? getApiErrorMessage(mutation.error) : null}
      />
    </>
  );
}
