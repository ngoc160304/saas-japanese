import type { AdminJlptExamStatus } from '@/apis/admin-jlpt-exams/admin-jlpt-exams.type';
import { Badge } from '@/components/ui/badge';

const statuses: Record<AdminJlptExamStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Bản nháp', className: 'bg-amber-50 text-amber-800' },
  PUBLISHED: { label: 'Đã xuất bản', className: 'bg-emerald-50 text-emerald-800' },
  ARCHIVED: { label: 'Đã lưu trữ', className: 'bg-slate-100 text-slate-700' },
};

export function AdminJlptStatus({ status }: { status: AdminJlptExamStatus }) {
  const item = statuses[status];
  return <Badge className={item.className}>{item.label}</Badge>;
}
