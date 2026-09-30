import Link from 'next/link';

export function CoursesCta() {
  return (
    <section
      className="mx-auto max-w-4xl px-4 pb-10 sm:px-6 lg:px-8"
      aria-labelledby="courses-cta-title"
    >
      <div className="shadow-soft relative overflow-hidden rounded-2xl bg-brand-navy p-8 text-center text-white sm:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/5 blur-3xl"
        />
        <div className="relative z-10">
          <h2 id="courses-cta-title" className="mb-3 text-xl font-bold sm:text-2xl">
            Chưa biết mình đang ở trình độ nào?
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-sm leading-relaxed text-slate-300">
            Làm bài test đánh giá năng lực hoàn toàn miễn phí của chúng tôi để chọn được khóa học
            phù hợp nhất với bạn.
          </p>
          <Link
            href="/#mock-exam"
            className="inline-block rounded-lg bg-brand-blue px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            Thi thử xác định trình độ
          </Link>
        </div>
      </div>
    </section>
  );
}
