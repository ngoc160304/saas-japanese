'use client';

import Link from 'next/link';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CourseCategory } from '@/apis/categories-course/categories-course.type';
import { categoryCourseAPI } from '@/apis/categories-course/categories-course.api';
import { courseAPI } from '@/apis/courses/courses.api';
import { IsLoading } from '@/components/common/loading/IsLoading';
import { Button } from '@/components/ui/button';
import { useCrudCreate } from '@/hooks/crud/useCrudCreate';
import { useCrudUpdate } from '@/hooks/crud/useCrudUpdate';
import { getApiError, getApiErrorMessage } from '@/lib/api-error';
import { CourseForm } from './CourseForm';
import type { CourseFormValues } from '../schemas/course.schema';

async function getCategoryOptions(): Promise<CourseCategory[]> {
  const first = await categoryCourseAPI.getCategoriesCourse({ page: 1, size: 12 });
  const categories = [...first.data.content];
  for (let page = 2; page <= first.data.totalPages; page += 1) {
    const next = await categoryCourseAPI.getCategoriesCourse({ page, size: 12 });
    categories.push(...next.data.content);
  }
  return categories;
}

export function CourseEditor({ id }: { id?: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = id !== undefined;
  const courseQuery = useQuery({
    queryKey: ['courses', 'detail', id],
    queryFn: () => {
      if (id === undefined) throw new Error('Thiếu ID khóa học.');
      return courseAPI.getById(id);
    },
    enabled: isEditing,
    retry: false,
  });
  const categoriesQuery = useQuery({
    queryKey: ['categories-course', 'course-options'],
    queryFn: getCategoryOptions,
  });
  const listMatchQuery = useQuery({
    queryKey: ['courses', 'editor-category', id, courseQuery.data?.title],
    queryFn: () => courseAPI.getCourses({
      title: courseQuery.data?.title,
      search: '',
      page: 1,
      size: 12,
    }),
    enabled: isEditing && Boolean(courseQuery.data?.title),
    retry: false,
  });
  const create = useCrudCreate({ queryKey: ['courses'], mutationFn: courseAPI.create });
  const update = useCrudUpdate({ queryKey: ['courses'], mutationFn: courseAPI.update });
  const mutation = isEditing ? update : create;
  const course = courseQuery.data;
  const categories = categoriesQuery.data ?? [];
  const listMatch = listMatchQuery.data?.data.content.find((item) => item.id === id);
  const categoryMatches = categories.filter((item) => item.name === listMatch?.categoryName);
  const categoryId = categoryMatches.length === 1 ? categoryMatches[0].id : 0;

  const submit = async (values: CourseFormValues) => {
    try {
      if (id === undefined) {
        await create.mutateAsync({
          title: values.title,
          categoryId: values.categoryId,
          description: values.description,
          thumbnailId: values.thumbnailId,
          isPublished: values.published,
          price: values.price,
        });
        toast.success('Đã tạo khóa học.');
      } else {
        await update.mutateAsync({
          id,
          data: {
            title: values.title,
            categoryId: values.categoryId,
            description: values.description,
            published: values.published,
            // A null value makes the current service retain the existing thumbnail.
            thumbnailId: values.thumbnailId,
            // Course categories represent the JLPT level in the current domain model.
            levelId: values.categoryId,
          },
        });
        toast.success('Đã cập nhật khóa học.');
      }
      await queryClient.invalidateQueries({ queryKey: ['categories-course'] });
      router.push('/admin/courses');
    } catch (error) {
      const apiError = getApiError(error);
      if (Object.keys(apiError.fieldErrors).length === 0) toast.error(apiError.message);
    }
  };

  if ((isEditing && courseQuery.isLoading) || categoriesQuery.isLoading || (isEditing && listMatchQuery.isLoading)) {
    return <IsLoading className="min-h-64" size={28} />;
  }

  if ((isEditing && (courseQuery.isError || !course)) || categoriesQuery.isError) {
    return (
      <div role="alert" className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
        <h1 className="text-lg font-bold text-slate-900">Không thể tải biểu mẫu khóa học</h1>
        <p className="mt-2 text-sm text-rose-600">
          {getApiErrorMessage(courseQuery.error ?? categoriesQuery.error)}
        </p>
        <div className="mt-4 flex gap-3">
          <Button variant="outline" onClick={() => {
            void courseQuery.refetch();
            void categoriesQuery.refetch();
          }}>Thử lại</Button>
          <Link href="/admin/courses" className="self-center text-sm font-semibold text-sky-700">Về danh sách</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full">
      <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <nav aria-label="Đường dẫn" className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link href="/admin/courses" className="hover:text-slate-600">Khóa học</Link>
            <span aria-hidden="true">/</span>
            <span className="text-slate-800">{isEditing ? 'Chỉnh sửa' : 'Tạo mới'}</span>
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
            {isEditing ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
          </h1>
          <p className="mt-0.5 text-sm font-medium text-slate-500">
            {isEditing ? 'Cập nhật thông tin và trạng thái khóa học.' : 'Nhập thông tin cơ bản cho khóa học.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/admin/courses" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-sky-500">
            Hủy
          </Link>
          <Button type="submit" form="course-form" disabled={mutation.isPending || categories.length === 0} className="h-auto rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-600 md:text-sm">
            {mutation.isPending && <LoaderCircle className="size-4 animate-spin" />}
            {mutation.isPending ? 'Đang lưu…' : isEditing ? 'Lưu thay đổi' : 'Tạo khóa học'}
          </Button>
        </div>
      </header>
      {categories.length === 0 ? (
        <div role="status" className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-600 shadow-soft">
          Chưa có danh mục khóa học. Hãy tạo danh mục trước khi tạo khóa học.
          <Link href="/admin/categories-course" className="ml-2 font-semibold text-sky-700 hover:underline">Quản lý danh mục</Link>
        </div>
      ) : (
        <CourseForm
          key={id ?? 'create'}
          mode={isEditing ? 'edit' : 'create'}
          categories={categories}
          initialImageUrl={course?.thumnailURL ?? null}
          defaultValues={{
            title: course?.title ?? '',
            categoryId,
            description: course?.description ?? '',
            price: course?.price ?? 0,
            published: course?.published ?? false,
            thumbnailId: null,
          }}
          onSubmit={submit}
          isSubmitting={mutation.isPending}
          mutationError={mutation.error}
        />
      )}
    </div>
  );
}
