'use client';

import Link from 'next/link';
import type {
  AdminJlptExamDetail,
  AdminJlptValidationIssue,
} from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';
import { Button } from '@/components/ui/button';
import { getAdminJlptError } from '../admin-jlpt-error';
import { adminJlptIssueDestination } from '../admin-jlpt-validation';
import { useAdminJlptExamValidation } from '../hooks/useAdminJlptExams';

export function AdminJlptValidationIssues({
  exam,
  issues,
  onNavigate,
  disabled = false,
}: {
  exam: AdminJlptExamDetail;
  issues: AdminJlptValidationIssue[];
  onNavigate?: () => void;
  disabled?: boolean;
}) {
  return (
    <ol className="space-y-3" aria-label="Các vấn đề cần xử lý">
      {issues.map((issue, index) => {
        const target = adminJlptIssueDestination(exam, issue);
        return (
          <li
            key={`${issue.code}:${issue.path}:${index}`}
            className="min-w-0 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
          >
            <p className="break-words font-medium [overflow-wrap:anywhere]">
              {index + 1}. {issue.message}
            </p>
            <p className="break-all text-xs text-slate-600">
              {issue.path} · {issue.category === 'CONTENT' ? 'Nội dung' : 'Trạng thái'}
            </p>
            <Link
              href={target.href}
              aria-disabled={disabled}
              tabIndex={disabled ? -1 : undefined}
              onNavigate={(event) => {
                if (disabled) {
                  event.preventDefault();
                  return;
                }
                onNavigate?.();
                const destination = new URL(target.href, window.location.origin);
                if (
                  destination.pathname === window.location.pathname &&
                  destination.search === window.location.search
                ) {
                  event.preventDefault();
                  if (window.location.hash === destination.hash)
                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                  else window.location.hash = destination.hash;
                }
              }}
              className="block break-words font-semibold text-primary underline [overflow-wrap:anywhere]"
            >
              Đến {target.label}
            </Link>
            {target.missing && (
              <p className="text-xs">
                Tài nguyên đã thay đổi hoặc không còn tồn tại. Mở mục cha gần nhất để kiểm tra.
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function AdminJlptValidationPanel({
  exam,
  query,
  disabled = false,
  onNavigate,
}: {
  exam: AdminJlptExamDetail;
  query: ReturnType<typeof useAdminJlptExamValidation>;
  disabled?: boolean;
  onNavigate?: () => void;
}) {
  const current = query.isSuccess && !query.isStale && !query.isFetching;
  return (
    <section
      aria-label="Kiểm tra sẵn sàng xuất bản"
      className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 md:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-900">Sẵn sàng xuất bản</h2>
        <Button
          variant="outline"
          disabled={disabled || query.isFetching}
          onClick={() => void query.refetch()}
        >
          {query.isFetching ? 'Đang kiểm tra…' : 'Kiểm tra độ sẵn sàng'}
        </Button>
      </div>
      <p className="text-xs text-slate-600">
        Chỉ kiểm tra dữ liệu đã lưu trên máy chủ. Thay đổi chưa lưu trong biểu mẫu không nằm trong
        kết quả này.
      </p>
      {query.isFetching ? (
        <p role="status" className="text-sm text-slate-600">
          Đang kiểm tra toàn bộ cấu trúc và media…
        </p>
      ) : query.isError ? (
        <p role="alert" className="text-sm text-rose-800">
          {getAdminJlptError(query.error).message} Chưa xác nhận độ sẵn sàng. Dùng nút kiểm tra để
          thử lại.
        </p>
      ) : !query.data ? (
        <p className="text-sm text-slate-600">Chưa kiểm tra đề thi.</p>
      ) : !current ? (
        <p role="status" className="text-sm text-amber-900">
          Kết quả trước đã cũ. Kiểm tra lại sau thay đổi; chưa thể dùng kết quả này để xuất bản.
        </p>
      ) : (
        <p
          role="status"
          className={`rounded-xl p-3 text-sm ${query.data.canPublish ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-950'}`}
        >
          {query.data.canPublish
            ? 'Dữ liệu đã lưu đủ điều kiện xuất bản tại lần kiểm tra này. Máy chủ vẫn kiểm tra lại khi xuất bản.'
            : `Chưa thể xuất bản. Có ${query.data.issues.length} vấn đề cần kiểm tra.`}
        </p>
      )}
      {current && query.data && (
        <AdminJlptValidationIssues
          exam={exam}
          issues={query.data.issues}
          onNavigate={onNavigate}
          disabled={disabled}
        />
      )}
    </section>
  );
}
