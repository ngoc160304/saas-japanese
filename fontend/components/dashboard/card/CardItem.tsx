import { Button } from '@/components/ui/button';
import { StatusBadge } from '../status-badge/StatusBadge';

export interface ICartItemProp {
  title: string;
  description: string;
  learnerCount?: number;
  courseStats?: string;
  isPublished?: boolean;
  thumbnail?: string;
}

const CardItem = (props: ICartItemProp) => {
  const { title, description, learnerCount, courseStats, isPublished, thumbnail } = props;

  return (
    <article className="group h-full bg-white rounded-2xl border border-slate-200 p-5 shadow-soft hover:-translate-y-0.5 hover:shadow-md transition-all flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={thumbnail ? thumbnail : 'xxx'}
            alt={title}
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
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-500 line-clamp-2">{description}</p>

      <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-slate-500">
        <span>{courseStats}</span>
      </div>

      {isPublished != null && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <StatusBadge
            status={isPublished ? 'active' : 'draft'}
            label={isPublished ? 'Active' : 'Draft'}
          />
        </div>
      )}

      {/* Phần Actions đã được tối ưu */}
      <div className="mt-auto pt-5 flex items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            title="Sửa danh mục"
            aria-label="Sửa danh mục"
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200/80 hover:border-sky-200 text-slate-500 hover:text-sky-600 flex items-center justify-center transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </Button>
          <Button
            type="button"
            title="Xóa danh mục"
            aria-label="Xóa danh mục"
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </Button>
        </div>

        <a
          href="admin_courses.html"
          className="flex-1 block w-full rounded-xl bg-slate-900 hover:bg-sky-600 px-4 py-2.5 text-center text-sm font-bold text-white transition-colors"
        >
          Xem chi tiết
        </a>
      </div>
    </article>
  );
};

export default CardItem;
