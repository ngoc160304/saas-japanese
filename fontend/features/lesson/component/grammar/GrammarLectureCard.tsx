import { Clapperboard, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GrammarLectureVideo } from '../../types/grammar';

export function GrammarLectureCard({ video }: { video: GrammarLectureVideo }) {
  return (
    <section
      aria-labelledby="lecture-video-heading"
      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs md:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3
          id="lecture-video-heading"
          className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-800 uppercase"
        >
          <Play className="size-3.5 fill-rose-600 text-rose-600" aria-hidden="true" />
          Lecture Video
        </h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            disabled
            aria-describedby="lecture-video-unavailable"
            variant="ghost"
            size="sm"
            className="px-0 text-xs font-bold text-sky-600 hover:bg-transparent hover:text-sky-700"
          >
            Replace Video
          </Button>
          <span className="text-slate-300" aria-hidden="true">
            •
          </span>
          <Button
            type="button"
            disabled
            aria-describedby="lecture-video-unavailable"
            variant="ghost"
            size="sm"
            className="px-0 text-xs font-bold text-rose-600 hover:bg-transparent hover:text-rose-700"
          >
            Detach
          </Button>
        </div>
      </div>
      <div className="flex min-w-0 flex-col justify-between gap-4 rounded-xl bg-slate-900 p-4 text-white md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Clapperboard className="size-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold break-words text-white">
              {video.fileName} ({video.duration})
            </p>
            <p className="mt-0.5 text-[11px] break-all text-slate-400">{video.url}</p>
          </div>
        </div>
        <span className="self-start rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 md:shrink-0 md:self-center">
          Ready
        </span>
      </div>
      <p id="lecture-video-unavailable" className="mt-2 text-[11px] text-slate-500">
        Replacing and detaching video are unavailable in this preview.
      </p>
    </section>
  );
}
