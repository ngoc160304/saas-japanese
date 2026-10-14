'use client';

import { useQuery } from '@tanstack/react-query';
import { studyAPI, studyKeys } from '@/apis/study/study.api';
import { StudyError, StudyLoading } from './StudyState';

export function VocabularySection({
  userId,
  courseId,
  lessonId,
  active,
}: {
  userId: number;
  courseId: number;
  lessonId: number;
  active: boolean;
}) {
  const query = useQuery({
    queryKey: [...studyKeys.lesson(userId, courseId, lessonId), 'vocabularies'],
    queryFn: ({ signal }) => studyAPI.getVocabularies(lessonId, signal),
    enabled: active,
    retry: false,
  });
  if (!active && !query.data) return null;
  if (query.isError)
    return (
      <StudyError error={query.error} onRetry={() => void query.refetch()} courseId={courseId} />
    );
  if (query.isPending) return <StudyLoading label="Loading vocabulary…" />;
  return (
    <section aria-labelledby="vocabulary-title">
      <h2 id="vocabulary-title" className="mb-4 text-lg font-bold text-slate-900">
        Vocabulary ({query.data.length})
      </h2>
      {query.data.length === 0 ? (
        <p className="rounded-2xl bg-sky-50 p-5 text-sm text-slate-600">
          No vocabulary has been added to this lesson.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {query.data.map((word) => (
            <li
              key={word.id}
              className="min-w-0 break-words rounded-2xl border border-sky-100 bg-sky-50/50 p-5"
            >
              <h3 className="text-xl font-bold text-slate-900" lang="ja">
                {word.word}
              </h3>
              {word.reading && (
                <p className="mt-1 text-sm text-sky-800" lang="ja">
                  {word.reading}
                </p>
              )}
              {word.partOfSpeech && (
                <p className="mt-2 text-xs font-semibold text-slate-500">{word.partOfSpeech}</p>
              )}
              {word.meaningVi && (
                <p className="mt-2 text-sm text-slate-700" lang="vi">
                  {word.meaningVi}
                </p>
              )}
              {(word.exampleSentenceJp || word.exampleSentenceVi) && (
                <blockquote className="mt-3 space-y-1 border-t border-sky-100 pt-3 text-sm">
                  {word.exampleSentenceJp && <p lang="ja">{word.exampleSentenceJp}</p>}
                  {word.exampleSentenceVi && (
                    <p lang="vi" className="text-slate-600">
                      {word.exampleSentenceVi}
                    </p>
                  )}
                </blockquote>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
