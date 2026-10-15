'use client';

import { useId } from 'react';
import { Button } from '@/components/ui/button';
import {
  ADMIN_JLPT_AUDIO_ACCEPT,
  ADMIN_JLPT_IMAGE_ACCEPT,
} from '@/apis/admin-jlpt-exams/admin-jlpt-media';
import type { AdminJlptAttachment, AdminJlptMediaUpload } from '../hooks/useAdminJlptMediaUpload';
import { AdminJlptMediaPreview } from './AdminJlptMediaPreview';

export function AdminJlptMediaControl({
  kind,
  persisted,
  selection,
  upload,
  disabled,
  fieldError,
}: {
  kind: 'image' | 'audio';
  persisted: AdminJlptAttachment | null;
  selection?: number | null;
  upload: AdminJlptMediaUpload;
  disabled: boolean;
  fieldError?: string;
}) {
  const id = useId();
  const label = kind === 'image' ? 'Ảnh câu hỏi' : 'Audio phần thi';
  const candidate = upload.candidate;
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4"
    >
      <h3 id={`${id}-title`} className="text-sm font-semibold text-slate-900">
        {label}
      </h3>
      {persisted ? (
        <div className="space-y-2">
          <p className="break-words text-xs text-slate-700 [overflow-wrap:anywhere]">
            {kind === 'image' ? 'Ảnh hiện có' : 'Audio hiện có'}: {persisted.originalName} (#
            {persisted.id}). Đang được lưu.
          </p>
          <AdminJlptMediaPreview
            kind={kind}
            url={persisted.secureUrl}
            name={persisted.originalName}
          />
        </div>
      ) : (
        <p className="text-xs text-slate-600">Chưa gắn {kind === 'image' ? 'ảnh' : 'audio'}.</p>
      )}
      {selection === null && (
        <p role="status" className="text-sm text-amber-900">
          Đã chọn tháo liên kết khi lưu. Tệp trên máy chủ không bị xóa.
        </p>
      )}
      {selection !== undefined && selection !== null && upload.staged && (
        <div className="space-y-2 rounded-xl border border-sky-200 bg-sky-50 p-3">
          <p role="status" className="break-words text-sm text-sky-900 [overflow-wrap:anywhere]">
            Đã tải lên: {upload.staged.originalName} (#{selection}). Chưa lưu liên kết; dùng nút lưu
            của biểu mẫu.
          </p>
          {!candidate && (
            <AdminJlptMediaPreview
              kind={kind}
              url={upload.staged.secureUrl}
              name={upload.staged.originalName}
            />
          )}
        </div>
      )}
      <div className="space-y-2">
        <label htmlFor={`${id}-file`} className="block text-sm font-medium text-slate-700">
          Chọn {kind === 'image' ? 'ảnh' : 'audio'} mới
        </label>
        <input
          id={`${id}-file`}
          type="file"
          accept={kind === 'image' ? ADMIN_JLPT_IMAGE_ACCEPT : ADMIN_JLPT_AUDIO_ACCEPT}
          disabled={disabled}
          aria-describedby={`${id}-help ${id}-error`}
          aria-invalid={Boolean(upload.error || fieldError)}
          className="block w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50 p-2 text-xs text-slate-900 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-200 file:px-2 file:py-1 file:text-slate-900 focus-visible:outline-2 focus-visible:outline-primary"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) upload.select(file);
            event.currentTarget.value = '';
          }}
        />
        <p id={`${id}-help`} className="text-xs text-slate-600">
          {kind === 'image'
            ? '.jpeg, .png, .webp, .gif; tối đa 10 MiB. .jpg chưa được hỗ trợ.'
            : '.mp3 (audio/mpeg), .wav (audio/wav, audio/x-wav, audio/wave); tối đa 20 MiB.'}{' '}
          Chọn tệp, tải lên, sau đó lưu biểu mẫu để gắn.
        </p>
      </div>
      {candidate && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="break-words text-xs font-medium text-slate-700 [overflow-wrap:anywhere]">
            Tệp đang chọn: {candidate.file.name}
          </p>
          <AdminJlptMediaPreview kind={kind} url={candidate.url} name={candidate.file.name} local />
          {candidate.status === 'uploading' ? (
            <div className="space-y-2" role="status">
              <p className="text-xs text-slate-700">
                {candidate.progress === null
                  ? 'Đang tải lên… Chưa xác định được tiến độ.'
                  : candidate.progress === 100
                    ? 'Đã gửi tệp, đang chờ máy chủ xử lý…'
                    : `Đang tải lên ${candidate.progress}%…`}
              </p>
              <progress
                aria-label={`Tiến độ ${label}`}
                max={100}
                value={candidate.progress ?? undefined}
                className="w-full"
              />
              <Button type="button" variant="outline" onClick={upload.cancel}>
                Hủy tải lên
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {candidate.status !== 'uploaded' && (
                <Button type="button" disabled={disabled} onClick={() => void upload.upload()}>
                  {candidate.status === 'selected' ? 'Tải tệp lên' : 'Thử tải lên lại'}
                </Button>
              )}
              {candidate.status !== 'uploaded' && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  onClick={upload.discardFile}
                >
                  Bỏ tệp đang chọn
                </Button>
              )}
            </div>
          )}
          {candidate.status === 'canceled' && (
            <p role="status" className="text-xs text-slate-700">
              Đã hủy chờ tải lên. Tệp có thể đã tới máy chủ; chưa lưu liên kết.
            </p>
          )}
          {upload.unresolved && (
            <p className="text-xs text-amber-900">
              Hoàn tất tải lên hoặc bỏ tệp đang chọn trước khi lưu biểu mẫu.
            </p>
          )}
        </div>
      )}
      <div
        id={`${id}-error`}
        role={upload.error || fieldError ? 'alert' : undefined}
        className="space-y-1 text-sm text-rose-700"
      >
        {upload.error && <p>{upload.error}</p>}
        {fieldError && <p>{fieldError}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {(persisted || selection !== undefined || candidate) && (
          <Button type="button" variant="outline" disabled={disabled} onClick={upload.remove}>
            Tháo {kind === 'image' ? 'ảnh' : 'audio'} khi lưu
          </Button>
        )}
        {(selection !== undefined || candidate) && (
          <Button type="button" variant="outline" disabled={disabled} onClick={upload.revert}>
            Hoàn tác thay đổi media
          </Button>
        )}
      </div>
    </section>
  );
}
