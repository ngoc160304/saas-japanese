import Link from 'next/link';

export function ResultBreadcrumbs({ title }: { title: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-400">
      <Link href="/student/jlpt-exams" className="rounded hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">JLPT Exams</Link>
      <span aria-hidden="true">/</span>
      <span className="min-w-0 break-words">{title}</span>
      <span aria-hidden="true">/</span>
      <span aria-current="page" className="text-slate-600">Kết quả đánh giá</span>
    </nav>
  );
}
