import type { Course } from '@/apis/courses/courses.type';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CourseActions } from './CourseActions';
import { CourseStatusBadge } from './CourseStatusBadge';
import { CourseThumbnail } from './CourseThumbnail';
import { formatCourseDate, formatCoursePrice } from '../utils/course-format';

export function CourseTable({ courses }: { courses: Course[] }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-100">
      <Table aria-label="Danh sách khóa học">
        <TableHeader className="bg-slate-50">
          <TableRow>
            {['Khóa học', 'Danh mục', 'Bài học', 'Giá', 'Ngày tạo', 'Trạng thái', 'Thao tác'].map(
              (label) => (
                <TableHead key={label} className="px-4 text-xs font-semibold text-slate-500">
                  {label}
                </TableHead>
              ),
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id} className="border-slate-100 hover:bg-slate-50/70">
              <TableCell className="px-4 py-3.5">
                <div className="flex min-w-52 max-w-72 items-center gap-3">
                  <CourseThumbnail src={course.thumnailURL} title={course.title} />
                  <span className="line-clamp-2 whitespace-normal font-semibold text-slate-900">
                    {course.title}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-4">{course.categoryName || 'Chưa phân loại'}</TableCell>
              <TableCell className="px-4">{course.lessonCount ?? '—'}</TableCell>
              <TableCell className="px-4 font-semibold">
                {formatCoursePrice(course.price)}
              </TableCell>
              <TableCell className="px-4 text-slate-500">
                {formatCourseDate(course.createdAt)}
              </TableCell>
              <TableCell className="px-4">
                <CourseStatusBadge published={course.published} />
              </TableCell>
              <TableCell className="px-4">
                <CourseActions course={course} manage />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
