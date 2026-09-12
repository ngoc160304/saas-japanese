'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CategoryCourseAction } from './CategoryCourseActions';
import { CourseCategory } from '@/apis/categories-course/categories-course.type';

interface CourseTableProps {
  courseCategories: CourseCategory[];
  canEdit?: boolean;
  canDelete?: boolean;
  onDelete?: (id: number) => void;
  onReload: () => void;
}

export function CourseCategoriesTable({
  courseCategories,
  canEdit = false,
  canDelete = false,
  onDelete,
  onReload,
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

        <TableBody>
          {courseCategories.map((item) => (
            <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50/70">
              <TableCell className="align-middle">
                <div className="flex min-w-[220px] items-center gap-3">
                  <img
                    src={item.mediaUrl}
                    alt={item.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-xl border border-slate-100 bg-slate-50 object-contain p-1"
                  />

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
                  courseId={item.id}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onDelete={onDelete}
                  onReload={onReload}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
