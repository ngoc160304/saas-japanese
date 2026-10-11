import { Clapperboard, Play } from 'lucide-react';

export function GrammarLectureCard({
  videoUrl,
  videoMediaId,
}: {
  videoUrl: string | null;
  videoMediaId: number | null;
}) {
  return (
    <section
      aria-labelledby="lecture-video-heading"
      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs md:p-5"
    >
      <h3
        id="lecture-video-heading"
        className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-slate-800 uppercase"
      >
        <Play className="size-3.5 fill-rose-600 text-rose-600" aria-hidden="true" />
        Lecture Video
      </h3>
      {videoUrl ? (
        <div className="flex min-w-0 items-center gap-3 rounded-xl bg-primary p-4 text-white">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Clapperboard className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold">
              Video bài học{videoMediaId === null ? '' : ` #${videoMediaId}`}
            </p>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block break-all text-xs text-sky-100 underline hover:text-white"
            >
              Mở video
            </a>
          </div>
        </div>
      ) : (
        <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
          Chưa có video
        </p>
      )}
    </section>
  );
}
