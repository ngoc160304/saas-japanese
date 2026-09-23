'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CourseThumbnail } from '@/features/course/component/CourseThumbnail';
import { CategoryCourseAction } from './CategoryCourseActions';
import { CourseCategory } from '@/apis/categories-course/categories-course.type';
import { IsLoading } from '@/components/common/loading/IsLoading';
import { Button } from '@/components/ui/button';

interface CourseTableProps {
  courseCategories: CourseCategory[];
  canEdit?: boolean;
  canDelete?: boolean;
  onDeleted?: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function CourseCategoriesTable({
  courseCategories,
  canEdit = false,
  canDelete = false,
  onDeleted,
  isLoading = false,
  error,
  onRetry,
}: CourseTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100">
      <Table className="text-xs">
        <TableHeader className="bg-slate-50/80">
          <TableRow className="border-b border-slate-100 hover:bg-transparent">
            <TableHead className="text-slate-700 font-semibold">Course</TableHead>
            <TableHead className="text-slate-700 font-semibold">Description</TableHead>
            <TableHead className="text-slate-700 font-semibold">Stats</TableHead>
            <TableHead className="text-right text-slate-700 font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody aria-busy={isLoading}>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="h-44">
                <IsLoading size={28} />
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={4} className="h-44 text-center">
                <div role="alert" className="space-y-3 text-sm text-rose-600">
                  <p>{error}</p>
                  <Button type="button" variant="outline" onClick={onRetry}>
                    Thử lại
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : courseCategories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-44 text-center text-slate-500">
                Không tìm thấy danh mục. Hãy thử từ khóa hoặc bộ lọc khác.
              </TableCell>
            </TableRow>
          ) : (
            courseCategories.map((item) => (
              <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                <TableCell className="align-middle">
                  <div className="flex min-w-55 items-center gap-3">
                    <CourseThumbnail src={item.mediaUrl} title={item.name} />

                    <span className="line-clamp-1 text-xs font-bold text-slate-900 md:text-sm">
                      {item.name}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="max-w-xs align-middle">
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {item.description}
                  </p>
                </TableCell>

                <TableCell className="whitespace-nowrap align-middle">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-800">{item.courseCount} courses</div>
                  </div>
                </TableCell>

                <TableCell className="whitespace-nowrap text-right align-middle">
                  <CategoryCourseAction
                    courseCategory={item}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onDeleted={onDeleted}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
