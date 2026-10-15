'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/management/header/Header';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { Button } from '@/components/ui/button';
import { adminJlptExamPreview, type AdminJlptPreviewExam } from '../admin-jlpt-preview';
import { useAdminJlptExamDetail } from '../hooks/useAdminJlptExams';
import { AdminJlptLoading, AdminJlptQueryError } from './AdminJlptState';
import { AdminJlptPreviewAudio, AdminJlptPreviewContent } from './AdminJlptPreviewContent';
import { AdminJlptSafeText } from './AdminJlptSafeText';

export function AdminJlptExamPreviewPage({ examId }: { examId: number }) {
  const query = useAdminJlptExamDetail(examId, true);
  if (query.isError)
    return (
      <AdminJlptQueryError
        error={query.error}
        onRetry={() => void query.refetch()}
        returnTo={`/admin/exams/${examId}/preview`}
      />
    );
  if (!query.data || !query.isFetchedAfterMount) return <AdminJlptLoading />;
  return <ExamPreview key={examId} exam={adminJlptExamPreview(query.data)} />;
}

function ExamPreview({ exam }: { exam: AdminJlptPreviewExam }) {
  const [sessionId, setSessionId] = useState(exam.sessions[0]?.id);
  const session = exam.sessions.find((s) => s.id === sessionId) ?? exam.sessions[0];
  const [partId, setPartId] = useState<number>();
  const part = session?.parts.find((p) => p.id === partId) ?? session?.parts[0];
  const [questionId, setQuestionId] = useState<string>();
  const question = part?.questions.find((q) => q.id === questionId) ?? part?.questions[0];
  const index = part?.questions.findIndex((q) => q.id === question?.id) ?? -1;
  const selectClass =
    'w-full min-w-0 rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-primary';
  return (
    <div className="min-w-0 space-y-6">
      <Header
        title="Admin preview · Toàn đề"
        description="Dữ liệu đã lưu trên máy chủ. Không tạo lượt làm, không lưu lựa chọn và không chấm điểm."
        showProfile={false}
      >
        <Link
          href={`/admin/exams/${exam.id}`}
          className="text-sm font-semibold text-primary underline"
        >
          ← Về builder
        </Link>
      </Header>
      <PageSection>
        <p className="text-xs font-semibold text-primary">
          {exam.level} · {exam.duration} phút
        </p>
        <h2 className="break-words text-xl font-bold text-slate-900 [overflow-wrap:anywhere]">
          {exam.title}
        </h2>
        <p className="whitespace-pre-wrap break-words text-sm text-slate-600">
          {exam.description || 'Chưa có mô tả.'}
        </p>
        {!exam.sessions.length && (
          <p className="text-sm text-amber-900">Đề thi chưa có phiên thi.</p>
        )}
      </PageSection>
      {session && (
        <PageSection>
          <nav aria-label="Điều hướng preview" className="grid min-w-0 gap-4 sm:grid-cols-2">
            <label className="min-w-0 space-y-2 text-sm font-semibold text-slate-700">
              <span>Phiên thi</span>
            <select
              aria-label="Phiên thi"
                className={selectClass}
                value={session.id}
                onChange={(e) => {
                  setSessionId(Number(e.target.value));
                  setPartId(undefined);
                  setQuestionId(undefined);
                }}
              >
                {exam.sessions.map((s, i) => (
                  <option key={s.id} value={s.id}>
                    {i + 1}. {s.name} · {s.duration} phút
                  </option>
                ))}
              </select>
            </label>
            {part && (
              <label className="min-w-0 space-y-2 text-sm font-semibold text-slate-700">
                <span>Phần thi</span>
              <select
                aria-label="Phần thi"
                  className={selectClass}
                  value={part.id}
                  onChange={(e) => {
                    setPartId(Number(e.target.value));
                    setQuestionId(undefined);
                  }}
                >
                  {session.parts.map((p, i) => (
                    <option key={p.id} value={p.id}>
                      {i + 1}. {p.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </nav>
          <h2 className="break-words font-semibold text-slate-900">
            {session.name} · {session.duration} phút
          </h2>
          {!part && <p className="text-sm text-amber-900">Phiên thi chưa có phần thi.</p>}
          {part && (
            <div key={part.id} className="min-w-0 space-y-4">
              <h3 className="break-words font-semibold text-slate-900">{part.name}</h3>
              {part.instructions ? (
                <AdminJlptSafeText text={part.instructions} />
              ) : (
                <p className="text-sm text-slate-600">Chưa có hướng dẫn.</p>
              )}
              <AdminJlptPreviewAudio audio={part.audio} />
              <nav aria-label="Câu hỏi preview" className="flex flex-wrap gap-2">
                {part.questions.map((q) => (
                  <Button
                    key={q.id}
                    variant={q.id === question?.id ? 'default' : 'outline'}
                    aria-current={q.id === question?.id ? 'step' : undefined}
                    onClick={() => setQuestionId(q.id)}
                  >
                    Câu {q.number}
                  </Button>
                ))}
              </nav>
              {question ? (
                <>
                  <AdminJlptPreviewContent key={`${part.id}:${question.id}`} question={question} />
                  <div className="flex flex-wrap justify-between gap-3">
                    <Button
                      variant="outline"
                      disabled={index <= 0}
                      onClick={() => setQuestionId(part.questions[index - 1]?.id)}
                    >
                      ← Câu trước
                    </Button>
                    <Button
                      variant="outline"
                      disabled={index >= part.questions.length - 1}
                      onClick={() => setQuestionId(part.questions[index + 1]?.id)}
                    >
                      Câu tiếp →
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-amber-900">Phần thi chưa có câu hỏi.</p>
              )}
            </div>
          )}
        </PageSection>
      )}
    </div>
  );
}
