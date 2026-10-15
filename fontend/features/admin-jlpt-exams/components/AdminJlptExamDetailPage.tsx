'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Pencil, Plus } from 'lucide-react';
import Header from '@/components/layout/management/header/Header';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { Button } from '@/components/ui/button';
import { getApiError } from '@/lib/api-error';
import { adminJlptMetadataLock } from '../admin-jlpt-metadata';
import {
  adminJlptContentLock,
  type AdminJlptEditorTarget,
  type AdminJlptStructureTarget,
} from '../admin-jlpt-structure';
import { useAdminJlptExamDetail } from '../hooks/useAdminJlptExams';
import { useAdminJlptStructure } from '../hooks/useAdminJlptStructure';
import { AdminJlptLoading, AdminJlptQueryError } from './AdminJlptState';
import { AdminJlptStatus } from './AdminJlptStatus';
import { AdminJlptMetadataDialog } from './AdminJlptMetadataDialog';
import { AdminJlptStructureTree } from './AdminJlptStructureTree';
import { AdminJlptStructureDialog } from './AdminJlptStructureDialog';
import { AdminJlptStructureDeleteDialog } from './AdminJlptStructureDeleteDialog';

export function AdminJlptExamDetailPage({ examId }: { examId: number }) {
  return <Builder key={examId} examId={examId} />;
}

function Builder({ examId }: { examId: number }) {
  const query = useAdminJlptExamDetail(examId);
  const structure = useAdminJlptStructure(examId);
  const [editor, setEditor] = useState<AdminJlptEditorTarget | null>(null);
  const [deleting, setDeleting] = useState<AdminJlptStructureTarget | null>(null);
  const [metadata, setMetadata] = useState(false);
  const structureHeading = useRef<HTMLHeadingElement>(null);
  const status = query.isError ? getApiError(query.error).status : null;
  if (query.isError && (!query.data || status === 401 || status === 403 || status === 404))
    return (
      <AdminJlptQueryError
        error={query.error}
        onRetry={() => void query.refetch()}
        returnTo={`/admin/exams/${examId}`}
      />
    );
  if (!query.data) return <AdminJlptLoading />;
  const exam = query.data;
  const lock = adminJlptContentLock(exam);
  const blocked = Boolean(lock || query.isError || query.isFetching);
  const disabled = blocked || structure.pending;
  const openEditor = (target: AdminJlptEditorTarget) => {
    if (!disabled) setEditor(target);
  };
  const openDelete = (target: AdminJlptStructureTarget) => {
    if (!disabled) setDeleting(target);
  };
  return (
    <div className="min-w-0 space-y-6">
      <Header
        title="Xây dựng đề thi JLPT"
        description="Quản lý phiên thi, phần thi và thứ tự câu hỏi."
        showProfile={false}
        breadcrumbs={
          <nav aria-label="Đường dẫn" className="mb-2 flex flex-wrap gap-2 text-xs text-slate-600">
            <Link href="/admin/exams" className="font-semibold text-primary underline">
              ← Danh sách đề thi JLPT
            </Link>
            <span aria-hidden="true">/</span>
            <span>Builder #{exam.id}</span>
          </nav>
        }
      />
      <PageSection>
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 xl:flex-row xl:items-start">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white">
                {exam.level}
              </span>
              <AdminJlptStatus status={exam.status} />
              <span className="text-xs text-slate-600">Mã đề #{exam.id}</span>
            </div>
            <h2 className="break-words text-xl font-bold text-slate-900 [overflow-wrap:anywhere] md:text-2xl">
              {exam.title}
            </h2>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere]">
              {exam.description || 'Chưa có mô tả đề thi.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={
                Boolean(adminJlptMetadataLock(exam)) ||
                query.isError ||
                query.isFetching ||
                structure.pending
              }
              onClick={() => {
                if (!disabled) setMetadata(true);
              }}
            >
              <Pencil />
              Sửa thông tin đề
            </Button>
            <Button disabled={disabled} onClick={() => openEditor({ kind: 'session' })}>
              <Plus />
              Thêm phiên thi
            </Button>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-5 text-sm sm:grid-cols-3 lg:grid-cols-5">
          {[
            ['Phiên thi', exam.sessionCount],
            ['Phần thi', exam.partCount],
            ['Câu hỏi', exam.questionCount],
            ['Thời lượng (phút)', exam.totalTimeMinutes],
            ['Điểm đỗ', exam.passingScore],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-medium text-slate-600">{label}</dt>
              <dd className="mt-1 text-2xl font-bold text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
        {lock && (
          <p
            role="note"
            className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            {lock}
          </p>
        )}
      </PageSection>
      {query.isError && (
        <div
          role="alert"
          className="space-y-3 rounded-2xl border border-rose-200 bg-white p-4 text-sm text-rose-800"
        >
          <p>
            {getApiError(query.error).message} Cấu trúc đang hiển thị là lần tải trước; chỉnh sửa
            tạm khóa.
          </p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Tải lại dữ liệu
          </Button>
        </div>
      )}
      <section aria-labelledby="exam-structure-title" className="min-w-0 space-y-4">
        <h2
          ref={structureHeading}
          tabIndex={-1}
          id="exam-structure-title"
          className="text-lg font-semibold text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Cấu trúc đề thi
        </h2>
        <p role="status" aria-live="polite" className="text-xs text-slate-600">
          {structure.pending
            ? 'Đang lưu thay đổi và đồng bộ cấu trúc…'
            : query.isFetching
              ? 'Đang tải trạng thái mới nhất…'
              : structure.error
                ? 'Chưa xác nhận được kết quả thao tác. Kiểm tra lỗi và trạng thái mới nhất trước khi thử lại.'
                : 'Mỗi thao tác được lưu riêng. Dùng mũi tên để đổi thứ tự trong cùng mục cha.'}
        </p>
        {structure.error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
          >
            {structure.error.message}
          </p>
        )}
        <AdminJlptStructureTree
          exam={exam}
          disabled={disabled}
          onEdit={openEditor}
          onDelete={openDelete}
          onMove={(target, direction) => {
            if (disabled) return;
            void structure.run({ kind: 'move', target, direction }).catch(() => {});
          }}
        />
      </section>
      {metadata && (
        <AdminJlptMetadataDialog
          target={{ mode: 'edit', examId }}
          onClose={() => setMetadata(false)}
        />
      )}
      {editor && (
        <AdminJlptStructureDialog
          examId={examId}
          target={editor}
          pending={structure.pending}
          run={structure.run}
          onClose={() => setEditor(null)}
        />
      )}
      {deleting && (
        <AdminJlptStructureDeleteDialog
          exam={exam}
          target={deleting}
          disabled={blocked}
          pending={structure.pending}
          run={structure.run}
          finalFocus={structureHeading}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
