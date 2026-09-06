import ScoreCard from './ScoreCard';

interface SpeakingResultProps {
  result: any;
  onBackToTopics: () => void;
}

export default function SpeakingResult({ result, onBackToTopics }: SpeakingResultProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-[#1E293B]">Kết quả hội thoại</h2>

        <p className="mt-2 text-sm text-[#64748B]">Điểm của bạn trong cuộc hội thoại này</p>
      </div>

      {/* Overall Score */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-blue-50">
          <p className="text-4xl font-bold text-[#2F80ED]">{Math.round(result.overall ?? 0)}</p>

          <p className="text-sm text-slate-400">/ 100</p>
        </div>

        <p className="mt-3 text-sm font-medium text-[#64748B]">Điểm tổng</p>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 gap-5">
        <ScoreCard title="Phát Âm" score={result.pronunciation} />

        <ScoreCard title="Ngữ Pháp" score={result.grammar} />

        <ScoreCard title="Từ Vựng" score={result.vocabulary} />

        <ScoreCard title="Mức Độ Đúng Trọng Tâm" score={result.relevance} />
      </div>

      {/* Back Button */}
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onBackToTopics}
          className="
            rounded-xl
            bg-[#2F80ED]
            px-6
            py-3
            text-sm
            font-medium
            text-white
            transition
            hover:bg-[#2B4C7E]
          "
        >
          ← Quay lại
        </button>
      </div>
    </div>
  );
}
