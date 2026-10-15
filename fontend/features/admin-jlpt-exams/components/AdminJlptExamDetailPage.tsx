'use client';

import Link from 'next/link';
import type { AdminJlptSessionType } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';
import Header from '@/components/layout/management/header/Header';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { useAdminJlptExamDetail } from '../hooks/useAdminJlptExams';
import { AdminJlptLoading, AdminJlptQueryError } from './AdminJlptState';
import { AdminJlptStatus } from './AdminJlptStatus';

const sessionLabels: Record<AdminJlptSessionType, string> = {
  language_knowledge: 'Kiến thức ngôn ngữ',
  reading: 'Đọc hiểu',
  listening: 'Nghe hiểu',
};

export function AdminJlptExamDetailPage({ examId }: { examId: number }) {
  const query = useAdminJlptExamDetail(examId);
  if (query.isError)
    return (
      <AdminJlptQueryError
        error={query.error}
        onRetry={() => void query.refetch()}
        returnTo={`/admin/exams/${examId}`}
      />
    );
  if (!query.data) return <AdminJlptLoading />;
  const exam = query.data;
  return (
    <div className="space-y-6" aria-busy={query.isFetching}>
      <Header
        title={exam.title}
        description={`${exam.level} · Mã đề #${exam.id} · Chế độ chỉ đọc`}
        showProfile={false}
        breadcrumbs={
          <Link href="/admin/exams" className="text-xs font-semibold text-primary underline">
            ← Danh sách đề thi JLPT
          </Link>
        }
      />
      <PageSection>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Thông tin đề thi</h2>
          <AdminJlptStatus status={exam.status} />
        </div>
        {exam.description && (
          <p className="whitespace-pre-wrap break-words text-sm text-slate-600">
            {exam.description}
          </p>
        )}
        <dl className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-5">
          {[
            ['Phiên thi', exam.sessionCount],
            ['Phần thi', exam.partCount],
            ['Câu hỏi', exam.questionCount],
            ['Thời lượng (phút)', exam.totalTimeMinutes],
            ['Điểm đỗ', exam.passingScore],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-slate-600">{label}</dt>
              <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-slate-600">
          {exam.status === 'ARCHIVED'
            ? 'Đề thi đã lưu trữ, chỉ được xem và giữ lại lịch sử làm bài.'
            : exam.hasAttempts
              ? 'Đã có lượt làm bài. Nội dung vẫn bị khóa sau khi hủy xuất bản.'
              : exam.contentLocked
                ? 'Nội dung đã khóa. Cần hủy xuất bản trước khi chỉnh sửa.'
                : 'Đề nháp chưa bị khóa nội dung. Trang hiện tại chỉ hỗ trợ xem.'}
        </p>
      </PageSection>
      <section aria-labelledby="exam-structure-title" className="space-y-4">
        <h2 id="exam-structure-title" className="text-lg font-semibold text-slate-900">
          Cấu trúc đề thi
        </h2>
        {exam.sessions.length === 0 ? (
          <PageSection>
            <p className="text-sm text-slate-600">Đề thi chưa có phiên thi.</p>
          </PageSection>
        ) : (
          exam.sessions.map((session) => (
            <PageSection key={session.id}>
              <h3 className="break-words font-semibold text-slate-900">
                {session.sortOrder + 1}. {session.name}
              </h3>
              <p className="text-xs text-slate-600">
                {sessionLabels[session.sessionType]} · {session.timeLimitMinutes} phút ·{' '}
                {session.parts.length} phần
              </p>
              {session.parts.length === 0 ? (
                <p className="text-sm text-slate-600">Phiên thi chưa có phần thi.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {session.parts.map((part) => (
                    <li key={part.id} className="space-y-1 py-3">
                      <h4 className="break-words text-sm font-semibold text-slate-800">
                        {part.sortOrder + 1}. {part.name}
                      </h4>
                      <p className="text-xs text-slate-600">
                        {part.questions.length} câu hỏi{part.audio ? ' · Đã gắn audio' : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </PageSection>
          ))
        )}
      </section>
    </div>
  );
}
