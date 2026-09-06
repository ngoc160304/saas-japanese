'use client';

import { categoryCourseAPI } from '@/apis/categories-course/categories-course.api';
import { GetCoursesResponse } from '@/apis/categories-course/categories-course.type';
import { CreateButton } from '@/components/common/CreateButton';
import Card from '@/components/dashboard/card/Card';
import FilterBar from '@/components/dashboard/search-bar/FilterBar';
import StatCard from '@/components/dashboard/stat-card/StatCard';
import { IStatCardProp } from '@/components/dashboard/stat-card/StatCardItem';
import Header from '@/components/layout/header/Header';
import PageSection from '@/components/layout/page-section/PageSection';
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

  React.useEffect(() => {
    categoryCourseAPI.getCategoriesCourse().then((data) => {
      setCategories(data);
    });
  }, []);
  const [textSearch, setTextSearch] = React.useState<string | null>(null);

  return (
    <>
      <Header
        title="Course"
        description="Quản lý các khóa học tiếng Nhật theo cấp độ JLPT (N5 - N1), lộ trình bài học và trạng thái xuất bản."
        children={<CreateButton href="/admin/categories-course/create" label="Create Course" />}
      />
      <StatCard statCardItem={STATCARD_ITEMS} />
      <PageSection>
        <FilterBar />
        {categories && (
          <Card
            cardItems={categories.data.content.map((item) => {
              return {
                description: item.description,
                title: item.name,
                courseStats: `${item.courseCount} Courses`,
                thumbnail: item.mediaUrl,
              };
            })}
          />
        )}
      </PageSection>
    </>
  );
};

export default CategoriesCoursePage;
