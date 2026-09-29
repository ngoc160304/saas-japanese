import Link from 'next/link';

export function FinalCtaSection() {
  return (
    <section aria-labelledby="final-cta-title" className="bg-white py-20 text-center">
      <div className="mx-auto max-w-3xl px-4">
        <h2 id="final-cta-title" className="mb-4 text-3xl font-extrabold text-slate-800">Sẵn sàng để bắt đầu?</h2>
        <p className="mb-8 text-sm text-slate-500">Tạo tài khoản miễn phí và trải nghiệm ngay nền tảng học tiếng Nhật chuyên nghiệp.</p>
        <Link href="/register" className="inline-block rounded-lg bg-brand-blue px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Đăng ký ngay bây giờ</Link>
      </div>
    </section>
  );
}
