import type { JlptExamDetail as JlptExamDetailData } from '../../detail-types';
import { ExamDetailBreadcrumbs } from './ExamDetailBreadcrumbs';
import { ExamOverviewCard } from './ExamOverviewCard';
import { FullExamStartCard } from './FullExamStartCard';
import { ExamSessionsSection } from './ExamSessionsSection';

export function JlptExamDetail({ exam }: { exam: JlptExamDetailData }) {
  const totalQuestions = exam.sessions.reduce(
    (examTotal, session) => examTotal + session.mondaiSections.reduce(
      (sessionTotal, mondai) => sessionTotal + mondai.questionCount, 0,
    ), 0,
  );
  const totalDuration = exam.sessions.reduce((total, session) => total + session.durationMinutes, 0);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <ExamDetailBreadcrumbs title={exam.title} />
      <ExamOverviewCard exam={exam} totalQuestions={totalQuestions} totalDuration={totalDuration} />
      <FullExamStartCard examId={exam.id} />
      <ExamSessionsSection examId={exam.id} sessions={exam.sessions} />
    </div>
  );
}
