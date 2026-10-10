export function ExamInstructionCard({ label, instructions }: { label: string; instructions: [string, string] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-2 font-bold text-slate-800">{label}</h3>
      <p className="leading-relaxed text-slate-600">{instructions[0]}<br />{instructions[1]}</p>
    </div>
  );
}
