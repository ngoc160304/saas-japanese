'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { AdminJlptExamDetail } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { getApiError } from '@/lib/api-error';
import {
  adminJlptLevels,
  adminJlptMetadataLock,
  adminJlptMetadataPayload,
  adminJlptMetadataSchema,
  type AdminJlptMetadataValues,
} from '../admin-jlpt-metadata';
import { getAdminJlptError } from '../admin-jlpt-error';
import {
  useAdminJlptExamDetail,
  useCreateAdminJlptExam,
  useUpdateAdminJlptExam,
} from '../hooks/useAdminJlptExams';

export type AdminJlptMetadataTarget = { mode: 'create' } | { mode: 'edit'; examId: number };
interface Props {
  target: AdminJlptMetadataTarget;
  onClose: () => void;
}
const inputClass =
  'h-11 rounded-2xl border-input bg-slate-50 text-slate-900 placeholder:text-slate-500 focus-visible:ring-primary';

export function AdminJlptMetadataDialog({ target, onClose }: Props) {
  if (target.mode === 'create') return <MetadataFormDialog onClose={onClose} />;
  return <EditMetadataDialog examId={target.examId} onClose={onClose} />;
}

function EditMetadataDialog({ examId, onClose }: { examId: number; onClose: () => void }) {
  const query = useAdminJlptExamDetail(examId, true);
  const [initial, setInitial] = useState<AdminJlptExamDetail | null>(null);
  if (!initial && query.isSuccess && query.isFetchedAfterMount) setInitial(query.data);
  // Keep the form mounted through refetch/conflicts. A newer snapshot changes
  // permissions without replacing the user's unsaved field values.
  if (initial)
    return (
      <MetadataFormDialog
        initial={initial}
        latest={query.data ?? initial}
        detailError={query.isError ? query.error : null}
        onReload={() => void query.refetch()}
        onClose={onClose}
      />
    );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="rounded-3xl bg-white p-6 text-slate-900 sm:max-w-lg">
        <DialogTitle>Sửa thông tin đề thi</DialogTitle>
        <DialogDescription>
          Đang lấy thông tin và quyền chỉnh sửa mới nhất từ máy chủ.
        </DialogDescription>
        {query.isError ? (
          <div role="alert" className="space-y-3">
            <p className="text-sm text-rose-700">
              {getApiError(query.error).status === 403
                ? 'Bạn không còn quyền quản lý đề thi JLPT.'
                : getApiError(query.error).message}
            </p>
            <Button
              variant="outline"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              Thử tải lại thông tin
            </Button>
          </div>
        ) : (
          <p role="status" className="text-sm text-slate-600">
            Đang tải thông tin đề thi…
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MetadataFormDialog({
  initial,
  latest,
  detailError,
  onReload,
  onClose,
}: {
  initial?: AdminJlptExamDetail;
  latest?: AdminJlptExamDetail;
  detailError?: unknown;
  onReload?: () => void;
  onClose: () => void;
}) {
  const form = useForm<AdminJlptMetadataValues>({
    resolver: zodResolver(adminJlptMetadataSchema),
    defaultValues: {
      title: initial?.title ?? '',
      level: initial?.level ?? 'N3',
      description: initial?.description ?? '',
    },
  });
  const create = useCreateAdminJlptExam();
  const update = useUpdateAdminJlptExam();
  const submitting = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [saveError, setSaveError] = useState<ReturnType<typeof getAdminJlptError> | null>(null);
  const pending = create.isPending || update.isPending || form.formState.isSubmitting;
  const dirty = form.formState.isDirty;
  const lock = latest ? adminJlptMetadataLock(latest) : null;
  const accessError =
    saveError?.status === 401 || saveError?.status === 403 || saveError?.status === 404;
  const blocked = Boolean(lock || detailError || accessError);
  const requestClose = () => {
    if (submitting.current || pending) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    void form.handleSubmit(async (values) => {
      if (submitting.current || pending || blocked) return;
      submitting.current = true;
      setSaveError(null);
      form.clearErrors();
      try {
        const data = adminJlptMetadataPayload(values);
        if (initial) await update.mutateAsync({ examId: initial.id, data });
        else await create.mutateAsync({ data });
        toast.success(initial ? 'Đã cập nhật thông tin đề thi.' : 'Đã tạo đề thi nháp.');
        form.reset(values);
        onClose();
      } catch (error) {
        const parsed = getAdminJlptError(error);
        setSaveError(parsed);
        let firstField: keyof AdminJlptMetadataValues | null = null;
        for (const field of ['title', 'level', 'description'] as const) {
          const message = parsed.fieldErrors[field];
          if (message) {
            form.setError(field, { type: 'server', message });
            firstField ??= field;
          }
        }
        const focusField = firstField;
        window.requestAnimationFrame(() => {
          if (focusField) form.setFocus(focusField);
          else errorRef.current?.focus();
        });
        if (
          parsed.status === 401 ||
          parsed.status === 403 ||
          parsed.status === 404 ||
          parsed.status === 409
        )
          onReload?.();
      } finally {
        submitting.current = false;
      }
    })(event);
  };
  const errors = form.formState.errors;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      <DialogContent
        showCloseButton={!pending}
        className="gap-5 rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl sm:max-w-lg"
      >
        <div className="space-y-2 border-b border-slate-100 pb-4 pr-6">
          <DialogTitle>{initial ? 'Sửa thông tin đề thi' : 'Thêm đề thi JLPT'}</DialogTitle>
          <DialogDescription className="text-slate-600">
            {initial
              ? 'Cập nhật tiêu đề, cấp độ và mô tả đề thi.'
              : 'Đề thi mới được tạo ở trạng thái bản nháp.'}
          </DialogDescription>
        </div>
        {lock && (
          <p
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
          >
            {lock} Nội dung bạn nhập vẫn được giữ lại.
          </p>
        )}
        {Boolean(detailError) && (
          <div role="alert" className="space-y-2 text-sm text-rose-700">
            <p>Chưa xác minh được quyền sửa. {getApiError(detailError).message}</p>
            <Button variant="outline" onClick={onReload}>
              Thử tải lại thông tin
            </Button>
          </div>
        )}
        <form onSubmit={submit} noValidate className="space-y-4" aria-busy={pending}>
          <div ref={errorRef} tabIndex={-1} aria-live="polite" className="outline-none">
            {saveError && (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
              >
                {saveError.status === 409
                  ? 'Đề thi đã thay đổi hoặc đang bị khóa. Đã yêu cầu tải lại trạng thái; nội dung bạn nhập vẫn được giữ. '
                  : saveError.status === 403
                    ? 'Bạn không còn quyền quản lý đề thi JLPT. '
                    : ''}
                {saveError.message}
              </p>
            )}
          </div>
          <fieldset disabled={pending} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="jlpt-title" className="text-sm font-semibold text-slate-700">
                Tiêu đề <span aria-hidden="true">*</span>
              </label>
              <Input
                id="jlpt-title"
                autoFocus
                maxLength={200}
                required
                readOnly={Boolean(lock) || accessError}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? 'jlpt-title-error' : undefined}
                {...form.register('title')}
                className={inputClass}
                placeholder="Ví dụ: Đề thi thử JLPT N3 số 01"
              />
              {errors.title && (
                <p id="jlpt-title-error" className="text-xs text-rose-700">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="jlpt-level" className="text-sm font-semibold text-slate-700">
                Cấp độ JLPT <span aria-hidden="true">*</span>
              </label>
              <select
                id="jlpt-level"
                required
                disabled={Boolean(lock) || accessError}
                {...form.register('level')}
                aria-invalid={Boolean(errors.level)}
                aria-describedby={errors.level ? 'jlpt-level-error' : undefined}
                className={`${inputClass} w-full border px-3 text-sm focus-visible:outline-2`}
              >
                {adminJlptLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              {errors.level && (
                <p id="jlpt-level-error" className="text-xs text-rose-700">
                  {errors.level.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="jlpt-description" className="text-sm font-semibold text-slate-700">
                Mô tả
              </label>
              <Textarea
                id="jlpt-description"
                readOnly={Boolean(lock) || accessError}
                rows={4}
                maxLength={500}
                {...form.register('description')}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? 'jlpt-description-error' : 'jlpt-description-help'
                }
                className="min-h-28 rounded-2xl border-input bg-slate-50 text-slate-900 placeholder:text-slate-500"
                placeholder="Mô tả nội dung và hướng dẫn tổng quan…"
              />
              <p id="jlpt-description-help" className="text-xs text-slate-600">
                Tối đa 500 ký tự. Thời lượng và điểm đỗ do hệ thống tính.
              </p>
              {errors.description && (
                <p id="jlpt-description-error" className="text-xs text-rose-700">
                  {errors.description.message}
                </p>
              )}
            </div>
          </fieldset>
          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" disabled={pending} onClick={requestClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={pending || blocked}>
              {pending ? 'Đang lưu…' : initial ? 'Lưu thay đổi' : 'Tạo đề thi'}
            </Button>
          </div>
        </form>
        <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
          <AlertDialogContent className="rounded-2xl bg-white text-slate-900">
            <AlertDialogTitle>Bỏ thay đổi chưa lưu?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Nội dung đang nhập sẽ bị mất nếu đóng biểu mẫu.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Tiếp tục chỉnh sửa</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={() => {
                  setConfirmDiscard(false);
                  onClose();
                }}
              >
                Bỏ thay đổi
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
