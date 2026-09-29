'use client';

import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/management/header/Header';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { StatCard } from '@/components/common/stats/StatCard';
import { DataTableToolbar } from '@/components/common/table/DataTableToolbar';
import { DataTableReset } from '@/components/common/table/search-bar/DataTableReset';
import { DataTablePagination } from '@/components/common/table/DataTablePagination';
import { orderList } from '../data/orders.mock';
import {
  filterOrders,
  orderStatuses,
  parseOrderStatus,
  parsePaymentStatus,
  paymentStatuses,
} from '../utils/order-list';
import { OrdersTable } from './OrdersTable';

const pageSize = 10;
const selectClassName =
  'h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 focus-visible:outline-2 focus-visible:outline-sky-500';

export default function OrdersPage() {
  const params = useSearchParams();
  const search = params.get('search') ?? '';
  const status = parseOrderStatus(params.get('status'));
  const paymentStatus = parsePaymentStatus(params.get('payment_status'));
  const filteredOrders = filterOrders(orderList, search, status, paymentStatus);
  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const requestedPage = Number(params.get('page'));
  const page = Math.min(
    Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    Math.max(totalPages, 1),
  );
  const offset = (page - 1) * pageSize;
  const visibleOrders = filteredOrders.slice(offset, offset + pageSize);

  function updateParams(updates: Record<string, string | null>, replace = false) {
    // Native history keeps filtering local and integrates with useSearchParams.
    const url = new URL(window.location.href);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'all') url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    });
    const href = `${url.pathname}${url.search}${url.hash}`;
    if (replace) window.history.replaceState(null, '', href);
    else window.history.pushState(null, '', href);
  }

  function resetFilters() {
    updateParams({ search: null, status: null, payment_status: null, page: null });
  }

  return (
    <>
      <Header
        title="Đơn hàng"
        description="Danh sách đơn hàng minh họa — dữ liệu giả, chỉ dùng để xem thử giao diện."
        breadcrumbs={<span className="text-xs text-slate-500">Admin / Đơn hàng</span>}
        showProfile={false}
      />
      <StatCard
        items={[
          { label: 'Tổng đơn hàng', value: orderList.length, description: 'Toàn bộ dữ liệu mẫu' },
          ...Object.entries(orderStatuses).map(([key, value]) => ({
            label: value.label,
            value: orderList.filter((order) => order.status === key).length,
            description: 'Toàn bộ dữ liệu mẫu',
            descriptionClassName: value.className,
          })),
        ]}
      />
      <PageSection>
        <DataTableToolbar
          searchValue={search}
          onSearchChange={(value) => updateParams({ search: value, page: null }, true)}
          searchPlaceholder="Tìm mã đơn, tên hoặc ID người đặt…"
          showReset={false}
        >
          <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
            Trạng thái đơn
            <select
              value={status}
              onChange={(event) => updateParams({ status: event.target.value, page: null })}
              className={selectClassName}
            >
              <option value="all">Tất cả trạng thái đơn</option>
              {Object.entries(orderStatuses).map(([value, item]) => (
                <option key={value} value={value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-44 flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
            Trạng thái thanh toán
            <select
              value={paymentStatus}
              onChange={(event) => updateParams({ payment_status: event.target.value, page: null })}
              className={selectClassName}
            >
              <option value="all">Tất cả thanh toán</option>
              {Object.entries(paymentStatuses).map(([value, item]) => (
                <option key={value} value={value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <DataTableReset onReset={resetFilters} label="Xóa bộ lọc" />
        </DataTableToolbar>
        <OrdersTable orders={visibleOrders} onReset={resetFilters} />
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-5 text-xs font-medium text-slate-500 sm:flex-row">
          <p aria-live="polite">
            Hiển thị {visibleOrders.length ? offset + 1 : 0}–{offset + visibleOrders.length} /{' '}
            {filteredOrders.length} đơn hàng
          </p>
          {totalPages > 0 && (
            <nav aria-label="Phân trang đơn hàng" className="[&>div]:border-0 [&>div]:pt-0">
              <DataTablePagination
                page={page}
                totalPages={totalPages}
                onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
              />
            </nav>
          )}
        </div>
      </PageSection>
    </>
  );
}
