import Link from 'next/link';
import { StorefrontLogo } from './StorefrontLogo';

const levels = ['N1', 'N2', 'N3', 'N4', 'N5'] as const;

export function StorefrontFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900 py-12 text-slate-400">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4"><StorefrontLogo inverted /></div>
            <p className="text-xs leading-relaxed">Nền tảng giáo dục đồng hành cùng bạn trên con đường chinh phục tiếng Nhật.</p>
          </div>
          <div>
            <h2 className="mb-4 text-sm font-bold text-white">Khóa học</h2>
            <ul className="space-y-2 text-xs">
              {levels.map((level) => <li key={level}><Link href={`/#level-${level.toLowerCase()}`} className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">JLPT {level}</Link></li>)}
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-sm font-bold text-white">Tài nguyên</h2>
            <ul className="space-y-2 text-xs">
              <li><Link href="/#mock-exam" className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">Thi thử JLPT</Link></li>
              <li>Blog học tập</li>
              <li>Từ điển Grammar</li>
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-sm font-bold text-white">Công ty</h2>
            <ul className="space-y-2 text-xs">
              <li><Link href="/#about" className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">Về chúng tôi</Link></li>
              <li>Liên hệ</li>
              <li>Điều khoản</li>
              <li>Bảo mật</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 text-center text-xs">© 2026 StudyJLPT. All rights reserved.</div>
      </div>
    </footer>
  );
}
