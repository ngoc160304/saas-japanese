import type { ReactNode } from 'react';

export default function SpeakingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-w-0 max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
          Hội thoại với AI
        </h1>
        <p className="mt-1 text-sm text-slate-500">Luyện nói tiếng Nhật theo chủ đề.</p>
      </header>
      <section
        aria-label="Luyện hội thoại"
        className="rounded-3xl border border-slate-100 bg-white p-4 shadow-soft md:p-6"
      >
        {children}
      </section>
    </div>
  );
}
