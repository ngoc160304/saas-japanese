type Testimonial = {
  quote: string;
  name: string;
  detail: string;
  initial: string;
};

const testimonials: Testimonial[] = [
  {
    quote: 'Giao diện gọn gàng, nội dung đi thẳng vào trọng tâm. Mình học N3 trên này và pass với điểm số rất tốt, đặc biệt là phần đọc hiểu.',
    name: 'Minh Anh',
    detail: 'Đã đậu N3 - T12/2025',
    initial: 'M',
  },
  {
    quote: 'Chức năng thi thử rất giống với form đề thật. Canh được thời gian giúp mình không bị hoảng khi đi thi chính thức.',
    name: 'Trần Tuấn',
    detail: 'Đã đậu N2 - T07/2025',
    initial: 'T',
  },
  {
    quote: 'Khoá N5 miễn phí siêu chất lượng. Các giải thích ngữ pháp tiếng Việt rất dễ hiểu cho người mới bắt đầu như mình.',
    name: 'Lan Phương',
    detail: 'Đang học N4',
    initial: 'L',
  },
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6">
      <blockquote className="mb-6 flex-1 text-sm leading-relaxed italic text-slate-600">&ldquo;{testimonial.quote}&rdquo;</blockquote>
      <figcaption className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-500" aria-hidden="true">{testimonial.initial}</span>
        <span>
          <span className="block text-sm font-bold text-slate-800">{testimonial.name}</span>
          <span className="block text-[10px] text-slate-500">{testimonial.detail}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export function TestimonialsSection() {
  return (
    <section aria-labelledby="testimonials-title" className="bg-bg-light py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 id="testimonials-title" className="mb-12 text-center text-2xl font-bold text-slate-800">Học viên nói gì về chúng tôi</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div key={testimonial.name} className={index === 2 ? 'hidden lg:block' : ''}>
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
