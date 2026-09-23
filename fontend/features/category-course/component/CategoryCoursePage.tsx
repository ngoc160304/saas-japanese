'use client';

import { categoryCourseAPI } from '@/apis/categories-course/categories-course.api';
import { getApiErrorMessage } from '@/lib/api-error';

import { CreateButton } from '@/components/common/button/CreateButton';
import { DataTablePagination } from '@/components/common/table/DataTablePagination';
import { DataTableToolbar } from '@/components/common/table/DataTableToolbar';
import { DataTableFilter } from '@/components/common/table/search-bar/DataTableFilters';

import PageSection from '@/components/layout/management/page-section/PageSection';
import Header from '@/components/layout/management/header/Header';

import { CourseCategoriesTable } from '@/features/category-course/component/CategoryCourseTable';
import { useDataTableQuery } from '@/components/common/table/hooks/useDataTableQuery';
import { StatCard } from '@/components/common/stats/StatCard';
import { useState } from 'react';
import { CategoryCourseDialog } from './CategoryCourseDialog';

const categorySortOptions = {
  newest: { sortKey: 'id', sortType: 'DESC' },
  oldest: { sortKey: 'id', sortType: 'ASC' },
  nameAsc: { sortKey: 'name', sortType: 'ASC' },
  nameDesc: { sortKey: 'name', sortType: 'DESC' },
} as const;

type CategorySortOption = keyof typeof categorySortOptions;

function getCategorySortOption(value: string): CategorySortOption {
  if (value === 'oldest' || value === 'nameAsc' || value === 'nameDesc') return value;
  return 'newest';
}

const CategoryCoursePage = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'name'>('all');
  const [sortOption, setSortOption] = useState<CategorySortOption>('newest');
  const sort = categorySortOptions[sortOption];
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
    size,

    setSearch,
    setPage,
    setSize,
    reset,
  } = useDataTableQuery({
    queryKey: ['categories-course', { searchField, sortOption }],
    queryFn: (params) =>
      categoryCourseAPI.getCategoriesCourse({
        ...params,
        search: searchField === 'all' ? params.search : undefined,
        name: searchField === 'name' ? params.search : undefined,
        sortKey: sort.sortKey,
        sortType: sort.sortType,
      }),
    searchValue: localSearch,
    onSearchChange: setLocalSearch,
    defaultPage: 1,
    defaultSize: 10,
    maxSize: 12,
  });
  const handleReset = () => {
    setSearchField('all');
    setSortOption('newest');
    reset();
  };
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
          onReset={handleReset}
        >
          <DataTableFilter
            value={searchField}
            onChange={(value) => {
              setSearchField(value === 'name' ? 'name' : 'all');
              setPage(1);
            }}
            options={[
              { label: 'Tất cả nội dung', value: 'all' },
              { label: 'Chỉ tên danh mục', value: 'name' },
            ]}
          />
          <DataTableFilter
            value={sortOption}
            onChange={(value) => {
              setSortOption(getCategorySortOption(value));
              setPage(1);
            }}
            options={[
              { label: 'Mới nhất', value: 'newest' },
              { label: 'Cũ nhất', value: 'oldest' },
              { label: 'Tên A–Z', value: 'nameAsc' },
              { label: 'Tên Z–A', value: 'nameDesc' },
            ]}
          />
          <label className="flex items-center gap-2 text-xs text-slate-600">
            Số dòng
            <select
              aria-label="Số danh mục mỗi trang"
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
              className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-3 focus-visible:outline-sky-500"
            >
              {[5, 10, 12].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </label>
        </DataTableToolbar>

        <CourseCategoriesTable
          courseCategories={categories?.data.content ?? []}
          canEdit
          canDelete={!isPlaceholderData && !isFetching && !isError}
          onDeleted={handleDeleted}
          isLoading={isLoading || isFetching}
          error={isError ? getApiErrorMessage(error) : null}
          onRetry={() => void refetch()}
        />

        {categories && !isError && (
          <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-5 text-xs font-medium text-slate-500 sm:flex-row">
            <p aria-live="polite">
              Hiển thị {categories.data.content.length ? categories.data.pageable.offset + 1 : 0}–
              {categories.data.pageable.offset + categories.data.content.length} /{' '}
              {categories.data.totalElements} danh mục
            </p>
            {categories.data.totalPages > 0 && (
              <div className="[&>div]:border-0 [&>div]:pt-0">
                <DataTablePagination
                  page={categories.data.pageable.pageNumber + 1}
                  totalPages={categories.data.totalPages}
                  onPageChange={(nextPage) => {
                    if (!isPlaceholderData && !isFetching) setPage(nextPage);
                  }}
                />
              </div>
            )}
          </div>
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
