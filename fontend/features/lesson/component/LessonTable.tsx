import { Trash2 } from 'lucide-react';
import type { Lesson } from '@/apis/lessons/lessons.type';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { IsLoading } from '@/components/common/loading/IsLoading';
import { CourseStatusBadge } from '@/features/course/component/CourseStatusBadge';

export function LessonTable({
  lessons,
  offset,
  loading,
  busy,
  error,
  onRetry,
  onDelete,
}: {
  lessons: Lesson[];
  offset: number;
  loading: boolean;
  busy: boolean;
  error: string | null;
  onRetry: () => void;
  onDelete: (lesson: Lesson) => void;
}) {
  return (
    <Table aria-label="Danh sách bài học" className="text-xs">
      <TableHeader>
        <TableRow className="text-slate-500">
          {['#', 'Tên bài học', 'Thời lượng', 'Trạng thái', 'Thao tác'].map((title) => (
            <TableHead key={title} className="px-4 text-xs font-semibold">
              {title}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody aria-busy={busy}>
        {loading ? (
          <TableRow>
            <TableCell colSpan={5}>
              <IsLoading className="py-12" />
            </TableCell>
          </TableRow>
        ) : error ? (
          <TableRow>
            <TableCell colSpan={5} className="py-12 text-center whitespace-normal">
              <p role="alert" className="mb-3 text-rose-600">
                {error}
              </p>
              <Button variant="outline" onClick={onRetry}>
                Thử lại
              </Button>
            </TableCell>
          </TableRow>
        ) : !lessons.length ? (
          <TableRow>
            <TableCell colSpan={5} className="py-12 text-center whitespace-normal text-slate-500">
              Chưa có bài học phù hợp. Hãy tạo bài học hoặc đặt lại tìm kiếm.
            </TableCell>
          </TableRow>
        ) : (
          lessons.map((lesson, index) => (
            <TableRow key={lesson.id} className="border-slate-100 hover:bg-slate-50/80">
              <TableCell className="px-4 py-4 text-slate-400">{offset + index + 1}</TableCell>
              <TableCell className="min-w-48 px-4 py-4 whitespace-normal font-bold text-slate-900">
                {lesson.title}
              </TableCell>
              <TableCell className="px-4 py-4">
                {lesson.durationMinutes === null ? '—' : `${lesson.durationMinutes} phút`}
              </TableCell>
              <TableCell className="px-4 py-4">
                <CourseStatusBadge published={lesson.isPublished} />
              </TableCell>
              <TableCell className="px-4 py-4">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={busy}
                  onClick={() => onDelete(lesson)}
                  aria-label={`Xóa ${lesson.title}`}
                  className="rounded-xl border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
