import Link from 'next/link';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { Button } from '@/components/ui/button';
import { getApiError } from '@/lib/api-error';

export function AdminJlptLoading() {
  return (
    <p role="status" aria-busy="true" className="p-8 text-center text-sm text-slate-600">
      Đang tải dữ liệu đề thi JLPT…
    </p>
  );
}

export function AdminJlptNotFound() {
  return (
    <PageSection>
      <h1 className="text-xl font-semibold text-slate-900">Không tìm thấy đề thi</h1>
      <p className="text-sm text-slate-600">
        Đường dẫn không hợp lệ hoặc đề thi không còn tồn tại.
      </p>
      <Link className="text-sm font-semibold text-primary underline" href="/admin/exams">
        Về danh sách đề thi
      </Link>
    </PageSection>
  );
}

export function AdminJlptQueryError({
  error,
  onRetry,
  returnTo = '/admin/exams',
}: {
  error: unknown;
  onRetry: () => void;
  returnTo?: string;
}) {
  const { status, message } = getApiError(error);
  if (status === 404) return <AdminJlptNotFound />;
  return (
    <PageSection>
      <div role="alert" className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          {status === 403
            ? 'Không có quyền truy cập'
            : status === 401
              ? 'Phiên đăng nhập đã hết hạn'
              : 'Chưa thể tải dữ liệu đề thi'}
        </h2>
        <p className="text-sm text-slate-600">
          {status === 403 ? 'Chỉ tài khoản có quyền ADMIN mới được quản lý đề thi JLPT.' : message}
        </p>
        {status === 401 ? (
          <Link
            className="text-sm font-semibold text-primary underline"
            href={`/login?next=${encodeURIComponent(returnTo)}`}
          >
            Đăng nhập lại
          </Link>
        ) : status === 403 ? (
          <Link className="text-sm font-semibold text-primary underline" href="/student/dashboard">
            Về trang học viên
          </Link>
        ) : (
          <Button onClick={onRetry}>Thử lại</Button>
        )}
      </div>
    </PageSection>
  );
}
