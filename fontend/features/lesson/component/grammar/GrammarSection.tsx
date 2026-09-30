import type { GrammarLectureVideo, GrammarPoint } from '../../types/grammar';
import { GrammarLectureCard } from './GrammarLectureCard';
import { GrammarPointCard } from './GrammarPointCard';
import { GrammarPointDialog } from './GrammarPointDialog';

interface GrammarSectionProps {
  video: GrammarLectureVideo;
  points: readonly GrammarPoint[];
}

export function GrammarSection({ video, points }: GrammarSectionProps) {
  return (
    <section
      aria-labelledby="grammar-heading"
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft md:p-6"
    >
      <div className="mb-5 flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div>
          <h2
            id="grammar-heading"
            className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-base font-bold text-slate-900 md:text-lg"
          >
            Grammar &amp; Lecture Video
            <span className="text-xs font-normal text-slate-400">
              | Ngữ pháp &amp; Video bài giảng
            </span>
          </h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Video bài giảng lý thuyết và các mẫu ngữ pháp trọng điểm của bài học.
          </p>
        </div>
        <GrammarPointDialog variant="primary" />
      </div>
      <div className="space-y-6">
        <GrammarLectureCard video={video} />
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Grammar Points ({points.length})
            </h3>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Danh sách các mẫu ngữ pháp trọng tâm trong bài học
            </p>
          </div>
          <GrammarPointDialog />
        </div>
        <div className="space-y-4">
          {points.map((point, index) => (
            <GrammarPointCard key={point.id} point={point} index={index + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
