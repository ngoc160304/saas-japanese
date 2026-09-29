type JlptLevel = {
  code: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  title: string;
  description: string;
};

const levels: JlptLevel[] = [
  { code: 'N5', title: 'Sơ cấp 1', description: 'Nền tảng bảng chữ cái & ngữ pháp cơ bản.' },
  { code: 'N4', title: 'Sơ cấp 2', description: 'Giao tiếp thực tế và ngữ pháp nâng cao.' },
  { code: 'N3', title: 'Trung cấp', description: 'Mở rộng vốn từ và đọc hiểu văn bản dài.' },
  { code: 'N2', title: 'Tiền cao cấp', description: 'Ngữ pháp học thuật và nghe hiểu chuyên sâu.' },
  { code: 'N1', title: 'Cao cấp', description: 'Thành thạo như người bản xứ.' },
];

function LevelCard({ level }: { level: JlptLevel }) {
  return (
    <article id={`level-${level.code.toLowerCase()}`} className="group scroll-mt-24 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center transition-all hover:border-brand-blue hover:bg-white hover:shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-bold text-slate-700 transition-colors group-hover:border-brand-blue group-hover:bg-brand-blue group-hover:text-white">{level.code}</div>
      <h3 className="mb-1 text-sm font-semibold text-slate-800">{level.title}</h3>
      <p className="text-xs text-slate-500">{level.description}</p>
    </article>
  );
}

export function JlptLevelsSection() {
  return (
    <section id="levels" aria-labelledby="levels-title" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 id="levels-title" className="mb-3 text-2xl font-bold text-slate-800">Lộ trình học phù hợp mọi trình độ</h2>
          <p className="mx-auto max-w-2xl text-sm text-slate-500">Chương trình học được thiết kế phân cấp rõ ràng theo chuẩn JLPT, giúp bạn từng bước đạt mục tiêu.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {levels.map((level) => <LevelCard key={level.code} level={level} />)}
        </div>
      </div>
    </section>
  );
}
