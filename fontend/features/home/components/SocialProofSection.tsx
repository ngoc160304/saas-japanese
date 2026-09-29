const metrics = [
  { value: '15,000+', label: 'Học viên' },
  { value: '2,000+', label: 'Bài học' },
  { value: '50+', label: 'Đề thi JLPT' },
  { value: '4.9/5', label: 'Đánh giá trung bình' },
] as const;

export function SocialProofSection() {
  return (
    <section aria-label="StudyJLPT qua những con số" className="border-b border-slate-100 bg-white py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex flex-col-reverse border-l border-slate-100 first:border-l-0">
              <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{metric.label}</dt>
              <dd className="mb-1 text-3xl font-extrabold text-brand-navy">{metric.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
