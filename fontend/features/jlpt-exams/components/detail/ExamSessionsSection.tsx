export function ExamSessionsSection() {
  return (
    <section aria-labelledby="sessions-title">
      <div className="mb-4 pb-1">
        <h2 id="sessions-title" className="text-base font-bold text-slate-900 md:text-lg">
          Practice Individual Sessions (Luyện tập theo từng Session)
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">Session details are not included in this exam overview.</p>
      </div>
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 text-center shadow-sm md:p-8">
        <p className="text-sm font-bold text-slate-800">Session data not available</p>
        <p className="mt-1 text-xs text-slate-500">Individual session practice is unavailable until session details are provided.</p>
        <button type="button" disabled className="mt-4 rounded-2xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white opacity-50">
          Practice unavailable
        </button>
      </div>
    </section>
  );
}
