import Link from 'next/link';
import { Clock, FileQuestion, LockKeyhole, Pencil, PanelsTopLeft } from 'lucide-react';
import type { AdminJlptExamSummary } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';
import { Button } from '@/components/ui/button';
import { adminJlptMetadataLock } from '../admin-jlpt-metadata';
import { AdminJlptStatus } from './AdminJlptStatus';
import { AdminJlptLifecycleActions } from './AdminJlptLifecycleActions';
import type { AdminJlptLifecycleAction } from '../admin-jlpt-policy';

export function AdminJlptExamGrid({
  exams,
  onEdit,
  onLifecycle,
}: {
  exams: AdminJlptExamSummary[];
  onEdit: (examId: number) => void;
  onLifecycle: (examId: number, action: AdminJlptLifecycleAction) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {exams.map((exam) => {
        const lock = adminJlptMetadataLock(exam);
        return (
          <article
            key={exam.id}
            aria-label={exam.title}
            className="flex min-w-0 flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-soft transition-shadow hover:border-sky-300 hover:shadow-md"
          >
            <div>
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-xs font-bold text-white">
                  {exam.level}
                </span>
                <h3 className="min-w-0 text-sm font-semibold leading-snug text-slate-900">
                  <Link
                    href={`/admin/exams/${exam.id}`}
                    className="line-clamp-2 break-words hover:text-primary focus-visible:outline-2"
                    title={exam.title}
                  >
                    {exam.title}
                  </Link>
                </h3>
              </div>
              <p className="mt-3.5 line-clamp-2 min-h-10 break-words text-xs leading-relaxed text-slate-600">
                {exam.description ?? 'Chưa có mô tả.'}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <FileQuestion className="size-3.5" aria-hidden="true" />
                  {exam.questionCount} câu hỏi
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {exam.totalTimeMinutes} phút
                </span>
                <span>
                  Điểm đỗ: <strong className="text-slate-900">{exam.passingScore}</strong>
                </span>
              </div>
            </div>
            <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <AdminJlptStatus status={exam.status} />
                <Button
                  variant="outline"
                  className="text-xs"
                  onClick={() => onEdit(exam.id)}
                  disabled={Boolean(lock)}
                  aria-label={`Sửa metadata: ${exam.title}`}
                  title={lock ?? 'Sửa tiêu đề, cấp độ và mô tả'}
                >
                  <Pencil aria-hidden="true" />
                  Sửa metadata
                </Button>
              </div>
              {lock && (
                <p className="flex gap-1.5 text-xs leading-relaxed text-slate-600">
                  <LockKeyhole className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  {lock}
                </p>
              )}
              <Link
                href={`/admin/exams/${exam.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-xs font-semibold text-white hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <PanelsTopLeft className="size-4" aria-hidden="true" />
                Mở Exam Builder<span className="sr-only">: {exam.title}</span>
              </Link>
              <AdminJlptLifecycleActions
                exam={exam}
                onAction={(action) => onLifecycle(exam.id, action)}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
