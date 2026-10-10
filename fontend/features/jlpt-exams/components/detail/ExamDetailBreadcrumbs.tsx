import Link from 'next/link';

export function ExamDetailBreadcrumbs({ title }: { title: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">
      <Link href="/student/dashboard" className="hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-sky-500">Student Portal</Link>
      <span aria-hidden="true">/</span>
      <Link href="/student/jlpt-exams" className="hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-sky-500">JLPT Exams</Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page" className="min-w-0 text-slate-600">{title}</span>
    </nav>
  );
}
