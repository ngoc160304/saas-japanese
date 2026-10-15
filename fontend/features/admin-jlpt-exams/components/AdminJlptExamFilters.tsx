'use client';

import { DataTableToolbar } from '@/components/common/table/DataTableToolbar';
import { adminJlptLevels } from '../admin-jlpt-metadata';
import type { AdminJlptListParams } from '../admin-jlpt-route';

interface Props {
  params: AdminJlptListParams;
  search: string;
  onSearch: (value: string) => void;
  onFilters: (values: Partial<Pick<AdminJlptListParams, 'level' | 'status' | 'size'>>) => void;
  onReset: () => void;
}
const selectClass =
  'h-10 rounded-xl border border-input bg-slate-50 px-3 text-xs font-medium text-slate-700 focus-visible:outline-2 focus-visible:outline-primary';

export function AdminJlptExamFilters({ params, search, onSearch, onFilters, onReset }: Props) {
  return (
    <DataTableToolbar
      searchValue={search}
      onSearchChange={onSearch}
      searchPlaceholder="Tìm theo tiêu đề hoặc mô tả…"
      onReset={onReset}
    >
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        Cấp độ JLPT
        <select
          value={params.level ?? ''}
          className={selectClass}
          onChange={(e) => {
            const level = e.target.value;
            if (!level) onFilters({ level: undefined });
            else if (
              level === 'N1' ||
              level === 'N2' ||
              level === 'N3' ||
              level === 'N4' ||
              level === 'N5'
            )
              onFilters({ level });
          }}
        >
          <option value="">Tất cả cấp độ</option>
          {adminJlptLevels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        Trạng thái
        <select
          value={params.status ?? ''}
          className={selectClass}
          onChange={(e) => {
            const status = e.target.value;
            if (!status) onFilters({ status: undefined });
            else if (status === 'DRAFT' || status === 'PUBLISHED' || status === 'ARCHIVED')
              onFilters({ status });
          }}
        >
          <option value="">Đang hoạt động (nháp và xuất bản)</option>
          <option value="PUBLISHED">Đã xuất bản</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="ARCHIVED">Đã lưu trữ</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        Số đề mỗi trang
        <select
          value={params.size}
          className={selectClass}
          onChange={(e) => onFilters({ size: Number(e.target.value) })}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((size) => (
            <option value={size} key={size}>
              {size} đề
            </option>
          ))}
        </select>
      </label>
    </DataTableToolbar>
  );
}
