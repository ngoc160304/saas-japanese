import type { JlptResultScoringSection } from '../../result/types';
import { formatPercent } from '../../result/result-view';
import { ResultProgress } from './ResultProgress';

export function ResultScoringSections({ sections }: { sections: JlptResultScoringSection[] }) {
  return (
    <section aria-labelledby="scoring-sections-title" className="mb-6">
      <div className="mb-3">
        <h2 id="scoring-sections-title" className="text-base font-bold text-slate-900 md:text-lg">Nhóm chấm điểm</h2>
        <p className="mt-0.5 text-xs text-slate-500">Nhóm điểm được cung cấp riêng với các phần thi bên dưới.</p>
      </div>
      {sections.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Chưa có nhóm chấm điểm cho lượt làm bài này.</p> : (
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.name} className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_14px_-2px_rgba(15,23,42,0.04)]">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="min-w-0 break-words text-sm font-extrabold text-slate-900">{section.name}</h3>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${section.isPassed ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{section.isPassed ? 'Đã đạt' : 'Chưa đạt'}</span>
              </div>
              <p className="mt-3 text-xl font-extrabold text-slate-900">{section.score} / {section.maxScore} <span className="text-xs font-semibold text-slate-500">điểm thô</span></p>
              <p className="mb-2 mt-1 text-xs text-slate-600">{section.correctCount} / {section.totalQuestions} câu đúng · {formatPercent(section.correctCount, section.totalQuestions)}</p>
              <ResultProgress label={`${section.name}: ${section.score} trên ${section.maxScore} điểm thô`} value={section.score} total={section.maxScore} />
              <p className="mt-3 text-xs leading-relaxed text-slate-500">Ngưỡng đạt được cung cấp: <strong className="text-slate-700">{section.minimumPassScore}</strong> (cấu hình, chưa quy đổi sang thang điểm thô).</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
