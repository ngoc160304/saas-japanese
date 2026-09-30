'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/management/header/Header';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { StatCard } from '@/components/common/stats/StatCard';
import { DataTableToolbar } from '@/components/common/table/DataTableToolbar';
import { DataTableReset } from '@/components/common/table/search-bar/DataTableReset';
import { DataTablePagination } from '@/components/common/table/DataTablePagination';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersAPI } from '@/apis/orders/orders.api';
import type { AdminOrderQuery } from '@/apis/orders/orders.type';
import { Button } from '@/components/ui/button';
import { IsLoading } from '@/components/common/loading/IsLoading';
import { getApiErrorMessage } from '@/lib/api-error';
import {
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
  const requestedPage = Number(params.get('page'));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const apiStatus: AdminOrderQuery['status'] =
    status === 'pending'
      ? 'PENDING'
      : status === 'confirmed'
        ? 'CONFIRMED'
        : status === 'cancelled'
          ? 'CANCELLED'
          : undefined;
  const query: AdminOrderQuery = {
    page: page - 1,
    size: pageSize,
    search,
    status: apiStatus,
    paymentStatus: paymentStatus === 'all' ? undefined : paymentStatus,
    sortKey: 'createdAt',
    sortType: 'DESC',
  };
  const queryClient = useQueryClient();
  const ordersQuery = useQuery({
    queryKey: ['admin-orders', 'list', query],
    queryFn: ({ signal }) => ordersAPI.getAdminOrders(query, signal),
    retry: false,
  });
  // The endpoint has no statistics DTO. Fetch totals using one record per status,
  // without downloading all orders or counting only the current page.
  const countStatuses = [undefined, 'PENDING', 'CONFIRMED', 'CANCELLED'] as const;
  const counts = useQueries({
    queries: countStatuses.map((status) => ({
      queryKey: ['admin-orders', 'count', status ?? 'all'],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        ordersAPI.getAdminOrders({ page: 0, size: 1, status }, signal),
      retry: false,
    })),
  });
  const visibleOrders = ordersQuery.data?.content ?? [];
  const totalPages = ordersQuery.data?.totalPages ?? 0;
  const totalElements = ordersQuery.data?.totalElements ?? 0;
  const offset = (ordersQuery.data?.number ?? page - 1) * pageSize;
  useEffect(() => {
    if (!ordersQuery.data) return;
    const lastPage = Math.max(ordersQuery.data.totalPages, 1);
    if (page <= lastPage) return;
    const url = new URL(window.location.href);
    url.searchParams.set('page', String(lastPage));
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, [ordersQuery.data, page]);

  function refreshOrders() {
    void queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
  }

  function updateParams(updates: Record<string, string | null>, replace = false) {
    // Native history integrates with useSearchParams and the query cache.
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
        description="Quản lý đơn hàng và trạng thái thanh toán."
        breadcrumbs={<span className="text-xs text-slate-500">Admin / Đơn hàng</span>}
        showProfile={false}
      />
      <StatCard
        items={[
          {
            label: 'Tổng đơn hàng',
            value: counts[0].isError ? '—' : (counts[0].data?.totalElements ?? '…'),
            description: 'Toàn bộ đơn hàng',
          },
          ...Object.values(orderStatuses).map((value, index) => ({
            label: value.label,
            value: counts[index + 1].isError ? '—' : (counts[index + 1].data?.totalElements ?? '…'),
            description: 'Toàn bộ đơn hàng',
            descriptionClassName: value.className,
          })),
        ]}
      />
      {counts.some((count) => count.isError) && (
        <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 text-sm text-rose-700">
          Không tải được một số thống kê đơn hàng.
          <Button variant="outline" onClick={refreshOrders}>
            Thử lại
          </Button>
        </div>
      )}
      <PageSection>
        <DataTableToolbar
          searchValue={search}
          onSearchChange={(value) => updateParams({ search: value, page: null }, true)}
          searchPlaceholder="Tìm mã đơn, mã giao dịch, email hoặc tên đăng nhập…"
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
        {ordersQuery.isPending ? (
          <IsLoading className="py-12" />
        ) : ordersQuery.isError ? (
          <div role="alert" className="space-y-3 py-8 text-center">
            <p className="text-sm text-rose-700">{getApiErrorMessage(ordersQuery.error)}</p>
            <Button variant="outline" onClick={() => void ordersQuery.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : (
          <>
            {ordersQuery.isFetching && (
              <p role="status" className="mb-3 text-xs text-slate-500">
                Đang cập nhật đơn hàng…
              </p>
            )}
            <OrdersTable orders={visibleOrders} onReset={resetFilters} />
          </>
        )}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-5 text-xs font-medium text-slate-500 sm:flex-row">
          {!ordersQuery.isPending && !ordersQuery.isError && (
            <p aria-live="polite">
              Hiển thị {visibleOrders.length ? offset + 1 : 0}–{offset + visibleOrders.length} /{' '}
              {totalElements} đơn hàng
            </p>
          )}
          {!ordersQuery.isError && !ordersQuery.isPending && totalPages > 0 && (
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
