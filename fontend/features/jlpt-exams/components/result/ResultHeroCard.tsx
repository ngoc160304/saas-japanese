import type { JlptExamResult } from '../../result/types';
import { formatDuration, formatFinishedAt, formatPercent } from '../../result/result-view';

export function ResultHeroCard({ result }: { result: JlptExamResult }) {
  const passStatusUnavailable = result.isPassed === null || result.isPassed === undefined;
  const metrics = [
    { label: 'Tổng điểm', value: `${result.totalScore} / ${result.maxScore}`, detail: 'Điểm thô của đề luyện tập' },
    { label: 'Độ chính xác', value: formatPercent(result.correctCount, result.totalQuestions), detail: 'Theo số câu đúng' },
    { label: 'Câu trả lời đúng', value: `${result.correctCount} / ${result.totalQuestions}`, detail: 'Câu hỏi' },
    { label: 'Thời gian làm bài', value: formatDuration(result.durationSeconds), detail: 'Toàn bộ lượt làm bài' },
  ];

  return (
    <section aria-labelledby="result-title" className="mb-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_2px_14px_-2px_rgba(15,23,42,0.04)] md:p-8">
      <div className="flex flex-col justify-between gap-6 border-b border-slate-100 pb-6 md:flex-row md:items-center">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-lg bg-slate-900 px-2.5 py-0.5 text-xs font-extrabold text-white">{result.jlptLevel}</span>
            <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">{result.mode === 'full' ? 'Toàn bộ đề' : 'Luyện tập theo phần'}</span>
            <span className="text-xs font-medium text-slate-500">Hoàn thành: {formatFinishedAt(result.finishedAt)} (giờ Việt Nam, UTC+7)</span>
          </div>
          <h1 id="result-title" className="break-words text-xl font-black tracking-tight text-slate-900 md:text-2xl">{result.examTitle}</h1>
          <p className="text-xs font-medium text-slate-500">Kết quả đề luyện tập · Lượt làm bài #{result.attemptId}</p>
        </div>
        <div className={`flex shrink-0 items-center gap-3 self-start rounded-2xl border px-5 py-3 shadow-xs ${passStatusUnavailable ? 'border-slate-200 bg-slate-50 text-slate-700' : result.isPassed ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
          <span aria-hidden="true" className="text-xl">{passStatusUnavailable ? '—' : result.isPassed ? '✓' : '✕'}</span>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider">Trạng thái được cung cấp</span>
            <span className="text-sm font-extrabold">{passStatusUnavailable ? result.mode === 'session' ? 'Đã hoàn thành phần luyện tập' : 'Chưa đánh giá' : result.isPassed ? 'Đã đạt' : 'Chưa đạt'}</span>
          </div>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{metric.label}</dt>
            <dd className="mt-1 break-words text-lg font-extrabold text-slate-900 md:text-xl">{metric.value}</dd>
            <dd className="mt-0.5 text-[11px] text-slate-500">{metric.detail}</dd>
          </div>
        ))}
      </dl>
      {result.overallPassScore !== null && result.overallPassScore !== undefined && <p className="mt-4 text-xs leading-relaxed text-slate-500">Ngưỡng đạt toàn bài được cung cấp: <strong className="text-slate-700">{result.overallPassScore}</strong>. Ngưỡng cấu hình này chưa được quy đổi sang thang điểm thô 0–{result.maxScore} tại trang này.</p>}
    </section>
  );
}
