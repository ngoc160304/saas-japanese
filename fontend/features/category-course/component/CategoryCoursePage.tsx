'use client';

import { categoryCourseAPI } from '@/apis/categories-course/categories-course.api';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';

import { CreateButton } from '@/components/common/button/CreateButton';
import { DataTablePagination } from '@/components/common/table/DataTablePagination';
import { DataTableToolbar } from '@/components/common/table/DataTableToolbar';

import PageSection from '@/components/layout/management/page-section/PageSection';
import Header from '@/components/layout/management/header/Header';

import { CourseCategoriesTable } from '@/features/category-course/component/CategoryCourseTable';
import { useDataTableQuery } from '@/components/common/table/hooks/useDataTableQuery';
import { StatCard } from '@/components/common/stats/StatCard';
import { useState } from 'react';
import { IsLoading } from '@/components/common/loading/IsLoading';
import { CategoryCourseDialog } from './CategoryCourseDialog';

const CategoryCoursePage = () => {
  const {
    data: categories,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    error,
    page,
    refetch,

    search,

    setSearch,
    setPage,
    reset,
  } = useDataTableQuery({
    queryKey: ['categories-course'],
    queryFn: categoryCourseAPI.getCategoriesCourse,
    defaultPage: 1,
    defaultSize: 10,
    maxSize: 12,
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const handleDeleted = () => {
    if (categories && categories.data.content.length <= 1 && page > 1) {
      setPage(page - 1);
    }
  };
  return (
    <>
      <Header
        title="Danh mục khóa học"
        description="Quản lý danh mục và các khóa học tiếng Nhật liên quan."
        breadcrumbs={<span className="text-xs text-slate-500">Admin / Danh mục khóa học</span>}
        showProfile={false}
      >
        <CreateButton label="Tạo danh mục" handleClick={() => setCreateDialogOpen(true)} />
      </Header>

      <StatCard
        items={[
          {
            label: 'Danh mục phù hợp',
            value: categories?.data.totalElements ?? '—',
            description: 'Theo tìm kiếm hiện tại',
            valueClassName: 'text-slate-900',
            descriptionClassName: 'text-sky-600 bg-sky-50',
          },
        ]}
      />

      <PageSection>
        <DataTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search category..."
          onReset={reset}
        />
        {isLoading && <IsLoading />}
        {isFetching && !isLoading && <p role="status">Đang cập nhật danh sách…</p>}
        {isError && (
          <div role="alert" className="my-4 text-sm text-rose-600">
            <p>{getApiErrorMessage(error)}</p>
            <Button variant="outline" onClick={() => void refetch()}>
              Thử lại
            </Button>
          </div>
        )}

        {categories && (
          <CourseCategoriesTable
            courseCategories={categories.data.content}
            canEdit
            canDelete={!isPlaceholderData && !isFetching && !isError}
            onDeleted={handleDeleted}
          />
        )}

        {categories && categories.data.totalPages > 0 && (
          <DataTablePagination
            page={categories.data.pageable.pageNumber + 1}
            totalPages={categories.data.totalPages}
            onPageChange={(nextPage) => {
              if (!isPlaceholderData) setPage(nextPage);
            }}
          />
        )}
      </PageSection>
      <CategoryCourseDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        mode="create"
      />
    </>
  );
};

export default CategoryCoursePage;
