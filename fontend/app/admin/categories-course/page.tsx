'use client';

import { categoryCourseAPI } from '@/apis/categories-course/categories-course.api';
import { GetCoursesResponse } from '@/apis/categories-course/categories-course.type';
import { CreateButton } from '@/components/common/CreateButton';
import { DataTableToolbar } from '@/components/common/table/DataTableToolbar';
import { DataTableFilter } from '@/components/common/table/search-bar/DataTableFilters';
import Card from '@/components/dashboard/card/Card';
import FilterBar from '@/components/dashboard/search-bar/FilterBar';
import StatCard from '@/components/dashboard/stat-card/StatCard';
import { IStatCardProp } from '@/components/dashboard/stat-card/StatCardItem';
import Header from '@/components/layout/management/header/Header';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { CourseCategoriesTable } from '@/features/category-course/component/CategoryCourseTable';
import React from 'react';

const STATCARD_ITEMS: IStatCardProp[] = [
  {
    quantity: 1,
    title: 'xxxxx',
  },
  {
    quantity: 1,
    title: 'xxxxx',
  },
  {
    quantity: 1,
    title: 'xxxxx',
  },
  {
    quantity: 1,
    title: 'xxxxx',
    staus: 'draft',
  },
];

const CategoriesCoursePage = () => {
  const [categories, setCategories] = React.useState<GetCoursesResponse | null>(null);

  const reloadCategories = () => {
    categoryCourseAPI.getCategoriesCourse().then((data) => {
      setCategories(data);
    });
  };

  React.useEffect(() => {
    reloadCategories();
  }, []);

  return (
    <>
      <Header
        title="Course"
        description="Quản lý các khóa học tiếng Nhật theo cấp độ JLPT (N5 - N1), lộ trình bài học và trạng thái xuất bản."
        children={<CreateButton href="/admin/categories-course/create" label="Create Course" />}
      />
      <StatCard statCardItem={STATCARD_ITEMS} />
      <PageSection>
        <div className="space-y-6">
          <DataTableToolbar
            // searchValue={search}
            // onSearchChange={setSearch}
            searchPlaceholder="Search course..."
            // onReset={handleReset}
          >
            <DataTableFilter
              // value={status}
              // onChange={(value) => setStatus(value as 'ALL' | CourseStatus)}
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

          {categories && (
            <CourseCategoriesTable
              courseCategories={categories.data.content}
              canEdit
              canDelete
              onDelete={(id) => {
                console.log('delete course:', id);
              }}
              onReload={reloadCategories}
            />
          )}
        </div>
      </PageSection>
    </>
  );
};

export default CategoriesCoursePage;
