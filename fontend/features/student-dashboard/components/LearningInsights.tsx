import Link from 'next/link';
import { Clock, Flame, Mic } from 'lucide-react';
import { Card } from '@/components/ui/card';

const cardClass = 'shadow-soft gap-0 rounded-3xl border-slate-100 bg-white p-5 md:p-6';

export function LearningInsights() {
  return (
    <section
      aria-label="Learning insights"
      className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-5"
    >
      <Card className={cardClass}>
        <h2 className="text-base font-bold text-slate-900">Learning Activity</h2>
        <div className="my-4 flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-500">
          <Clock className="size-6" aria-hidden="true" />
          <p className="text-xs">Chưa có dữ liệu thời lượng học.</p>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          Hệ thống chưa ghi nhận lịch sử thời gian học để vẽ biểu đồ.
        </p>
      </Card>
      <Card className={`${cardClass} flex flex-col justify-between text-center`}>
        <div>
          <h2 className="text-base font-bold text-slate-900">Focus Mode &amp; Daily Practice</h2>
          <p className="my-4 text-xs leading-relaxed text-slate-500">
            Chưa có dữ liệu phiên tập trung hoặc mục tiêu hằng ngày.
          </p>
          <Link
            href="/student/speaking"
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-xs font-bold text-white focus-visible:outline-2 focus-visible:outline-sky-500"
          >
            <Mic className="size-4" aria-hidden="true" />
            Luyện Speaking
          </Link>
        </div>
        <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
          Số phiên hôm nay: Chưa có dữ liệu
        </p>
      </Card>
      <Card className={cardClass}>
        <h2 className="text-base font-bold text-slate-900">Learning Streak</h2>
        <div className="my-4 flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl bg-amber-50 text-amber-700">
          <Flame className="size-7" aria-hidden="true" />
          <p className="text-xs font-semibold">Chưa có dữ liệu chuỗi ngày học.</p>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          Chưa có nhật ký học theo ngày để tính chuỗi hiện tại và chuỗi tốt nhất.
        </p>
      </Card>
    </section>
  );
}
