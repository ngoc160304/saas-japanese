import { CreateButton } from '@/components/common/CreateButton';
import Card from '@/components/dashboard/card/Card';
import StatCard from '@/components/dashboard/stat-card/StatCard';
import { IStatCardProp } from '@/components/dashboard/stat-card/StatCardItem';
import Header from '@/components/layout/header/Header';

const statCardItem: IStatCardProp[] = [
  {
    quantity: 120,
  },
  {
    quantity: 85,
  },
  {
    quantity: 42,
  },
  {
    quantity: 18,
  },
];

export interface ICartItemProp {
  title: string;
  description: string;
  learnerCount?: number;
  courseStats?: string;
  isPublished: boolean;
}

const data: ICartItemProp[] = [
  {
    title: 'Japanese N5',
    description: 'Learn Japanese from the basics with vocabulary, grammar and kanji.',
    learnerCount: 1250,
    courseStats: '40 Lessons',
    isPublished: true,
  },
  {
    title: 'Japanese N4',
    description: 'Build your Japanese foundation and improve your daily communication skills.',
    learnerCount: 890,
    courseStats: '35 Lessons',
    isPublished: true,
  },
  {
    title: 'Japanese N3',
    description: 'Develop intermediate Japanese grammar, vocabulary and reading skills.',
    learnerCount: 520,
    courseStats: '30 Lessons',
    isPublished: false,
  },
  {
    title: 'Japanese N2',
    description: 'Master advanced Japanese grammar and expand your vocabulary.',
    courseStats: '25 Lessons',
    isPublished: false,
  },
];
const CategoriesCoursePage = () => {
  return (
    <>
      <Header
        title="Course"
        description="Quản lý các khóa học tiếng Nhật theo cấp độ JLPT (N5 - N1), lộ trình bài học và trạng thái xuất bản."
        children={<CreateButton href="/admin/categories-course/create" label="Create Course" />}
      />
      <StatCard statCardItem={statCardItem} />
      <Card cardItems={data} />
    </>
  );
};

export default CategoriesCoursePage;
