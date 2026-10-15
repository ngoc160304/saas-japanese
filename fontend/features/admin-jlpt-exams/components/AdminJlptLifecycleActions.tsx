'use client';

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AdminJlptExamSummary } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';
import { adminJlptExamKeys } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.keys';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getAdminJlptError } from '../admin-jlpt-error';
import {
  adminJlptCanTransition,
  adminJlptLifecycleLabels,
  type AdminJlptLifecycleAction,
} from '../admin-jlpt-policy';
import {
  adminJlptWriteFilter,
  invalidateAdminJlptExam,
  useAdminJlptExamDetail,
  useAdminJlptExamValidation,
  useAdminJlptExamWriting,
  usePublishAdminJlptExam,
  useUnpublishAdminJlptExam,
  useArchiveAdminJlptExam,
} from '../hooks/useAdminJlptExams';
import { AdminJlptLoading, AdminJlptQueryError } from './AdminJlptState';
import { AdminJlptStatus } from './AdminJlptStatus';
import { AdminJlptValidationIssues, AdminJlptValidationPanel } from './AdminJlptValidationPanel';

export function AdminJlptLifecycleActions({
  exam,
  disabled = false,
  onAction,
}: {
  exam: AdminJlptExamSummary;
  disabled?: boolean;
  onAction?: (action: AdminJlptLifecycleAction) => void;
}) {
  const [action, setAction] = useState<AdminJlptLifecycleAction | null>(null);
  const writing = useAdminJlptExamWriting(exam.id);
  return (
    <>
      <div className="flex flex-wrap gap-2" role="group" aria-label={`Trạng thái đề ${exam.title}`}>
        {(['publish', 'unpublish', 'archive'] as const)
          .filter((item) => adminJlptCanTransition(exam, item))
          .map((item) => (
            <Button
              key={item}
              variant="outline"
              disabled={disabled || writing}
              onClick={() => {
                if (!disabled && !writing && adminJlptCanTransition(exam, item)) {
                  if (onAction) onAction(item);
                  else setAction(item);
                }
              }}
            >
              {adminJlptLifecycleLabels[item]}
            </Button>
          ))}
      </div>
      {action && (
        <AdminJlptLifecycleDialog
          examId={exam.id}
          action={action}
          onClose={() => setAction(null)}
        />
      )}
    </>
  );
}

