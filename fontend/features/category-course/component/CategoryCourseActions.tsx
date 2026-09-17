'use client';

import Link from 'next/link';
import { Pencil, Trash2, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { categoryCourseAPI } from '@/apis/categories-course/categories-course.api';
import { CategoryCourseDialog } from './CategoryCourseDialog';
import { useState } from 'react';
import { CourseCategory } from '@/apis/categories-course/categories-course.type';

interface CourseActionsProps {
  courseCategory: CourseCategory;
  canEdit?: boolean;
  canDelete?: boolean;
  onDelete?: (id: number) => void;
  onReload: () => void;
}

export function CategoryCourseAction({
  courseCategory,
  canEdit = false,
  canDelete = false,
  onDelete,
  onReload,
}: CourseActionsProps) {
  const handleDeleteByid = async () => {
    await categoryCourseAPI.deleteByid(courseCategory.id + '');
    onReload();
  };
  const handleEdit = () => {
    setEditDialogOpen(true);
  };
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Link
        href={`/courses/${courseCategory.id + ''}`}
        className="
            inline-flex
            h-8
            w-8
            items-center
            justify-center
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            text-slate-600
            transition-colors
            hover:border-sky-200
            hover:bg-sky-50
            hover:text-sky-600
          "
      >
        <Eye />
      </Link>

      {canEdit && (
        <Button
          onClick={handleEdit}
          title="Edit"
          aria-label="Edit"
          className="
            inline-flex
            h-8
            w-8
            items-center
            justify-center
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            text-slate-600
            transition-colors
            hover:border-sky-200
            hover:bg-sky-50
            hover:text-sky-600
          "
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}

      {canDelete && (
        <Button
          type="button"
          size="icon"
          variant="outline"
          title="Delete"
          aria-label="Delete"
          onClick={handleDeleteByid}
          className="
            h-8
            w-8
            rounded-xl
            border-slate-200
            bg-slate-50
            text-slate-400
            hover:border-rose-200
            hover:bg-rose-50
            hover:text-rose-600
          "
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      {canEdit && (
        <CategoryCourseDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          mode="edit"
          category={courseCategory}
          onReload={onReload}
        />
      )}
    </div>
  );
}
