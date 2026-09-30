import {
  CircleCheckBig,
  Clock3,
  FileText,
  type LucideIcon,
  MonitorSmartphone,
  Play,
  ShieldCheck,
  ShoppingCart,
  Video,
} from 'lucide-react';
import { CourseThumbnail } from '@/features/course/component/CourseThumbnail';
import { formatCoursePrice } from '@/features/course/utils/course-format';
import type { CourseBenefitIcon, CourseDetailData } from '../course-detail.types';

const benefitIcons: Record<CourseBenefitIcon, LucideIcon> = {
  video: Video,
  document: FileText,
  exam: CircleCheckBig,
  lifetime: Clock3,
  devices: MonitorSmartphone,
};

export function CoursePurchaseCard({ course }: { course: CourseDetailData }) {
  return (
    <aside
      aria-label="Thông tin mua khóa học"
      className="shadow-soft rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div className="group relative mb-6 h-44 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        <CourseThumbnail
          src={course.thumbnailUrl}
          title={course.title}
          className="h-full w-full rounded-none border-0 bg-slate-100 text-slate-300"
        />
        {!course.thumbnailUrl && (
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-5xl font-black text-slate-200 select-none"
            aria-hidden="true"
          >
            {course.level.replace('JLPT ', '')}
          </span>
        )}
        <span
          className="absolute inset-0 z-10 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-navy text-white shadow-md transition-transform group-hover:scale-110"
          aria-hidden="true"
        >
          <Play className="h-6 w-6 translate-x-0.5 fill-current" />
        </span>
        <span className="absolute right-2.5 bottom-2.5 z-10 rounded bg-slate-900/80 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-xs">
          Video giới thiệu chưa khả dụng
        </span>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-extrabold text-slate-900">
            {formatCoursePrice(course.price)}
          </span>
          <span className="text-base font-medium text-slate-400 line-through">
            {formatCoursePrice(course.originalPrice)}
          </span>
          <span className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">
            -{course.discountPercentage}%
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          Ưu đãi áp dụng có hạn
        </p>
      </div>

      <div className="space-y-3" aria-describedby="purchase-unavailable-note">
        <button
          type="button"
          disabled
          title="Chức năng mua khóa học chưa được kết nối"
          className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-3 text-sm font-semibold text-white opacity-55 shadow-sm"
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          Thêm vào giỏ hàng
        </button>
        <button
          type="button"
          disabled
          title="Chức năng mua khóa học chưa được kết nối"
          className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-lg border border-brand-blue bg-blue-50 px-4 py-2.5 text-sm font-semibold text-brand-blue opacity-55"
        >
          Mua ngay
        </button>
      </div>
      <p id="purchase-unavailable-note" className="mt-3 text-center text-xs text-slate-500">
        Chức năng mua khóa học chưa được kết nối.
      </p>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
        <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
        <span>Cam kết hoàn tiền trong 30 ngày</span>
      </p>

      <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
        <h2 className="text-xs font-bold tracking-wide text-slate-800 uppercase">
          Khóa học này bao gồm:
        </h2>
        <ul className="space-y-2.5 text-xs font-medium text-slate-600">
          {course.benefits.map((benefit) => {
            const BenefitIcon = benefitIcons[benefit.icon];
            return (
              <li key={benefit.id} className="flex items-center gap-2.5">
                <BenefitIcon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span>{benefit.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
