'use client';

import { useQuery } from '@tanstack/react-query';
import { studyAPI, studyKeys } from '@/apis/study/study.api';
import { StudyError, StudyLoading } from './StudyState';

export function KanjiSection({
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
    queryKey: [...studyKeys.lesson(userId, courseId, lessonId), 'kanjis'],
    queryFn: ({ signal }) => studyAPI.getKanjis(lessonId, signal),
    enabled: active,
    retry: false,
  });
  if (!active && !query.data) return null;
  if (query.isError)
    return (
      <StudyError error={query.error} onRetry={() => void query.refetch()} courseId={courseId} />
    );
  if (query.isPending) return <StudyLoading label="Loading kanji…" />;
  return (
    <section aria-labelledby="kanji-title">
      <h2 id="kanji-title" className="mb-4 text-lg font-bold text-slate-900">
        Kanji ({query.data.length})
      </h2>
      {query.data.length === 0 ? (
        <p className="rounded-2xl bg-amber-50 p-5 text-sm text-slate-600">
          No kanji have been added to this lesson.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {query.data.map((kanji) => (
            <li
              key={kanji.id}
              className="min-w-0 break-words rounded-2xl border border-amber-100 bg-amber-50/50 p-5"
            >
              <h3 className="text-4xl font-bold text-slate-900" lang="ja">
                {kanji.kanji}
              </h3>
              {kanji.meaningVi && (
                <p className="mt-3 text-sm font-semibold text-slate-700" lang="vi">
                  {kanji.meaningVi}
                </p>
              )}
              <dl className="mt-3 space-y-2 text-sm">
                {kanji.onyomi && (
                  <div>
                    <dt className="font-semibold text-slate-500">Onyomi</dt>
                    <dd lang="ja">{kanji.onyomi}</dd>
                  </div>
                )}
                {kanji.kunyomi && (
                  <div>
                    <dt className="font-semibold text-slate-500">Kunyomi</dt>
                    <dd lang="ja">{kanji.kunyomi}</dd>
                  </div>
                )}
                {kanji.strokeCount !== null && (
                  <div>
                    <dt className="font-semibold text-slate-500">Strokes</dt>
                    <dd>{kanji.strokeCount}</dd>
                  </div>
                )}
                {kanji.exampleWords && (
                  <div>
                    <dt className="font-semibold text-slate-500">Example words</dt>
                    <dd lang="ja">{kanji.exampleWords}</dd>
                  </div>
                )}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
