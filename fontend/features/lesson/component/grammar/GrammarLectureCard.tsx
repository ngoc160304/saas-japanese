'use client';

import { useState } from 'react';
import { LoaderCircle, Play, RotateCw } from 'lucide-react';
import type { MediaResponse } from '@/apis/upload/upload.type';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface LessonVideoControls {
  file: File | null;
  uploaded: MediaResponse | null;
  phase: 'idle' | 'uploading' | 'attaching' | 'detaching';
  progress: number | null;
  error: string | null;
  isBusy: boolean;
  selectFile: (file: File | null) => void;
  discardPrepared: () => void;
  uploadAndAttach: () => Promise<void>;
  detach: () => Promise<void>;
}

export function GrammarLectureCard({
  videoUrl, videoMediaId, controls, disabled, onReload,
}: {
  videoUrl: string | null;
  videoMediaId: number | null;
  controls: LessonVideoControls;
  disabled: boolean;
  onReload: () => void;
}) {
  const [detachOpen, setDetachOpen] = useState(false);
  const [playbackErrorUrl, setPlaybackErrorUrl] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const playbackError = videoUrl !== null && playbackErrorUrl === videoUrl;

  return (
    <section aria-labelledby="lecture-video-heading" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs md:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 id="lecture-video-heading" className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-800 uppercase">
          <Play className="size-3.5 fill-rose-600 text-rose-600" aria-hidden="true" />
          Lecture Video
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="lesson-video-file" className={`cursor-pointer text-xs font-bold text-sky-700 hover:text-sky-800 focus-within:outline-2 focus-within:outline-sky-500 ${disabled || controls.isBusy || controls.uploaded ? 'pointer-events-none opacity-50' : ''}`}>
            {videoMediaId === null ? 'Tải video lên' : 'Thay video'}
            <input id="lesson-video-file" type="file" accept="video/mp4,video/webm,video/quicktime,.mov"
              className="sr-only" disabled={disabled || controls.isBusy || Boolean(controls.uploaded)}
              onChange={(event) => {
                controls.selectFile(event.currentTarget.files?.[0] ?? null);
                event.currentTarget.value = '';
              }} />
          </label>
          {videoMediaId !== null && (
            <Button type="button" variant="ghost" disabled={disabled || controls.isBusy || Boolean(controls.file) || Boolean(controls.uploaded)} onClick={() => setDetachOpen(true)} className="h-auto p-0 text-xs font-bold text-rose-700 hover:text-rose-800">
              Gỡ video
            </Button>
          )}
        </div>
      </div>

      {videoMediaId === null ? (
        <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-600">Chưa có video</p>
      ) : videoUrl ? (
        <div className="space-y-2">
          <video key={`${videoUrl}-${reloadCount}`} controls preload="metadata" playsInline
            aria-label="Xem trước video bài học" className="aspect-video w-full rounded-xl bg-slate-950"
            onError={() => setPlaybackErrorUrl(videoUrl)} onLoadedData={() => setPlaybackErrorUrl(null)}>
            <source src={videoUrl} />
            Trình duyệt không hỗ trợ phát video.
          </video>
          {playbackError && (
            <div role="alert" className="flex flex-wrap items-center gap-3 text-xs text-rose-700">
              <span>Không thể phát video hiện tại.</span>
              <Button type="button" variant="outline" onClick={() => { setPlaybackErrorUrl(null); setReloadCount((count) => count + 1); onReload(); }} className="h-8 text-xs">
                <RotateCw className="size-3.5" aria-hidden="true" /> Tải lại video
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Video đã gắn nhưng chưa có đường dẫn phát. <Button type="button" variant="outline" onClick={onReload} className="ml-2 h-8 text-xs">Tải lại</Button>
        </div>
      )}

      {(controls.file || controls.uploaded) && (
        <div className="mt-4 space-y-3 rounded-xl border border-sky-100 bg-sky-50 p-4 text-xs text-slate-700">
          <p className="break-all font-semibold">{controls.file?.name ?? controls.uploaded?.originalName ?? 'Video đã tải lên'}</p>
          {controls.uploaded && <p>Đã tải lên nhưng chưa gắn vào bài học. Có thể thử gắn lại mà không tải lại tệp. Bỏ video này sẽ không xóa tệp đã tải.</p>}
          {controls.phase === 'uploading' && <p role="status">Đang tải video lên{controls.progress === null ? '…' : `: ${controls.progress}%`}</p>}
          {controls.phase === 'attaching' && <p role="status">Đang gắn video vào bài học…</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={disabled || controls.isBusy} onClick={() => void controls.uploadAndAttach()} className="h-9 bg-primary text-xs font-bold text-white hover:bg-primary/90">
              {controls.isBusy && <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />}
              {controls.uploaded ? 'Gắn video vào bài học' : 'Tải lên và gắn video'}
            </Button>
            <Button type="button" variant="outline" disabled={controls.isBusy} onClick={controls.discardPrepared} className="h-9 text-xs">{controls.uploaded ? 'Bỏ video vừa tải' : 'Bỏ lựa chọn'}</Button>
          </div>
        </div>
      )}
      {controls.phase === 'detaching' && <p role="status" className="mt-3 text-xs text-slate-600">Đang gỡ video…</p>}
      {controls.error && <p role="alert" className="mt-3 text-xs text-rose-700">{controls.error}</p>}

      <AlertDialog open={detachOpen} onOpenChange={setDetachOpen}>
        <AlertDialogContent className="rounded-3xl bg-white text-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Gỡ video khỏi bài học?</AlertDialogTitle>
            <AlertDialogDescription>Video sẽ được gỡ khỏi bài học này. Tệp trên dịch vụ lưu trữ sẽ không bị xóa.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row flex-wrap justify-end">
            <AlertDialogCancel disabled={controls.isBusy}>Ở lại</AlertDialogCancel>
            <AlertDialogAction disabled={controls.isBusy} onClick={() => { setDetachOpen(false); void controls.detach(); }} className="bg-rose-700 text-white hover:bg-rose-800">Gỡ video</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
