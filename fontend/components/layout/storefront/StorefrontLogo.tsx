import Link from 'next/link';

export function StorefrontLogo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/" aria-label="StudyJLPT - Trang chủ" className="group inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">
      <span className={`flex items-center justify-center rounded bg-brand-navy text-white transition-transform group-hover:scale-105 ${inverted ? 'h-6 w-6' : 'h-8 w-8'}`}>
        <svg className={inverted ? 'h-4 w-4 fill-current' : 'h-5 w-5 fill-current'} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
        </svg>
      </span>
      <span className={`font-extrabold tracking-tight ${inverted ? 'text-lg text-white' : 'text-xl text-slate-800'}`}>
        Study<span className={inverted ? '' : 'text-brand-blue'}>JLPT</span>
      </span>
    </Link>
  );
}
