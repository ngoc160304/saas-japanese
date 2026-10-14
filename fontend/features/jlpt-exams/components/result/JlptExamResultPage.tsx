import type { JlptExamResult } from '../../result/types';
import { ResultActions } from './ResultActions';
import { ResultBreadcrumbs } from './ResultBreadcrumbs';
import { ResultHeroCard } from './ResultHeroCard';
import { ResultScoringSections } from './ResultScoringSections';
import { ResultSessionBreakdown } from './ResultSessionBreakdown';

export function JlptExamResultPage({ result }: { result: JlptExamResult }) {
  return (
    <div className="mx-auto w-full max-w-5xl pb-8">
      <ResultBreadcrumbs title={result.examTitle} />
      <ResultHeroCard result={result} />
      <ResultActions result={result} />
      <ResultScoringSections sections={result.scoringSections} />
      <ResultSessionBreakdown sessions={result.sessions} />
    </div>
  );
}