export function AdminJlptLifecycleDialog({
  examId,
  action,
  onClose,
}: {
  examId: number;
  action: AdminJlptLifecycleAction;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const detail = useAdminJlptExamDetail(examId, true);
  const validation = useAdminJlptExamValidation(examId, action === 'publish');
  const publish = usePublishAdminJlptExam();
  const unpublish = useUnpublishAdminJlptExam();
  const archive = useArchiveAdminJlptExam();
  const writing = useAdminJlptExamWriting(examId);
  const gate = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ReturnType<typeof getAdminJlptError> | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [reconciled, setReconciled] = useState(false);
  const exam = detail.data;
  const denied = error?.status === 401 || error?.status === 403;
  const readiness =
    action !== 'publish' ||
    (validation.isSuccess &&
      !validation.isStale &&
      !validation.isFetching &&
      validation.data.canPublish);
  const blocked =
    pending ||
    writing ||
    uncertain ||
    denied ||
    !exam ||
    !detail.isSuccess ||
    !detail.isFetchedAfterMount ||
    detail.isFetching ||
    !adminJlptCanTransition(exam, action) ||
    !readiness;
  const checkStatus = async () => {
    setReconciled(false);
    const result = await detail.refetch();
    if (result.isSuccess) setReconciled(true);
  };
  const run = async () => {
    if (gate.current || blocked || client.isMutating(adminJlptWriteFilter(examId))) return;
    const state = client.getQueryState(adminJlptExamKeys.detail(examId));
    if (state?.isInvalidated || state?.status !== 'success' || state.fetchStatus !== 'idle') return;
    if (
      action === 'publish' &&
      client.getQueryState(adminJlptExamKeys.validation(examId))?.isInvalidated
    )
      return;
    gate.current = true;
    setPending(true);
    setError(null);
    try {
      if (action === 'publish') await publish.mutateAsync({ examId });
      else if (action === 'unpublish') await unpublish.mutateAsync({ examId });
      else await archive.mutateAsync({ examId });
      toast.success(
        action === 'publish'
          ? 'Đã xuất bản đề thi.'
          : action === 'unpublish'
            ? 'Đã hủy xuất bản đề thi.'
            : 'Đã lưu trữ đề thi; lịch sử được giữ lại.',
      );
      onClose();
    } catch (cause) {
      const parsed = getAdminJlptError(cause);
      setError(parsed);
      const ambiguous = parsed.status === null || parsed.status >= 500;
      setUncertain(ambiguous);
      // The shared mutation already reconciles these definite rejections.
      if (![400, 404, 409].includes(parsed.status ?? 0))
        await invalidateAdminJlptExam(client, examId);
      if (ambiguous) {
        const refreshed = client.getQueryState(adminJlptExamKeys.detail(examId));
        setReconciled(
          refreshed?.status === 'success' &&
            refreshed.fetchStatus === 'idle' &&
            !refreshed.isInvalidated,
        );
      }
    } finally {
      gate.current = false;
      setPending(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !gate.current) onClose();
      }}
    >
      <DialogContent
        showCloseButton={!pending}
        className="rounded-3xl bg-white p-6 text-slate-900 sm:max-w-2xl"
      >
        <DialogTitle className="pr-6">{adminJlptLifecycleLabels[action]} đề thi</DialogTitle>
        <DialogDescription className="text-slate-600">
          {action === 'publish'
            ? 'Xuất bản dữ liệu đã lưu để học viên có thể bắt đầu làm bài. Máy chủ kiểm tra lại toàn bộ nội dung trong giao dịch xuất bản.'
            : action === 'unpublish'
              ? 'Đề thi ngừng nhận lượt làm mới. Lượt làm hiện có và lịch sử được giữ lại. Nếu đã có lượt làm, nội dung vẫn khóa sau khi hủy xuất bản.'
              : 'Ẩn đề thi khỏi học viên và danh sách đang hoạt động. Đây là lưu trữ, không xóa vĩnh viễn: lịch sử và chi tiết chỉ đọc được giữ lại. Không có thao tác khôi phục.'}
        </DialogDescription>
        {detail.isError ? (
          <AdminJlptQueryError error={detail.error} onRetry={() => void detail.refetch()} />
        ) : !exam || !detail.isFetchedAfterMount ? (
          <AdminJlptLoading />
        ) : (
          <>
            <p className="break-words font-semibold [overflow-wrap:anywhere]">
              {exam.title} · #{exam.id}
            </p>
            <AdminJlptStatus status={exam.status} />
            {exam.hasAttempts && (
              <p className="text-sm text-amber-900">
                Đề đã có lượt làm: vẫn có thể chuyển trạng thái, nhưng nội dung không được sửa.
              </p>
            )}
            {!adminJlptCanTransition(exam, action) && (
              <p role="status" className="text-sm text-amber-900">
                Trạng thái hiện tại không còn phù hợp với thao tác này. Đóng hộp thoại để kiểm tra
                đề.
              </p>
            )}
            {action === 'publish' && (
              <AdminJlptValidationPanel
                exam={exam}
                query={validation}
                disabled={pending || writing}
                onNavigate={onClose}
              />
            )}
          </>
        )}
        {error && (
          <div
            role="alert"
            className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
          >
            <p>{error.message}</p>
            {error.issues.length > 0 && exam && (
              <>
                <p>
                  Máy chủ từ chối xuất bản với các vấn đề sau. Kết quả kiểm tra trước không còn đủ
                  để xác nhận.
                </p>
                <AdminJlptValidationIssues exam={exam} issues={error.issues} onNavigate={onClose} />
              </>
            )}
            {denied && (
              <p>
                Bạn cần đăng nhập với quyền quản trị. Đóng hộp thoại và tải lại trang để xác minh
                quyền.
              </p>
            )}
            {uncertain && (
              <>
                <p>
                  Chưa xác nhận được kết quả yêu cầu. Không tự gửi lại; trạng thái có thể đã được
                  cập nhật. Kiểm tra dữ liệu mới nhất trước khi quyết định.
                </p>
                <Button
                  variant="outline"
                  disabled={pending || detail.isFetching}
                  onClick={() => void checkStatus()}
                >
                  Kiểm tra trạng thái
                </Button>
                {reconciled && exam && (
                  <>
                    <p>
                      Trạng thái vừa tải: <strong>{exam.status}</strong>. Yêu cầu cũ có thể vẫn đang
                      hoàn tất.
                    </p>
                    <Button
                      variant="outline"
                      disabled={pending}
                      onClick={() => {
                        setUncertain(false);
                        setError(null);
                      }}
                    >
                      Đã đối chiếu, quay lại thao tác
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="outline" disabled={pending} onClick={onClose}>
            Đóng
          </Button>
          <Button
            variant={action === 'archive' ? 'destructive' : 'default'}
            disabled={blocked}
            onClick={() => void run()}
          >
            {pending
              ? 'Đang cập nhật…'
              : `Xác nhận ${adminJlptLifecycleLabels[action].toLowerCase()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
