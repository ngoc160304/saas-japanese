import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-bg-light py-16 md:py-24" aria-labelledby="home-title">
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-12 px-4 sm:px-6 md:flex-row lg:px-8">
        <div className="text-center md:w-1/2 md:text-left">
          <h1 id="home-title" className="mb-6 text-4xl leading-[1.2] font-extrabold text-slate-800 md:text-5xl">
            Chinh phục tiếng Nhật.<br />
            Sẵn sàng cho kỳ thi <span className="text-brand-blue">JLPT</span>.
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-slate-500 md:mx-0 md:text-lg">
            Hệ thống học tập chuyên sâu với lộ trình cá nhân hóa từ N5 đến N1. Cung cấp bài giảng, bài tập ngữ pháp, Hán tự và các đề thi thử bám sát thực tế.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row md:justify-start">
            <Link href="#courses" className="w-full rounded-lg bg-brand-navy px-6 py-3.5 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 sm:w-auto">Khám phá khóa học</Link>
            <Link href="#mock-exam" className="w-full rounded-lg border border-slate-200 bg-white px-6 py-3.5 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 sm:w-auto">Thi thử miễn phí</Link>
          </div>
        </div>
        <div className="flex w-full justify-center md:w-1/2 md:justify-end" aria-hidden="true">
          <div className="shadow-soft relative flex aspect-[4/3] w-full max-w-md items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-2">
            <div className="relative flex h-full w-full flex-col rounded-xl border border-slate-100 bg-slate-50 p-6">
              <div className="mb-4 h-6 w-3/4 rounded bg-slate-200" />
              <div className="mb-2 h-2 w-full rounded bg-slate-200" />
              <div className="mb-8 h-2 w-5/6 rounded bg-slate-200" />
              <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-white text-xl font-bold tracking-widest text-slate-400">あ • い • う • え • お</div>
              <div className="absolute right-6 bottom-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue text-2xl font-bold text-white shadow-lg">N3</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
