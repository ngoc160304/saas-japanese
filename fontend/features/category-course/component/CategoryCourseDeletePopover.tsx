'use client';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CourseCategory } from '@/apis/categories-course/categories-course.type';
import { categoryCourseAPI } from '@/apis/categories-course/categories-course.api';
import { DeleteConfirmPopover } from '@/components/common/DeleteConfirmPopover';
import { Button } from '@/components/ui/button';
import { useCrudDelete } from '@/hooks/crud/useCrudDelete';
import { getApiErrorMessage } from '@/lib/api-error';

export function CategoryCourseDeletePopover({
  category,
  onDeleted,
}: {
  category: CourseCategory;
  onDeleted?: () => void;
}) {
  const deletion = useCrudDelete({
    queryKey: ['categories-course'],
    mutationFn: categoryCourseAPI.deleteByid,
  });
  return (
    <DeleteConfirmPopover
      title="Xóa danh mục?"
      description={`Bạn có chắc muốn xóa “${category.name}”? `}
      trigger={
        <Button
          variant="outline"
          size="icon"
          className="border-slate-200 bg-white text-slate-900 hover:border-[#00A5CF] hover:bg-[#00A5CF] hover:text-slate-900"
          aria-label={`Xóa ${category.name}`}
        >
          <Trash2 />
        </Button>
      }
      errorMessage={getApiErrorMessage}
      onConfirm={async () => {
        try {
          await deletion.mutateAsync(category.id);
        } catch (error) {
          toast.error(getApiErrorMessage(error));
          throw error;
        }
        toast.success('Xóa category thành công.');
        onDeleted?.();
      }}
    />
  );
}
