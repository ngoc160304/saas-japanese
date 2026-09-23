'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, LoaderCircle, X } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import type { CourseCategory } from '@/apis/categories-course/categories-course.type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUploadImage } from '@/features/category-course/hooks/useUploadImage';
import { getApiError, getApiErrorMessage } from '@/lib/api-error';
import { IMAGE_TYPE, MAX_IMAGE_SIZE } from '@/utils/constant';
import { courseSchema, type CourseFormValues } from '../schemas/course.schema';

interface CourseFormProps {
  mode: 'create' | 'edit';
  categories: CourseCategory[];
  defaultValues: CourseFormValues;
  initialImageUrl: string | null;
  onSubmit: (values: CourseFormValues) => Promise<void>;
  isSubmitting: boolean;
  mutationError: unknown;
}

export function CourseForm({
  mode,
  categories,
  defaultValues,
  initialImageUrl,
  onSubmit,
  isSubmitting,
  mutationError,
}: CourseFormProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialImageUrl);
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const upload = useUploadImage();
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<CourseFormValues>({ resolver: zodResolver(courseSchema), defaultValues });
  const apiError = useMemo(
    () => (mutationError ? getApiError(mutationError) : null),
    [mutationError],
  );
  const busy = isSubmitting || upload.isPending;
  const selectedCategoryId = useWatch({ control, name: 'categoryId' });
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const canUpload =
    mode === 'create' ||
    (Boolean(initialImageUrl) && typeof selectedCategory?.mediaId === 'number');

  useEffect(
    () => () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  useEffect(() => {
    if (!apiError) return;
    const fields = apiError.fieldErrors;
    if (fields.title) setError('title', { message: fields.title });
    if (fields.categoryId) setError('categoryId', { message: fields.categoryId });
    if (fields.description) setError('description', { message: fields.description });
    if (fields.price) setError('price', { message: fields.price });
    if (fields.thumbnailId) setError('thumbnailId', { message: fields.thumbnailId });
    if (fields.isPublished || fields.published)
      setError('published', { message: fields.isPublished ?? fields.published });
  }, [apiError, setError]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || busy || !canUpload) return;
    setImageError(null);
    if (!IMAGE_TYPE.includes(file.type)) {
      setImageError('Chỉ hỗ trợ PNG, JPG hoặc WebP.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Ảnh không được vượt quá 5MB.');
      return;
    }
    setPreview(URL.createObjectURL(file));
    setImageName(file.name);
    upload.mutate(file, {
      onSuccess: (media) => {
        setValue('thumbnailId', media.data.id, { shouldDirty: true, shouldValidate: true });
        setPreview(media.data.secureUrl);
      },
      onError: (error) => {
        setImageError(getApiErrorMessage(error));
        setValue('thumbnailId', null);
        setPreview(initialImageUrl);
        setImageName(null);
      },
    });
  };

  const resetImage = () => {
    setValue('thumbnailId', null, { shouldDirty: true });
    setPreview(mode === 'edit' ? initialImageUrl : null);
    setImageName(null);
    setImageError(null);
    upload.reset();
  };

  return (
    <div className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-100 bg-white p-6 shadow-soft md:p-8 lg:p-10">
      <form
        id="course-form"
        className="space-y-6"
        onSubmit={handleSubmit((values) => {
          if (!busy) void onSubmit(values);
        })}
      >
        <div>
          <label htmlFor="course-title" className="mb-1.5 block text-xs font-bold text-slate-700">
            Tên khóa học <span className="text-rose-500">*</span>
          </label>
          <Input
            id="course-title"
            maxLength={200}
            placeholder="Ví dụ: Tiếng Nhật Trung Cấp N3"
            disabled={busy}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'course-title-error' : undefined}
            className="h-11 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm font-semibold focus-visible:bg-white focus-visible:ring-sky-500"
            {...register('title')}
          />
          {errors.title && (
            <p id="course-title-error" className="mt-1 text-xs text-rose-600">
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
          <div className="md:col-span-3">
            <label
              htmlFor="course-category"
              className="mb-1.5 block text-xs font-bold text-slate-700"
            >
              Danh mục <span className="text-rose-500">*</span>
            </label>
            <select
              id="course-category"
              disabled={busy}
              aria-invalid={Boolean(errors.categoryId)}
              aria-describedby={errors.categoryId ? 'course-category-error' : undefined}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 focus-visible:outline-2 focus-visible:outline-sky-500 disabled:opacity-50"
              {...register('categoryId', { valueAsNumber: true })}
            >
              <option value="0">Chọn danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p id="course-category-error" className="mt-1 text-xs text-rose-600">
                {errors.categoryId.message}
              </p>
            )}
            {mode === 'edit' && defaultValues.categoryId === 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Vui lòng chọn lại danh mục cho khóa học này.
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label htmlFor="course-price" className="mb-1.5 block text-xs font-bold text-slate-700">
              Giá (VND) <span className="text-rose-500">*</span>
            </label>
            <Input
              id="course-price"
              type="number"
              min="0"
              step="0.01"
              disabled={busy}
              readOnly={mode === 'edit'}
              aria-invalid={Boolean(errors.price)}
              aria-describedby={errors.price ? 'course-price-error' : undefined}
              className="h-11 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm font-semibold focus-visible:bg-white focus-visible:ring-sky-500"
              {...register('price', { valueAsNumber: true })}
            />
            {errors.price && (
              <p id="course-price-error" className="mt-1 text-xs text-rose-600">
                {errors.price.message}
              </p>
            )}
            <p className="mt-1 text-[11px] text-slate-500">
              {mode === 'edit'
                ? 'Giá hiện tại; API cập nhật chưa hỗ trợ thay đổi giá.'
                : 'Nhập 0 cho khóa học miễn phí.'}
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="course-description"
            className="mb-1.5 block text-xs font-bold text-slate-700"
          >
            Mô tả <span className="text-rose-500">*</span>
          </label>
          <Textarea
            id="course-description"
            rows={4}
            disabled={busy}
            placeholder="Mô tả nội dung và mục tiêu của khóa học"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? 'course-description-error' : undefined}
            className="w-full rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus-visible:bg-white focus-visible:ring-sky-500"
            {...register('description')}
          />
          {errors.description && (
            <p id="course-description-error" className="mt-1 text-xs text-rose-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <section className="border-t border-slate-100 pt-6">
          <p className="mb-1.5 text-xs font-bold text-slate-700">Ảnh khóa học</p>
          <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-400">
              {preview ? (
                // Backend media URLs and local previews do not use the image optimizer.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Xem trước ảnh khóa học"
                  className="size-full object-cover"
                />
              ) : (
                <ImagePlus className="size-6" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-800">
                {imageName ?? (preview ? 'Ảnh hiện tại' : 'Chưa chọn ảnh')}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">PNG, JPG hoặc WebP · tối đa 5MB</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onFileChange}
                  disabled={busy || !canUpload}
                  className="sr-only"
                  aria-label="Chọn ảnh khóa học"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy || !canUpload}
                  onClick={() => fileInput.current?.click()}
                  className="rounded-xl border-slate-200 text-xs"
                >
                  {upload.isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <ImagePlus className="size-4" />
                  )}
                  {upload.isPending ? 'Đang tải ảnh…' : 'Chọn ảnh'}
                </Button>
                {(imageName || (mode === 'create' && preview)) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={resetImage}
                    className="rounded-xl text-xs text-slate-600"
                  >
                    <X className="size-4" /> Bỏ ảnh
                  </Button>
                )}
              </div>
            </div>
          </div>
          {imageError && (
            <p role="alert" className="mt-1 text-xs text-rose-600">
              {imageError}
            </p>
          )}
          {!canUpload && mode === 'edit' && (
            <p className="mt-1 text-xs text-slate-500">Hiện chưa thể thay ảnh cho khóa học này.</p>
          )}
          {errors.thumbnailId && (
            <p className="mt-1 text-xs text-rose-600">{errors.thumbnailId.message}</p>
          )}
          {upload.isSuccess && !imageError && (
            <p role="status" className="mt-1 text-xs text-emerald-700">
              Ảnh đã tải lên.
            </p>
          )}
        </section>

        <section className="border-t border-slate-100 pt-6">
          <p className="mb-1.5 text-xs font-bold text-slate-700">Trạng thái xuất bản</p>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <label htmlFor="course-published" className="text-xs font-bold text-slate-800">
                Xuất bản ngay
              </label>
              <p className="text-[11px] text-slate-500">Cho phép học viên nhìn thấy khóa học.</p>
            </div>
            <input
              id="course-published"
              type="checkbox"
              disabled={busy}
              aria-invalid={Boolean(errors.published)}
              className="size-5 cursor-pointer accent-emerald-500 focus-visible:outline-2 focus-visible:outline-sky-500"
              {...register('published')}
            />
          </div>
          {errors.published && (
            <p className="mt-1 text-xs text-rose-600">{errors.published.message}</p>
          )}
        </section>

        {apiError && (
          <p role="alert" className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">
            {apiError.message}
          </p>
        )}

        <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center">
          <Link
            href="/admin/courses"
            className="rounded-2xl border border-slate-200 px-5 py-2.5 text-center text-xs font-bold text-slate-600 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-sky-500"
          >
            Hủy và quay lại
          </Link>
          <Button
            type="submit"
            disabled={busy}
            className="h-auto rounded-2xl bg-slate-900 px-6 py-3 text-xs font-bold text-white hover:bg-sky-600 md:text-sm"
          >
            {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
            {isSubmitting ? 'Đang lưu…' : mode === 'edit' ? 'Lưu thay đổi' : 'Tạo khóa học'}
          </Button>
        </div>
      </form>
    </div>
  );
}
