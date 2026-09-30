import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function CoursesHero() {
  return (
    <section className="border-b border-slate-200 bg-white pt-8 pb-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 flex text-sm text-slate-500">
          <ol className="flex items-center gap-2">
            <li>
              <Link
                href="/"
                className="rounded transition-colors hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                Trang chủ
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </li>
            <li className="font-semibold text-slate-800" aria-current="page">
              Khóa học
            </li>
          </ol>
        </nav>
        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-800 md:text-4xl">
          Khám phá khóa học JLPT
        </h1>
        <p className="max-w-2xl text-sm text-slate-500 md:text-base">
          Lựa chọn khóa học phù hợp với trình độ hiện tại của bạn. Chúng tôi cung cấp các chương
          trình đào tạo từ cơ bản đến nâng cao.
        </p>
      </div>
    </section>
  );
}
