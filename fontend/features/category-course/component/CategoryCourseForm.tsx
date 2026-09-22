'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { IMAGE_TYPE, MAX_IMAGE_SIZE } from '@/utils/constant';
import { useUploadImage } from '../hooks/useUploadImage';

import { getApiErrorMessage } from '@/lib/api-error';
import { CategoryCourseFormValues, categoryCourseSchema } from '../schemas/category-course.schema';

interface CategoryCourseFormProps {
  defaultValues: CategoryCourseFormValues;

  submitLabel: string;
  submittingLabel: string;

  onSubmit: (data: CategoryCourseFormValues) => void;

  isSubmitting?: boolean;

  initialImageUrl?: string | null;
  onCancel: () => void;
  error: string | null;
}

export function CategoryCourseForm({
  defaultValues,
  submitLabel,
  submittingLabel,
  onSubmit,
  isSubmitting = false,
  initialImageUrl,
  onCancel,
  error,
}: CategoryCourseFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl ?? null);

  const uploadImageMutation = useUploadImage();
  const [imageError, setImageError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CategoryCourseFormValues>({
    resolver: zodResolver(categoryCourseSchema),
    defaultValues,
  });

  useEffect(
    () => () => {
      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    },
    [imagePreview],
  );

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || uploadImageMutation.isPending || isSubmitting) return;
    setImageError(null);

    if (!IMAGE_TYPE.includes(file.type)) {
      setImageError('Chỉ hỗ trợ PNG, JPG hoặc WebP.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Ảnh không được vượt quá 5MB.');
      event.target.value = '';
      return;
    }

    event.target.value = '';
    setImage(file);
    setImagePreview(URL.createObjectURL(file));

    uploadImageMutation.mutate(file, {
      onSuccess: (media) => {
        setImageError(null);

        setValue('mediaId', media.data.id, {
          shouldValidate: true,
          shouldDirty: true,
        });
      },

      onError: (error) => {
        setImageError(getApiErrorMessage(error));
        setImage(null);
        setImagePreview(initialImageUrl ?? null);

        setValue('mediaId', defaultValues.mediaId);
      },
    });
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImageError(null);
    uploadImageMutation.reset();

    setValue('mediaId', null, {
      shouldDirty: true,
    });

    setImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormSubmit = (data: CategoryCourseFormValues) => {
    if (!isSubmitting && !uploadImageMutation.isPending) onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="space-y-6 px-6 pb-8">
        {/* Name */}
        <div className="space-y-2">
          <label htmlFor="category-name" className="text-sm font-medium text-slate-700">
            Name
            <span className="ml-1 text-red-500">*</span>
          </label>

          <Input
            id="category-name"
            placeholder="e.g. JLPT N5"
            disabled={isSubmitting}
            {...register('name')}
            className="h-10 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-900 focus-visible:ring-1 focus-visible:ring-slate-900"
          />

          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="category-description" className="text-sm font-medium text-slate-700">
            Description
          </label>

          <Textarea
            id="category-description"
            placeholder="Describe this course category..."
            disabled={isSubmitting}
            {...register('description')}
            className="min-h-32 w-full resize-y border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-900 focus-visible:ring-1 focus-visible:ring-slate-900"
          />

          {errors.description && (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Image */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Cover Image</label>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Category preview"
                    className="h-full w-full object-cover"
                  />

                  {uploadImageMutation.isPending && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <LoaderCircle className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isSubmitting || uploadImageMutation.isPending}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                  <ImagePlus className="h-7 w-7" />

                  <span className="text-xs">Image preview</span>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                disabled={isSubmitting || uploadImageMutation.isPending}
                className="hidden"
                id="category-image"
              />

              <label
                htmlFor="category-image"
                className="inline-flex h-10 w-fit cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <ImagePlus className="h-4 w-4" />
                Choose Image
              </label>

              <p className="text-xs leading-5 text-slate-400">
                PNG, JPG or WebP. Maximum file size: 5MB.
              </p>

              {image && <p className="max-w-full truncate text-xs text-slate-600">{image.name}</p>}

              {uploadImageMutation.isSuccess && (
                <p className="text-xs text-emerald-600">Image uploaded successfully.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {imageError && (
        <p role="alert" className="px-6 pb-4 text-sm text-rose-600">
          {imageError}
        </p>
      )}
      {error && (
        <p role="alert" className="px-6 pb-4 text-sm text-rose-600">
          {error}
        </p>
      )}
      <div className="border-t border-slate-100 px-6 pt-4 pb-6">
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="border-slate-200 bg-white text-slate-900 hover:border-[#00A5CF] hover:bg-[#00A5CF] hover:text-slate-900" onClick={onCancel}>
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || uploadImageMutation.isPending}
            className="border-slate-200 bg-white text-slate-900 hover:border-[#00A5CF] hover:bg-[#00A5CF] hover:text-slate-900"
          >
            {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}

            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
