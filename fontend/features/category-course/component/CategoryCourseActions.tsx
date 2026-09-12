'use client';

import Link from 'next/link';
import { Pencil, Trash2, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { categoryCourseAPI } from '@/apis/categories-course/categories-course.api';

interface CourseActionsProps {
  courseId: number;
  canEdit?: boolean;
  canDelete?: boolean;
  onDelete?: (id: number) => void;
  onReload: () => void;
}

export function CategoryCourseAction({
  courseId,
  canEdit = false,
  canDelete = false,
  onDelete,
  onReload,
}: CourseActionsProps) {
  const handleDeleteByid = async () => {
    const result = await categoryCourseAPI.deleteCategortByid(courseId + '');
    console.log('run here 1');

    onReload();

    console.log('run here 2');
  };
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Link
        href={`/courses/${courseId}`}
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
        <Link
          href={`/admin/courses/${courseId}/edit`}
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
        </Link>
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
    </div>
  );
}
