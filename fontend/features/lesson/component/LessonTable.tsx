import Link from 'next/link';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { Lesson } from '@/apis/lessons/lessons.type';
import { IsLoading } from '@/components/common/loading/IsLoading';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
    <Table aria-label="Danh sách bài học" className="min-w-[720px] border-collapse text-xs">
      <TableHeader>
        <TableRow className="border-slate-100 text-[11px] font-extrabold tracking-wider text-slate-700 uppercase hover:bg-transparent">
          <TableHead className="w-14 px-3 text-center text-[11px] font-extrabold">#</TableHead>
          <TableHead className="px-4 text-[11px] font-extrabold">Tên bài học</TableHead>
          <TableHead className="w-32 px-4 text-center text-[11px] font-extrabold">
            Thời lượng
          </TableHead>
          <TableHead className="w-32 px-4 text-center text-[11px] font-extrabold">
            Trạng thái
          </TableHead>
          <TableHead className="w-24 px-4 text-right text-[11px] font-extrabold">
            Thao tác
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody aria-busy={busy} className="divide-y divide-slate-100/70">
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
            <TableCell colSpan={5} className="py-12 text-center font-medium whitespace-normal text-slate-700">
              Chưa có bài học phù hợp. Hãy tạo bài học hoặc đặt lại tìm kiếm.
            </TableCell>
          </TableRow>
        ) : (
          lessons.map((lesson, index) => (
            <TableRow key={lesson.id} className="border-slate-100 hover:bg-slate-50/80">
              <TableCell className="px-3 py-4 text-center font-mono font-bold text-slate-600">
                {offset + index + 1}
              </TableCell>
              <TableCell className="min-w-64 px-4 py-4 text-xs font-bold whitespace-normal text-slate-900 md:text-sm">
                {lesson.title}
              </TableCell>
              <TableCell className="px-4 py-4 text-center font-semibold text-slate-700">
                {lesson.durationMinutes === null ? '—' : `${lesson.durationMinutes} phút`}
              </TableCell>
              <TableCell className="px-4 py-4 text-center">
                <CourseStatusBadge published={lesson.isPublished} />
              </TableCell>
              <TableCell className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                  <Button
                    variant="outline"
                    size="icon"
                    nativeButton={false}
                    render={
                      <Link href={`/admin/courses/${lesson.courseId}/lessons/${lesson.id}`} />
                    }
                    title={`Xem ${lesson.title}`}
                    aria-label={`Xem ${lesson.title}`}
                    className="rounded-xl border-slate-300 bg-white text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                  >
                    <Eye className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    nativeButton={false}
                    render={
                      <Link href={`/admin/courses/${lesson.courseId}/lessons/${lesson.id}/edit`} />
                    }
                    title={`Sửa ${lesson.title}`}
                    aria-label={`Sửa ${lesson.title}`}
                    className="rounded-xl border-slate-300 bg-white text-slate-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={busy}
                    onClick={() => onDelete(lesson)}
                    aria-label={`Xóa ${lesson.title}`}
                    className="rounded-xl border-slate-300 bg-white text-slate-700 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
