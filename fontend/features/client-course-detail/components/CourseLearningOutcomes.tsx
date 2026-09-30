import { CircleCheckBig } from 'lucide-react';

export function CourseLearningOutcomes({
  outcomes,
}: {
  outcomes: ReadonlyArray<{ id: string; label: string }>;
}) {
  return (
    <section className="shadow-soft rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800 sm:text-xl">
        <CircleCheckBig className="h-5 w-5 text-brand-blue" aria-hidden="true" />
        Bạn sẽ học được gì trong khóa học này
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {outcomes.map((outcome) => (
          <li key={outcome.id} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
              <CircleCheckBig className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="text-sm leading-snug text-slate-700">{outcome.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
