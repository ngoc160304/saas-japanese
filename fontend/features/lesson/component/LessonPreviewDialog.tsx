'use client';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { lessonAPI } from '@/apis/lessons/lessons.api';
import { vocabularyAPI, kanjiAPI } from '@/apis/lessons/lesson-content.api';
import {
  adminQuizAPI,
  adminQuizKey,
  getQuizError,
  quizPreviewQuestions,
} from '@/apis/lessons/admin-quiz.api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { sanitizeGrammarHtml } from './grammar/sanitizeGrammarHtml';
import { QuizQuestionCard } from './quiz/QuizQuestionCard';

/** Read-only admin projection: never mounts student data hooks or writes progress/answers. */
export function LessonPreviewDialog({
  lessonId,
  courseId,
  onClose,
}: {
  lessonId: number;
  courseId: number;
  onClose: () => void;
}) {
  const lessonQuery = useQuery({
    queryKey: ['admin', 'lessons', lessonId, 'preview', courseId],
    queryFn: () => lessonAPI.getById(lessonId),
    retry: false,
    refetchOnMount: 'always',
  });
  const lesson = lessonQuery.data;
  const valid =
    lessonQuery.isSuccess &&
    lessonQuery.isFetchedAfterMount &&
    lesson?.id === lessonId &&
    lesson.courseId === courseId &&
    !lesson.isDeleted;
  const vocabulary = useQuery({
    queryKey: ['admin', 'lessons', lessonId, 'vocabularies'],
    queryFn: ({ signal }) => vocabularyAPI.listByLesson(lessonId, signal),
    enabled: valid,
    retry: false,
    refetchOnMount: 'always',
  });
  const kanji = useQuery({
    queryKey: ['admin', 'lessons', lessonId, 'kanjis'],
    queryFn: ({ signal }) => kanjiAPI.listByLesson(lessonId, signal),
    enabled: valid,
    retry: false,
    refetchOnMount: 'always',
  });
  const quiz = useQuery({
    queryKey: adminQuizKey(lessonId),
    queryFn: ({ signal }) => adminQuizAPI.get(lessonId, signal),
    enabled: valid,
    retry: false,
    refetchOnMount: 'always',
  });
  const grammar = useMemo(
    () => (typeof DOMParser === 'undefined' ? '' : sanitizeGrammarHtml(lesson?.grammar ?? '')),
    [lesson?.grammar],
  );
  const [videoError, setVideoError] = useState(false);
  const queries = [lessonQuery, vocabulary, kanji, quiz];
  const failure = queries.find((query) => query.isError);
  const invalid = lessonQuery.isFetchedAfterMount && lessonQuery.isSuccess && !valid;
  const loading = queries.some((query) => query.isPending || query.isFetching);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="rounded-3xl bg-white p-5 text-slate-900 sm:max-w-4xl md:p-8">
        <DialogTitle>Xem trước bài học</DialogTitle>
        <DialogDescription>
          Nội dung đã lưu dành cho quản trị viên. Không ghi nhận tiến độ hay lượt làm bài.
        </DialogDescription>
        {failure || invalid ? (
          <div role="alert" className="space-y-3">
            <p>
              {invalid
                ? 'Bài học không còn thuộc khóa học này hoặc đã bị xóa.'
                : getQuizError(failure?.error).message}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                for (const query of queries)
                  if (query.isError || query === lessonQuery) void query.refetch();
              }}
            >
              Thử lại
            </Button>
          </div>
        ) : loading ? (
          <p role="status">Đang tải nội dung đã lưu…</p>
        ) : (
          valid &&
          lesson && (
            <div className="space-y-6" data-testid="lesson-preview">
              <div>
                <h2 className="text-xl font-bold break-words">{lesson.title}</h2>
                <p className="mt-1 text-sm font-semibold text-sky-800">
                  Bài học: {lesson.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                </p>
              </div>
              <section className="space-y-2">
                <h3 className="font-bold">Video bài giảng</h3>
                {lesson.videoUrl ? (
                  <>
                    <video
                      controls
                      playsInline
                      preload="metadata"
                      aria-label="Video bài học đã lưu"
                      className="aspect-video w-full rounded-2xl bg-slate-950"
                      src={lesson.videoUrl}
                      onError={() => setVideoError(true)}
                      onLoadedData={() => setVideoError(false)}
                    />
                    {videoError && (
                      <p role="alert" className="text-sm text-rose-700">
                        Không thể phát video. Vui lòng kiểm tra kết nối hoặc tải lại nội dung.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-600">Chưa có video.</p>
                )}
              </section>
              <section className="space-y-2">
                <h3 className="font-bold">Ngữ pháp</h3>
                {grammar ? (
                  <div
                    className="prose max-w-none break-words text-sm leading-7"
                    dangerouslySetInnerHTML={{ __html: grammar }}
                  />
                ) : (
                  <p className="text-sm text-slate-600">Chưa có ngữ pháp.</p>
                )}
              </section>
              <section className="space-y-3">
                <h3 className="font-bold">Từ vựng ({vocabulary.data?.length})</h3>
                {!vocabulary.data?.length && (
                  <p className="text-sm text-slate-600">Chưa có từ vựng.</p>
                )}
                <dl className="grid gap-3 sm:grid-cols-2">
                  {vocabulary.data?.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                      <dt className="font-bold break-words">
                        {item.word} <span className="font-normal text-sky-700">{item.reading}</span>
                      </dt>
                      <dd className="whitespace-pre-wrap break-words">
                        {item.meaningVi}
                        {item.partOfSpeech && (
                          <span className="ml-2 text-slate-500">({item.partOfSpeech})</span>
                        )}
                      </dd>
                      {item.exampleSentenceJp && (
                        <dd className="mt-2 whitespace-pre-wrap break-words">
                          {item.exampleSentenceJp}
                        </dd>
                      )}
                      {item.exampleSentenceVi && (
                        <dd className="whitespace-pre-wrap break-words text-slate-600">
                          {item.exampleSentenceVi}
                        </dd>
                      )}
                    </div>
                  ))}
                </dl>
              </section>
              <section className="space-y-3">
                <h3 className="font-bold">Kanji ({kanji.data?.length})</h3>
                {!kanji.data?.length && <p className="text-sm text-slate-600">Chưa có Kanji.</p>}
                <dl className="grid gap-3 sm:grid-cols-2">
                  {kanji.data?.map((item) => (
                    <div
                      key={item.id}
                      className="space-y-1 rounded-xl border border-slate-200 p-3 text-sm"
                    >
                      <dt className="text-lg font-bold break-words">{item.kanji}</dt>
                      <dd className="break-words">{item.meaningVi}</dd>
                      {item.onyomi && (
                        <dd className="whitespace-pre-wrap break-words">Onyomi: {item.onyomi}</dd>
                      )}
                      {item.kunyomi && (
                        <dd className="whitespace-pre-wrap break-words">Kunyomi: {item.kunyomi}</dd>
                      )}
                      {item.strokeCount !== null && <dd>Số nét: {item.strokeCount}</dd>}
                      {item.exampleWords && (
                        <dd className="whitespace-pre-wrap break-words">{item.exampleWords}</dd>
                      )}
                    </div>
                  ))}
                </dl>
              </section>
              <section className="space-y-3">
                <h3 className="font-bold">Quiz{quiz.data && `: ${quiz.data.title}`}</h3>
                {quiz.data ? (
                  <>
                    <p className="text-sm font-semibold text-sky-800">
                      {quiz.data.isPublished ? 'Quiz đã xuất bản' : 'Quiz bản nháp'}
                    </p>
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {quiz.data.description}
                    </p>
                    {!quiz.data.questions.length && <p>Chưa có câu hỏi.</p>}
                    {quizPreviewQuestions(quiz.data).map((question, index) => (
                      <QuizQuestionCard key={question.id} question={question} number={index + 1} />
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-slate-600">Chưa có Quiz.</p>
                )}
              </section>
            </div>
          )
        )}
        <Button variant="outline" onClick={onClose}>
          Quay lại chỉnh sửa
        </Button>
      </DialogContent>
    </Dialog>
  );
}
