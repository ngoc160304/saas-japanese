import Link from 'next/link';
import type { CourseCategoryDetail } from '@/apis/categories-course/categories-course.type';
import Header from '@/components/layout/management/header/Header';
import { CategoryCourseAction } from './CategoryCourseActions';

export function CategoryCourseDetailHeader({
  category,
  onDeleted,
}: {
  category: CourseCategoryDetail;
  onDeleted: () => void;
}) {
  return (
    <Header
      title={`Danh mục: ${category.name}`}
      description={category.description || 'Chưa có mô tả'}
      showProfile={false}
      breadcrumbs={
        <nav
          aria-label="Đường dẫn"
          className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500"
        >
          <Link href="/admin/categories-course" className="hover:text-sky-600">
            ← Danh mục khóa học
          </Link>
          <span>/</span>
          <span className="text-slate-900">{category.name}</span>
        </nav>
      }
    >
      <CategoryCourseAction
        courseCategory={category}
        canEdit
        canDelete
        showDetail={false}
        onDeleted={onDeleted}
      />
    </Header>
  );
}
