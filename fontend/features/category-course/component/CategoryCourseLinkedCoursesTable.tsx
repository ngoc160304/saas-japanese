import type { Course } from '@/apis/courses/courses.type';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CourseActions } from '@/features/course/component/CourseActions';
import { CourseStatusBadge } from '@/features/course/component/CourseStatusBadge';
import { CourseThumbnail } from '@/features/course/component/CourseThumbnail';
import { formatCoursePrice } from '@/features/course/utils/course-format';

export function CategoryCourseLinkedCoursesTable({ courses }: { courses: Course[] }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-100">
      <Table aria-label="Khóa học trong danh mục" className="text-xs">
        <TableHeader className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
          <TableRow className="border-slate-100 hover:bg-slate-50/80">
            <TableHead className="px-4 py-3.5 font-bold text-slate-500">Ảnh & tên khóa học</TableHead>
            <TableHead className="px-4 py-3.5 font-bold text-slate-500">Mô tả</TableHead>
            <TableHead className="px-4 py-3.5 font-bold text-slate-500">Bài học</TableHead>
            <TableHead className="px-4 py-3.5 font-bold text-slate-500">Giá</TableHead>
            <TableHead className="px-4 py-3.5 font-bold text-slate-500">Trạng thái</TableHead>
            <TableHead className="px-4 py-3.5 text-right font-bold text-slate-500">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id} className="border-slate-100 hover:bg-slate-50/70">
              <TableCell className="px-4 py-4">
                <div className="flex min-w-48 max-w-72 items-center gap-3">
                  <CourseThumbnail src={course.thumnailURL} title={course.title} />
                  <span className="line-clamp-2 whitespace-normal text-xs font-bold text-slate-900 md:text-sm">
                    {course.title}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-4 py-4">
                <p className="line-clamp-2 max-w-xs min-w-40 whitespace-normal text-xs text-slate-500">
                  {course.description || 'Chưa có mô tả'}
                </p>
              </TableCell>
              <TableCell className="px-4 py-4 font-semibold text-slate-700">
                {course.lessonCount === null ? '—' : `${course.lessonCount} bài học`}
              </TableCell>
              <TableCell className="px-4 py-4 font-bold text-slate-800">
                {formatCoursePrice(course.price)}
              </TableCell>
              <TableCell className="px-4 py-4">
                <CourseStatusBadge published={course.published} />
              </TableCell>
              <TableCell className="px-4 py-4 text-right">
                <div className="flex justify-end">
                  <CourseActions course={course} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
