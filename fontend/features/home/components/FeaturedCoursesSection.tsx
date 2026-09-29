import Link from 'next/link';

type FeaturedCourse = {
  level: 'N3' | 'N2' | 'N5';
  title: string;
  description: string;
  lessonCount: number;
  price: string;
  isFree?: boolean;
};

const courses: FeaturedCourse[] = [
  {
    level: 'N3',
    title: 'Tiếng Nhật Trung Cấp N3 Toàn Diện',
    description: 'Chương trình chuẩn hóa kiến thức ngữ pháp, đọc hiểu và luyện nghe chuẩn bị cho kỳ thi N3.',
    lessonCount: 55,
    price: '499.000 đ',
  },
  {
    level: 'N2',
    title: 'Luyện Thi Tiền Cao Cấp N2',
    description: 'Khóa học tập trung phân tích cấu trúc phức tạp, từ vựng nâng cao và kỹ năng làm bài.',
    lessonCount: 45,
    price: '699.000 đ',
  },
  {
    level: 'N5',
    title: 'Sơ Cấp N5 Dành Cho Người Mới Bắt Đầu',
    description: 'Khóa học nền tảng miễn phí giúp bạn làm quen với tiếng Nhật từ con số 0.',
    lessonCount: 25,
    price: 'Miễn phí',
    isFree: true,
  },
];

function CourseCard({ course }: { course: FeaturedCourse }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)]">
      <div className="relative flex h-40 items-center justify-center border-b border-slate-100 bg-slate-100" aria-hidden="true">
        <span className="absolute top-3 left-3 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700">{course.level}</span>
        <span className="text-4xl font-black tracking-widest text-slate-300">{course.level}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 line-clamp-2 text-sm font-bold text-slate-800">{course.title}</h3>
        <p className="mb-4 line-clamp-2 flex-1 text-xs text-slate-500">{course.description}</p>
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-500">{course.lessonCount} Bài học</span>
          <span className={`text-sm font-bold ${course.isFree ? 'text-emerald-600' : 'text-slate-800'}`}>{course.price}</span>
        </div>
        <Link href="/register" className="mt-4 block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue" aria-label={`Đăng ký để xem chi tiết ${course.title}`}>Xem chi tiết</Link>
      </div>
    </article>
  );
}

export function FeaturedCoursesSection() {
  return (
    <section id="courses" aria-labelledby="courses-title" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 id="courses-title" className="mb-2 text-2xl font-bold text-slate-800">Khóa học nổi bật</h2>
            <p className="text-sm text-slate-500">Tuyển chọn các khóa học được yêu thích nhất.</p>
          </div>
          <Link href="#levels" className="text-sm font-medium text-brand-blue transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">Xem tất cả khóa học →</Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {courses.map((course) => <CourseCard key={course.level} course={course} />)}
        </div>
      </div>
    </section>
  );
}
