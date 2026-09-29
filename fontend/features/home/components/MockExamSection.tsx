import Link from 'next/link';
import { Check } from 'lucide-react';

const highlights = [
  'Cấu trúc đề chuẩn hóa theo từng năm.',
  'Phân tích chi tiết điểm yếu sau khi nộp bài.',
  'File audio nghe hiểu chất lượng cao.',
] as const;

export function MockExamSection() {
  return (
    <section id="mock-exam" aria-labelledby="mock-exam-title" className="scroll-mt-20 bg-slate-800 py-20 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-12 md:flex-row">
          <div className="md:w-1/2">
            <h2 id="mock-exam-title" className="mb-4 text-2xl font-bold">Mô phỏng kỳ thi JLPT thực tế</h2>
            <p className="mb-6 text-sm leading-relaxed text-slate-300">Khác với các bài quiz nhỏ trong khóa học, hệ thống thi thử của chúng tôi cung cấp bài thi toàn thời gian với cấu trúc chuẩn, giới hạn thời gian thực và tự động chấm điểm để bạn đánh giá chính xác năng lực trước kỳ thi thật.</p>
            <ul className="mb-8 space-y-3">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  {highlight}
                </li>
              ))}
            </ul>
            <Link href="/register" className="inline-block rounded-lg bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Bắt đầu thi thử ngay</Link>
          </div>
          <div className="w-full md:w-1/2" aria-hidden="true">
            <div className="rounded-2xl border border-slate-600 bg-slate-700 p-6 shadow-xl">
              <div className="mb-6 flex items-center justify-between border-b border-slate-600 pb-4">
                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-400">JLPT N3 Mock Exam</div>
                  <div className="text-sm font-bold text-white">Choukai (Nghe hiểu)</div>
                </div>
                <div className="text-right">
                  <div className="mb-1 text-xs text-slate-400">Thời gian còn lại</div>
                  <div className="font-mono text-sm font-bold text-amber-400">35:12</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-600 text-xs font-bold text-slate-300">1</div>
                  <div className="h-4 w-full rounded bg-slate-600" />
                </div>
                <div className="space-y-2 pl-10">
                  <div className="flex items-center gap-2 rounded border border-brand-blue bg-blue-900/30 p-2 text-xs text-white"><span className="h-3 w-3 rounded-full bg-brand-blue" />Đáp án 1</div>
                  <div className="flex items-center gap-2 rounded border border-slate-600 p-2 text-xs text-slate-400"><span className="h-3 w-3 rounded-full border border-slate-500" />Đáp án 2</div>
                  <div className="flex items-center gap-2 rounded border border-slate-600 p-2 text-xs text-slate-400"><span className="h-3 w-3 rounded-full border border-slate-500" />Đáp án 3</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
