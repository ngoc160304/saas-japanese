'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AdminJlptExamDetail } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getAdminJlptError } from '../admin-jlpt-error';
import {
  adminJlptContentLock,
  adminJlptSessionLabels,
  adminJlptStructureSchema,
  type AdminJlptEditorTarget,
  type AdminJlptStructureAction,
  type AdminJlptStructureValues,
} from '../admin-jlpt-structure';
import { useAdminJlptExamDetail } from '../hooks/useAdminJlptExams';
import { useAdminJlptMediaUpload } from '../hooks/useAdminJlptMediaUpload';
import { AdminJlptMediaControl } from './AdminJlptMediaControl';

interface Props {
  examId: number;
  target: AdminJlptEditorTarget;
  pending: boolean;
  run: (action: AdminJlptStructureAction) => Promise<void>;
  onClose: () => void;
}
const inputClass =
  'h-11 w-full rounded-2xl border border-input bg-slate-50 px-3 text-sm text-slate-900';

export function AdminJlptStructureDialog(props: Props) {
  const [launcher] = useState(() =>
    typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  const query = useAdminJlptExamDetail(props.examId, true);
  const [initial, setInitial] = useState<AdminJlptExamDetail | null>(null);
  if (!initial && query.isSuccess && query.isFetchedAfterMount) setInitial(query.data);
  if (initial)
    return (
      <StructureForm
        key={`${props.examId}:${props.target.kind}:${props.target.sessionId ?? 'new'}:${props.target.kind === 'part' ? (props.target.partId ?? 'new') : ''}`}
        {...props}
        initial={initial}
        latest={query.data ?? initial}
        detailError={query.isError ? query.error : null}
        refreshing={query.isFetching}
        onReload={() => void query.refetch()}
        launcher={launcher}
      />
    );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          props.onClose();
          window.requestAnimationFrame(() => launcher?.focus());
        }
      }}
    >
      <DialogContent
        finalFocus={false}
        className="rounded-3xl bg-white p-6 text-slate-900 sm:max-w-lg"
      >
        <DialogTitle>Chuẩn bị biểu mẫu</DialogTitle>
        <DialogDescription className="text-slate-600">
          Đang lấy cấu trúc và quyền chỉnh sửa mới nhất.
        </DialogDescription>
        {query.isError ? (
          <div role="alert" className="space-y-3 text-rose-800">
            <p>{getAdminJlptError(query.error).message}</p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Thử tải lại
            </Button>
          </div>
        ) : (
          <p role="status">Đang tải…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StructureForm({
  target,
  initial,
  latest,
  detailError,
  refreshing,
  onReload,
  launcher,
  pending,
  run,
  onClose,
}: Props & {
  initial: AdminJlptExamDetail;
  latest: AdminJlptExamDetail;
  detailError: unknown;
  refreshing: boolean;
  onReload: () => void;
  launcher: HTMLElement | null;
}) {
  const initialSession = initial.sessions.find((s) => s.id === target.sessionId);
  const initialPart =
    target.kind === 'part' ? initialSession?.parts.find((p) => p.id === target.partId) : undefined;
  const editing =
    target.kind === 'session' ? target.sessionId !== undefined : target.partId !== undefined;
  const session = latest.sessions.find((s) => s.id === target.sessionId);
  const part =
    target.kind === 'part' ? session?.parts.find((p) => p.id === target.partId) : undefined;
  const maximum =
    target.kind === 'session'
      ? latest.sessions.length + (editing ? 0 : 1)
      : (session?.parts.length ?? 0) + (editing ? 0 : 1);
  const form = useForm<AdminJlptStructureValues>({
    resolver: zodResolver(
      adminJlptStructureSchema.refine((v) => v.position <= maximum, {
        path: ['position'],
        message: `Vị trí tối đa hiện tại là ${maximum}.`,
      }),
    ),
    defaultValues:
      target.kind === 'session'
        ? {
            kind: 'session',
            name: initialSession?.name ?? '',
            sessionType: initialSession?.sessionType ?? 'language_knowledge',
            timeLimitMinutes: initialSession?.timeLimitMinutes ?? 30,
            position: initialSession ? initialSession.sortOrder + 1 : initial.sessions.length + 1,
          }
        : {
            kind: 'part',
            audioMediaId: undefined,
            name: initialPart?.name ?? '',
            instructions: initialPart?.instructions ?? '',
            position: initialPart
              ? initialPart.sortOrder + 1
              : (initialSession?.parts.length ?? 0) + 1,
          },
  });
  const audioSelection = useWatch({ control: form.control, name: 'audioMediaId' });
  if (target.kind === 'part') form.register('audioMediaId');
  const errors = form.formState.errors;
  const [discard, setDiscard] = useState(false);
  const [saveError, setSaveError] = useState<ReturnType<typeof getAdminJlptError> | null>(null);
  const submitting = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const lock = adminJlptContentLock(latest);
  const missing =
    (target.kind === 'part' && !session) ||
    (editing && (target.kind === 'session' ? !session : !part));
  const blocked = Boolean(
    lock || missing || detailError || refreshing || [401, 403].includes(saveError?.status ?? 0),
  );
  const busy = pending || form.formState.isSubmitting;
  const media = useAdminJlptMediaUpload({
    kind: 'audio',
    canEdit: () => target.kind === 'part' && !blocked && !busy && !submitting.current,
    onStage: (id) => {
      if (id === undefined) form.resetField('audioMediaId');
      else form.setValue('audioMediaId', id, { shouldDirty: true, shouldValidate: true });
    },
    onAccessError: onReload,
  });
  const dirty = form.formState.isDirty || media.dirty;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const requestClose = () => {
    if (busy || submitting.current) return;
    if (dirty) setDiscard(true);
    else onClose();
  };
  const fieldError = (field: Parameters<typeof form.getFieldState>[0]) => {
    const error = form.getFieldState(field, form.formState).error;
    return error ? (
      <p id={`structure-${field}-error`} className="text-xs text-rose-700">
        {error.message}
      </p>
    ) : null;
  };
  const fieldProps = (field: Parameters<typeof form.getFieldState>[0]) => ({
    id: `structure-${field}`,
    'aria-invalid': Boolean(form.getFieldState(field, form.formState).error),
    'aria-describedby': form.getFieldState(field, form.formState).error
      ? `structure-${field}-error`
      : undefined,
  });
  const title = `${editing ? 'Sửa' : 'Thêm'} ${target.kind === 'session' ? 'phiên thi' : 'phần thi'}`;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      <DialogContent
        finalFocus={() => launcher}
        showCloseButton={!busy}
        className="rounded-3xl bg-white p-6 text-slate-900 sm:max-w-lg"
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="whitespace-pre-wrap break-words text-slate-600">
          {target.kind === 'part'
            ? `Trong phiên thi: ${initialSession?.name ?? 'Không còn tồn tại'}. `
            : ''}
          Thay đổi được lưu ngay sau khi máy chủ chấp nhận.
        </DialogDescription>
        {(lock || missing || Boolean(detailError)) && (
          <p
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
          >
            {lock ??
              (missing
                ? 'Mục hoặc cha của mục này không còn tồn tại.'
                : 'Chưa xác minh được quyền sửa. Hãy tải lại dữ liệu.')}{' '}
            Nội dung đang nhập vẫn được giữ lại.
          </p>
        )}
        {Boolean(detailError) && (
          <Button variant="outline" disabled={busy || refreshing} onClick={onReload}>
            Tải lại trạng thái, giữ biểu mẫu
          </Button>
        )}
        <form
          noValidate
          aria-busy={busy}
          className="space-y-4"
          onSubmit={(event) =>
            void form.handleSubmit(async (values) => {
              if (blocked || busy || submitting.current || media.hasUnresolved()) return;
              submitting.current = true;
              setSaveError(null);
              form.clearErrors();
              try {
                if (values.kind === 'session' && target.kind === 'session')
                  await run({ kind: 'save-session', sessionId: target.sessionId, values });
                else if (values.kind === 'part' && target.kind === 'part')
                  await run({
                    kind: 'save-part',
                    sessionId: target.sessionId,
                    partId: target.partId,
                    values,
                  });
                form.reset(values);
                media.reset();
                onClose();
              } catch (cause) {
                const parsed = getAdminJlptError(cause);
                setSaveError(parsed);
                const fields = [
                  'name',
                  'position',
                  'sessionType',
                  'timeLimitMinutes',
                  'instructions',
                  'audioMediaId',
                ] as const;
                let first: (typeof fields)[number] | undefined;
                for (const field of fields) {
                  const message = parsed.fieldErrors[field === 'position' ? 'sortOrder' : field];
                  if (message) {
                    form.setError(field, { type: 'server', message });
                    first ??= field;
                  }
                }
                const focus = first;
                window.requestAnimationFrame(() => {
                  if (focus && focus !== 'audioMediaId') form.setFocus(focus);
                  else errorRef.current?.focus();
                });
              } finally {
                submitting.current = false;
              }
            })(event)
          }
        >
          <div ref={errorRef} tabIndex={-1} className="outline-none" aria-live="polite">
            {saveError && (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
              >
                {saveError.status === 409
                  ? 'Máy chủ từ chối vì xung đột hoặc khóa nội dung. Đã yêu cầu tải lại trạng thái. '
                  : ''}
                {saveError.message} Nội dung đang nhập vẫn được giữ lại.
                {form.getValues('audioMediaId') !== undefined &&
                  (saveError.status !== null && saveError.status < 500
                    ? ' Liên kết audio chưa được lưu qua yêu cầu này. Tệp đã tải lên được giữ để kiểm tra và thử lưu lại.'
                    : ' Chưa xác nhận được thay đổi liên kết audio. Không cần tải lại tệp để thử lưu lại.')}
              </p>
            )}
          </div>
          <fieldset disabled={busy || blocked} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="structure-name" className="text-sm font-semibold">
                Tên {target.kind === 'session' ? 'phiên thi' : 'phần thi'} *
              </label>
              <Input
                autoFocus
                maxLength={150}
                required
                className={inputClass}
                {...fieldProps('name')}
                {...form.register('name')}
              />
              {fieldError('name')}
            </div>
            {target.kind === 'session' ? (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="structure-sessionType" className="text-sm font-semibold">
                    Loại phiên thi *
                  </label>
                  <select
                    required
                    className={inputClass}
                    {...fieldProps('sessionType')}
                    {...form.register('sessionType')}
                  >
                    {Object.entries(adminJlptSessionLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {fieldError('sessionType')}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="structure-timeLimitMinutes" className="text-sm font-semibold">
                    Thời lượng (phút) *
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={180}
                    step={1}
                    required
                    className={inputClass}
                    {...fieldProps('timeLimitMinutes')}
                    {...form.register('timeLimitMinutes', { valueAsNumber: true })}
                  />
                  {fieldError('timeLimitMinutes')}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="structure-instructions" className="text-sm font-semibold">
                    Hướng dẫn
                  </label>
                  <Textarea
                    rows={5}
                    maxLength={10000}
                    className="min-h-28 rounded-2xl bg-slate-50 text-slate-900"
                    {...fieldProps('instructions')}
                    {...form.register('instructions')}
                  />
                  {fieldError('instructions')}
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <label htmlFor="structure-position" className="text-sm font-semibold">
                Vị trí hiển thị *
              </label>
              <Input
                type="number"
                min={1}
                max={maximum}
                step={1}
                required
                className={inputClass}
                {...fieldProps('position')}
                {...form.register('position', { valueAsNumber: true })}
              />
              <p className="text-xs text-slate-600">
                Từ 1 đến {maximum}, trong cùng {target.kind === 'session' ? 'đề thi' : 'phiên thi'}.
                Các mục khác sẽ dịch vị trí.
              </p>
              {fieldError('position')}
            </div>
          </fieldset>
          {target.kind === 'part' && (
            <AdminJlptMediaControl
              kind="audio"
              persisted={part?.audio ?? null}
              selection={audioSelection}
              upload={media}
              disabled={busy || blocked}
              fieldError={form.getFieldState('audioMediaId', form.formState).error?.message}
            />
          )}
          {Object.keys(errors).length > 0 && (
            <p className="sr-only" role="status">
              Kiểm tra các trường có lỗi.
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" disabled={busy} onClick={requestClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={busy || blocked || media.unresolved}>
              {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
        <AlertDialog open={discard} onOpenChange={setDiscard}>
          <AlertDialogContent className="rounded-2xl bg-white text-slate-900">
            <AlertDialogTitle>Bỏ thay đổi chưa lưu?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Nội dung đang nhập sẽ bị mất nếu đóng biểu mẫu.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Tiếp tục chỉnh sửa</AlertDialogCancel>
              <Button variant="destructive" onClick={onClose}>
                Bỏ thay đổi
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
