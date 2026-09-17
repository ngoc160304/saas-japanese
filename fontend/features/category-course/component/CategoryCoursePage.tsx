'use client';

import { categoryCourseAPI } from '@/apis/categories-course/categories-course.api';

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
import { IsLoading } from '@/components/common/loading/IsLoading';
import { CategoryCourseDialog } from './CategoryCourseDialog';

const CategoryCoursePage = () => {
  const {
    data: categories,
    isLoading,
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
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  return (
    <>
      <Header
        title="Course"
        description="Quản lý các khóa học tiếng Nhật theo cấp độ JLPT (N5 - N1), lộ trình bài học và trạng thái xuất bản."
        children={
          <CreateButton label="Create Course" handleClick={() => setCreateDialogOpen(true)} />
        }
      />

      <StatCard
        items={[
          {
            label: 'Total Categories',
            value: 8,
            description: 'Japanese Skills',
            valueClassName: 'text-slate-900',
            descriptionClassName: 'text-sky-600 bg-sky-50',
          },
          {
            label: 'Linked Courses',
            value: 113,
            description: 'N5 → N1 Curriculums',
            valueClassName: 'text-indigo-600',
            descriptionClassName: 'text-indigo-600 bg-indigo-50',
          },
          {
            label: 'Total Lessons',
            value: 452,
            description: 'Curriculum Lessons',
            valueClassName: 'text-emerald-600',
            descriptionClassName: 'text-emerald-600 bg-emerald-50',
          },
          {
            label: 'Linked Exams',
            value: 42,
            description: 'JLPT Test Suites',
            valueClassName: 'text-amber-600',
            descriptionClassName: 'text-amber-600 bg-amber-50',
          },
        ]}
      />

      <PageSection>
        <DataTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search course..."
          onReset={reset}
        >
          <DataTableFilter
            options={[
              {
                label: 'All Status',
                value: 'ALL',
              },
              {
                label: 'Published',
                value: 'published',
              },
              {
                label: 'Draft',
                value: 'draft',
              },
            ]}
          />
        </DataTableToolbar>
        {isLoading && <IsLoading />}

        {categories && (
          <CourseCategoriesTable
            courseCategories={categories.data.content}
            canEdit
            canDelete
            onDelete={(id) => {
              console.log('delete course:', id);
            }}
            onReload={refetch}

            isLoading={isLoading}
          />
        )}

        {categories && (
          <DataTablePagination
            page={categories.data.pageable.pageNumber + 1}
            totalPages={categories.data.totalPages}
            onPageChange={setPage}
          />
        )}
      </PageSection>
      <CategoryCourseDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onReload={refetch}
        mode="create"
      />
    </>
  );
};

export default CategoryCoursePage;
