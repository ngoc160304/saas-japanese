import type { SessionResult } from '@/apis/speaking/speaking.type';
import { Button } from '@/components/ui/button';
import ScoreCard from './ScoreCard';

export default function SpeakingResult({
  result,
  onBackToTopics,
  onRetry,
}: {
  result: SessionResult | null;
  onBackToTopics: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-2 text-center text-2xl font-semibold text-slate-900">Kết quả hội thoại</h2>
      {!result && (
        <p className="mb-4 text-center text-sm text-slate-500">
          Chưa có đánh giá từ dịch vụ. Bạn có thể thử lấy lại.
        </p>
      )}
      <div className="mb-5">
        <ScoreCard title="Điểm tổng" score={result?.overall} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ScoreCard title="Phát âm" score={result?.pronunciation} />
        <ScoreCard title="Ngữ pháp" score={result?.grammar} />
        <ScoreCard title="Từ vựng" score={result?.vocabulary} />
        <ScoreCard title="Mức độ đúng trọng tâm" score={result?.relevance} />
      </div>
      {Boolean(result?.utterances.length) && (
        <section className="mt-5 space-y-3" aria-label="Đánh giá từng câu">
          <h3 className="font-semibold">Đánh giá từng câu</h3>
          {result?.utterances.map((utterance, index) => (
            <div key={index} className="rounded-xl border border-slate-200 p-3 text-sm">
              <p className="break-words">{utterance.sentence}</p>
              <ScoreCard title="Điểm phát âm" score={utterance.score} />
              {utterance.error && <p className="text-rose-700">Chưa thể đánh giá câu này.</p>}
            </div>
          ))}
        </section>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={onBackToTopics}>
          Quay lại chủ đề
        </Button>
        {!result && <Button onClick={onRetry}>Thử lấy đánh giá lại</Button>}
      </div>
    </div>
  );
}
