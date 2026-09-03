import { Button } from '@/components/ui/button';
import { StatusBadge } from '../status-badge/StatusBadge';

export interface ICartItemProp {
  title: string;
  description: string;
  learnerCount?: number;
  courseStats?: string;
  isPublished: boolean;
}

const CardItem = (props: ICartItemProp) => {
  const { title, description, learnerCount, courseStats, isPublished } = props;
  return (
    <article className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-soft hover:-translate-y-0.5 hover:shadow-md transition-all flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="assets/images/book_3d.jpg"
            alt=""
            className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 object-contain p-1"
          />
          <div className="min-w-0">
            <a
              href="admin_course_detail.html?course_id=1"
              className="block text-sm font-extrabold text-slate-900 hover:text-sky-600 line-clamp-2"
            >
              {title}
            </a>
          </div>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-600"></span>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-500 line-clamp-2">{description}</p>
      <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-slate-500">
        <span>{courseStats}</span>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        {isPublished ? (
          <StatusBadge status="active" label="Active" />
        ) : (
          <StatusBadge status="draft" label="Draft" />
        )}
      </div>
      <div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              title="Sửa danh mục"
              aria-label="Sửa danh mục"
              className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-sky-50 border border-slate-200/80 hover:border-sky-200 text-slate-500 hover:text-sky-600 flex items-center justify-center transition-all"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </Button>
            <Button
              type="button"
              title="Xóa danh mục"
              aria-label="Xóa danh mục"
              className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-all"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <a
            href="admin_courses.html?category_id=${item.id}"
            className="block w-full rounded-xl bg-slate-900 hover:bg-sky-600 px-3 py-2.5 text-center text-xs font-bold text-white transition-colors"
          >
            Xem
          </a>
        </div>
      </div>
    </article>
  );
};
export default CardItem;
