import { ChartNoAxesCombined, Layers3, Zap } from 'lucide-react';

const benefits = [
  {
    title: 'Lộ trình học rõ ràng',
    description: 'Không còn mông lung khi bắt đầu. Mỗi cấp độ được chia thành các bài học nhỏ, giúp bạn dễ dàng tiếp thu mỗi ngày.',
    icon: Zap,
  },
  {
    title: 'Nội dung có hệ thống',
    description: 'Tích hợp đầy đủ Từ vựng, Kanji, Ngữ pháp và các Quiz luyện tập ngắn sau mỗi bài, tối ưu hóa việc ghi nhớ.',
    icon: Layers3,
  },
  {
    title: 'Theo dõi tiến độ',
    description: 'Dashboard trực quan hiển thị chi tiết phần trăm hoàn thành khóa học, giúp bạn duy trì động lực học tập.',
    icon: ChartNoAxesCombined,
  },
] as const;

const progress = [
  { label: 'Từ vựng', value: '80%', width: 'w-[80%]', color: 'bg-brand-blue' },
  { label: 'Kanji', value: '45%', width: 'w-[45%]', color: 'bg-amber-400' },
  { label: 'Ngữ pháp', value: '60%', width: 'w-[60%]', color: 'bg-emerald-500' },
] as const;

export function BenefitsSection() {
  return (
    <section id="about" aria-labelledby="benefits-title" className="scroll-mt-20 bg-bg-light py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 md:grid-cols-2">
          <div>
            <h2 id="benefits-title" className="mb-8 text-2xl font-bold text-slate-800">Tại sao chọn StudyJLPT?</h2>
            <div className="space-y-6">
              {benefits.map(({ title, description, icon: Icon }) => (
                <div key={title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-brand-blue shadow-sm"><Icon className="h-5 w-5" aria-hidden="true" /></div>
                  <div>
                    <h3 className="mb-1 text-sm font-bold text-slate-800">{title}</h3>
                    <p className="text-xs leading-relaxed text-slate-500">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div aria-hidden="true" className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-sm font-bold text-slate-800">Tiến độ học tập</span>
              <span className="text-xs font-medium text-brand-blue">65% Hoàn thành</span>
            </div>
            <div className="space-y-4">
              {progress.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-xs"><span className="text-slate-600">{item.label}</span><span className="font-medium">{item.value}</span></div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.width} ${item.color}`} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
