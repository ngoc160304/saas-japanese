import Link from 'next/link';
import type { JlptAttemptHistoryEntry } from '@/apis/jlpt-exams/jlpt-exams.type';
import { formatDuration, formatFinishedAt, formatPercent } from '../../result/result-view';

export function HistoryAttemptRow({ attempt }: { attempt: JlptAttemptHistoryEntry }) {
  const completed = attempt.status === 'COMPLETED';
  const statusText = attempt.status === 'ABANDONED' ? 'Đã bỏ dở' : !completed ? 'Đang làm' : attempt.isPassed === null || attempt.isPassed === undefined ? 'Chưa đánh giá đạt' : attempt.isPassed ? 'Đã đạt' : 'Chưa đạt';
  const resultHref = `/student/jlpt_exam_result/${attempt.attemptId}`;
  const reviewHref = `/student/jlpt_exam_review/${attempt.attemptId}`;

  return (
    <article className="grid min-w-0 gap-3 border-t border-slate-100 px-4 py-4 text-xs md:grid-cols-[minmax(0,2fr)_5rem_minmax(0,1fr)_minmax(0,1fr)_7rem_auto] md:items-center md:gap-4 md:px-5">
      <div className="min-w-0">
        <h3 className="break-words text-sm font-bold text-slate-900">{attempt.examTitle}</h3>
        <p className="mt-1 text-slate-500">Lượt #{attempt.attemptId} · {attempt.mode === 'full' ? 'Toàn bộ đề' : attempt.sessionName ?? 'Luyện tập theo phần'}</p>
      </div>
      <span className="w-fit rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-1 font-extrabold text-sky-700">{attempt.jlptLevel}</span>
      <p className="text-slate-500">{formatFinishedAt(completed && attempt.finishedAt ? attempt.finishedAt : attempt.startedAt)} <span className="block text-[10px]">giờ Việt Nam</span></p>
      <p className="text-slate-700">{completed ? <><strong>{attempt.totalScore} / {attempt.maxScore}</strong><span className="block text-slate-500">{formatPercent(attempt.correctCount, attempt.totalQuestions)} chính xác{attempt.durationSeconds !== null ? ` · ${formatDuration(attempt.durationSeconds)}` : ''}</span></> : 'Chưa có điểm'}</p>
      <span className={`w-fit rounded-full border px-2.5 py-1 font-bold ${!completed ? 'border-amber-200 bg-amber-50 text-amber-800' : attempt.isPassed === null || attempt.isPassed === undefined ? 'border-slate-200 bg-slate-50 text-slate-700' : attempt.isPassed ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{statusText}</span>
      <div className="flex flex-wrap gap-2 md:justify-end">
        {completed ? <>
          <Link href={resultHref} className="inline-flex min-h-9 items-center rounded-xl bg-slate-900 px-3 py-1.5 font-bold text-white hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">Kết quả</Link>
          <Link href={reviewHref} className="inline-flex min-h-9 items-center rounded-xl border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">Đáp án</Link>
        </> : <span className="text-slate-500">Kết quả có sau khi nộp bài</span>}
      </div>
    </article>
  );
}
