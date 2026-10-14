'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Eye, Pencil } from 'lucide-react';
import type { CourseCategory } from '@/apis/categories-course/categories-course.type';
import { Button } from '@/components/ui/button';
import { CategoryCourseDialog } from './CategoryCourseDialog';
import { CategoryCourseDeletePopover } from './CategoryCourseDeletePopover';

const actionButtonClassName =
  'rounded-xl border-input bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900';

export function CategoryCourseAction({
  courseCategory,
  canEdit = false,
  canDelete = false,
  onDeleted,
  showDetail = true,
}: {
  courseCategory: CourseCategory;
  canEdit?: boolean;
  canDelete?: boolean;
  onDeleted?: () => void;
  showDetail?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center justify-end gap-2">
      {showDetail && (
        <Button
          variant="outline"
          size="icon"
          className={actionButtonClassName}
          nativeButton={false}
          render={<Link href={`/admin/categories-course/${courseCategory.id}`} />}
          aria-label={`Xem ${courseCategory.name}`}
        >
          <Eye />
        </Button>
      )}
      {canEdit && (
        <Button
          variant="outline"
          size="icon"
          className={actionButtonClassName}
          aria-label={`Sửa ${courseCategory.name}`}
          onClick={() => setOpen(true)}
        >
          <Pencil />
        </Button>
      )}
      {canDelete && <CategoryCourseDeletePopover category={courseCategory} onDeleted={onDeleted} />}
      {canEdit && (
        <CategoryCourseDialog
          open={open}
          onOpenChange={setOpen}
          mode="edit"
          category={courseCategory}
        />
      )}
    </div>
  );
}
