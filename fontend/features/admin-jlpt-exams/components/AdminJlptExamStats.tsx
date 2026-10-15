'use client';

import { Archive, BookOpen, Check, Pencil } from 'lucide-react';
import { StatCard } from '@/components/common/stats/StatCard';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/lib/api-error';
import type { useAdminJlptExamStats } from '../hooks/useAdminJlptExams';

export function AdminJlptExamStats({ query }: { query: ReturnType<typeof useAdminJlptExamStats> }) {
  if (query.isError)
    return (
      <section
        aria-label="Thống kê đề thi"
        role="alert"
        className="mb-6 space-y-3 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-700"
      >
        <p>Chưa thể tải thống kê. {getApiErrorMessage(query.error)}</p>
        <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
          Thử lại thống kê
        </Button>
      </section>
    );
  if (!query.data)
    return (
      <section
        aria-label="Thống kê đề thi"
        role="status"
        aria-busy="true"
        className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {['Tổng đề thi', 'Đã xuất bản', 'Bản nháp', 'Đã lưu trữ'].map((label) => (
          <div key={label} className="rounded-3xl border border-slate-100 bg-white p-5">
            <p className="text-xs font-semibold text-slate-600">{label}</p>
            <p className="mt-2 text-sm text-slate-600">Đang tải…</p>
          </div>
        ))}
      </section>
    );
  return (
    <div aria-label="Thống kê đề thi" aria-busy={query.isFetching}>
      <StatCard
        items={[
          {
            label: 'Tổng đề thi',
            value: query.data.totalExams,
            description: 'Gồm cả đề đã lưu trữ',
            icon: <BookOpen className="size-5 text-primary" aria-hidden="true" />,
          },
          {
            label: 'Đã xuất bản',
            value: query.data.publishedExams,
            description: 'Đang mở cho học viên',
            valueClassName: 'text-emerald-700',
            icon: <Check className="size-5 text-emerald-700" aria-hidden="true" />,
          },
          {
            label: 'Bản nháp',
            value: query.data.draftExams,
            description: 'Đang biên soạn',
            valueClassName: 'text-amber-800',
            icon: <Pencil className="size-5 text-amber-800" aria-hidden="true" />,
          },
          {
            label: 'Đã lưu trữ',
            value: query.data.archivedExams,
            description: 'Lưu giữ lịch sử làm bài',
            icon: <Archive className="size-5 text-slate-600" aria-hidden="true" />,
          },
        ]}
      />
    </div>
  );
}
