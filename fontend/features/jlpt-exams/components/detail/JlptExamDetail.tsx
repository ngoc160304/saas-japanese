import type { JlptExamOverview } from '@/apis/jlpt-exams/jlpt-exams.type';
import { ExamDetailBreadcrumbs } from './ExamDetailBreadcrumbs';
import { ExamOverviewCard } from './ExamOverviewCard';
import { FullExamStartCard } from './FullExamStartCard';
import { ExamSessionsSection } from './ExamSessionsSection';

export function JlptExamDetail({ exam }: { exam: JlptExamOverview }) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <ExamDetailBreadcrumbs title={exam.title} />
      <ExamOverviewCard exam={exam} />
      <FullExamStartCard examId={exam.id} isPublished={exam.isPublished} />
      <ExamSessionsSection />
    </div>
  );
}
