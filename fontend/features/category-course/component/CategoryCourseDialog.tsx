'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { CategoryCourseForm } from './CategoryCourseForm';

import { useCrudCreate } from '@/hooks/crud/useCrudCreate';
import { useCrudUpdate } from '@/hooks/crud/useCrudUpdate';

import { categoryCourseAPI } from '@/apis/categories-course/categories-course.api';
import {
  CourseCategoryResponse,
  ReqCreateCourseCategory,
} from '@/apis/categories-course/categories-course.type';
import { CategoryCourseFormValues } from '../schemas/category-course.schema';
import { useState } from 'react';
import { GetMediaResponse } from '@/apis/upload/upload.type';

interface CategoryCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  mode: 'create' | 'edit';

  category?: CourseCategoryResponse | null;
  onReload: () => void;
}

const emptyValues: CategoryCourseFormValues = {
  name: '',
  description: '',
  mediaId: undefined,
};

export function CategoryCourseDialog({
  open,
  onOpenChange,
  mode,
  category,
  onReload,
}: CategoryCourseDialogProps) {
  const isEdit = mode === 'edit';
  const [uploadedMedia, setUploadedMedia] = useState<GetMediaResponse | null>(null);
  const createMutation = useCrudCreate<ReqCreateCourseCategory, CourseCategoryResponse>({
    queryKey: ['categories-course'],
    mutationFn: categoryCourseAPI.create,
  });

  const updateMutation = useCrudUpdate<ReqCreateCourseCategory, CourseCategoryResponse>({
    queryKey: ['categories-course'],
    mutationFn: categoryCourseAPI.update,
  });

  const mutation = isEdit ? updateMutation : createMutation;

  const defaultValues: CategoryCourseFormValues =
    isEdit && category
      ? {
          name: category.name,
          description: category.description ?? '',
          mediaId: category.mediaId ?? undefined,
        }
      : emptyValues;

  const handleSubmit = (data: CategoryCourseFormValues) => {
    if (isEdit) {
      if (!category) return;

      updateMutation.mutate(
        {
          id: category.id,
          data: data as ReqCreateCourseCategory,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        },
      );

      return;
    }
    console.log('uploadedMedia :', uploadedMedia);
    const dataUpdate: ReqCreateCourseCategory = {
      ...data,
      mediaId: uploadedMedia?.data?.id,
    };

    createMutation.mutate(dataUpdate, {
      onSuccess: () => {
        onReload();
        onOpenChange(false);
        console.log('tao moi thanh cong');
      },
    });
  };

  const handleOpenChange = (value: boolean) => {
    if (mutation.isPending) {
      return;
    }

    onOpenChange(value);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="w-[calc(100vw-32px)]! max-w-240! overflow-hidden border-slate-200 bg-white p-0">
        <AlertDialogHeader className="px-6 pt-6 pb-5">
          <AlertDialogTitle className="text-xl font-semibold text-slate-900">
            {isEdit ? 'Edit Course Category' : 'Add Course Category'}
          </AlertDialogTitle>

          <AlertDialogDescription className="text-sm leading-5 text-slate-500">
            {isEdit
              ? 'Update the course category information.'
              : 'Create a new category for your Japanese courses.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <CategoryCourseForm
          defaultValues={defaultValues}
          initialImageUrl={category?.mediaUrl ?? null}
          submitLabel={isEdit ? 'Save Changes' : 'Create Category'}
          submittingLabel={isEdit ? 'Saving...' : 'Creating...'}
          onSubmit={handleSubmit}
          isSubmitting={mutation.isPending}
          setUploadedMedia={setUploadedMedia}
          uploadedMedia={uploadedMedia}
        />

        <AlertDialogFooter className="absolute bottom-0 left-0">
          <AlertDialogCancel className="hidden" />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
