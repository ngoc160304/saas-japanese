'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { ordersAPI } from '@/apis/orders/orders.api';
import { adminMockStatistics } from '@/features/admin/data/mock-statistics';
import { StatCard } from '@/components/common/stats/StatCard';
import { DataTablePagination } from '@/components/common/table/DataTablePagination';
import { DataTableToolbar } from '@/components/common/table/DataTableToolbar';
import { DataTableReset } from '@/components/common/table/search-bar/DataTableReset';
import Header from '@/components/layout/management/header/Header';
import PageSection from '@/components/layout/management/page-section/PageSection';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  buildOrderListParams,
  orderStatusOptions,
  parseOrderPage,
  parseOrderStatus,
  parsePaymentStatus,
  paymentStatusOptions,
} from '../utils/order-list';
import { OrdersTable } from './OrdersTable';

const selectClassName =
  'h-10 w-full rounded-2xl border border-input bg-slate-50 px-3 text-xs text-slate-700 focus-visible:outline-2 focus-visible:outline-sky-500';

export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const search = params.get('search') ?? '';
  const rawStatus = params.get('status');
  const rawPaymentStatus = params.get('payment_status');
  const status = parseOrderStatus(rawStatus);
  const paymentStatus = parsePaymentStatus(rawPaymentStatus);
  const parsedPage = parseOrderPage(params.get('page'));
  const page = parsedPage.page;
  const listParams = buildOrderListParams(page, search, status, paymentStatus);

  const ordersQuery = useQuery({
    queryKey: ['admin-orders', 'list', listParams],
    queryFn: ({ signal }) => ordersAPI.getAdminOrders(listParams, signal),
  });

  const updateParams = useCallback(
    (updates: Record<string, string | null>, replace = false) => {
      const nextParams = new URLSearchParams(params.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === 'all' || (key === 'page' && value === '1')) {
          nextParams.delete(key);
        } else {
          nextParams.set(key, value);
        }
      });
      const query = nextParams.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      if (replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [params, pathname, router],
  );

  useEffect(() => {
    const invalidUpdates: Record<string, string | null> = {};
    if (!parsedPage.isValid) invalidUpdates.page = null;
    if (rawStatus !== null && !status) invalidUpdates.status = null;
    if (rawPaymentStatus !== null && !paymentStatus) invalidUpdates.payment_status = null;
    if (Object.keys(invalidUpdates).length > 0) updateParams(invalidUpdates, true);
  }, [parsedPage.isValid, paymentStatus, rawPaymentStatus, rawStatus, status, updateParams]);

  useEffect(() => {
    if (!ordersQuery.data || ordersQuery.isError) return;
    const lastAvailablePage = Math.max(ordersQuery.data.totalPages, 1);
    if (page > lastAvailablePage) {
      updateParams({ page: lastAvailablePage === 1 ? null : String(lastAvailablePage) }, true);
    }
  }, [ordersQuery.data, ordersQuery.isError, page, updateParams]);

  function resetFilters() {
    updateParams({ search: null, status: null, payment_status: null, page: null });
  }

  const listData = ordersQuery.data;
  const lastAvailablePage = Math.max(listData?.totalPages ?? 1, 1);
  const isCorrectingPage = Boolean(listData && page > lastAvailablePage);
  const offset = listData ? listData.number * listData.size : 0;

  return (
    <>
      <Header
        title="Đơn hàng"
        description="Theo dõi đơn hàng, trạng thái xác nhận và thanh toán khóa học."
        breadcrumbs={<span className="text-xs text-slate-500">Admin / Đơn hàng</span>}
        showProfile={false}
      />

      <StatCard items={adminMockStatistics.orders} isMock />

      <PageSection>
        <DataTableToolbar
          searchValue={search}
          onSearchChange={(value) => updateParams({ search: value, page: null }, true)}
          searchPlaceholder="Tìm mã đơn hoặc thông tin tài khoản…"
          showReset={false}
        >
          <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
            Trạng thái đơn
            <select
              value={status ?? 'all'}
              onChange={(event) => updateParams({ status: event.target.value, page: null })}
              className={selectClassName}
            >
              <option value="all">Tất cả trạng thái đơn</option>
              {orderStatusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-44 flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
            Trạng thái thanh toán
            <select
              value={paymentStatus ?? 'all'}
              onChange={(event) => updateParams({ payment_status: event.target.value, page: null })}
              className={selectClassName}
            >
              <option value="all">Tất cả thanh toán</option>
              {paymentStatusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <DataTableReset onReset={resetFilters} label="Xóa bộ lọc" />
        </DataTableToolbar>

        <OrdersTable
          orders={listData?.content ?? []}
          onReset={resetFilters}
          isLoading={
            ordersQuery.isPending ||
            isCorrectingPage ||
            (ordersQuery.isFetching && ordersQuery.isError)
          }
          error={
            ordersQuery.isError && !ordersQuery.isFetching
              ? getApiErrorMessage(ordersQuery.error)
              : null
          }
          onRetry={() => void ordersQuery.refetch()}
        />

        {listData && !ordersQuery.isError && !isCorrectingPage && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-5 text-xs font-medium text-slate-500 sm:flex-row">
            <p aria-live="polite">
              Hiển thị {listData.content.length ? offset + 1 : 0}–
              {offset + listData.numberOfElements} / {listData.totalElements} đơn hàng
            </p>
            {listData.totalPages > 0 && (
              <nav aria-label="Phân trang đơn hàng" className="[&>div]:border-0 [&>div]:pt-0">
                <DataTablePagination
                  page={listData.number + 1}
                  totalPages={listData.totalPages}
                  onPageChange={(nextPage) => updateParams({ page: String(nextPage) })}
                />
              </nav>
            )}
          </div>
        )}
      </PageSection>
    </>
  );
}
