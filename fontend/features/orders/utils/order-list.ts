import type { GetAdminOrdersParams, OrderStatus, PaymentStatus } from '@/apis/orders/orders.type';

interface StatusMeta {
  label: string;
  className: string;
}

export const ORDER_PAGE_SIZE = 10;

export const orderStatusOptions: ReadonlyArray<{ value: OrderStatus; label: string }> = [
  { value: 'PENDING', label: 'Chờ xác nhận' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

export const paymentStatusOptions: ReadonlyArray<{ value: PaymentStatus; label: string }> = [
  { value: 'PENDING', label: 'Chờ thanh toán' },
  { value: 'SUCCESS', label: 'Thành công' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền' },
];

const unknownStatus: StatusMeta = {
  label: 'Không xác định',
  className: 'bg-slate-100 text-slate-700',
};

const orderStatuses: Readonly<Record<string, StatusMeta>> = {
  PENDING: { label: 'Chờ xác nhận', className: 'bg-amber-50 text-amber-800' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-rose-50 text-rose-700' },
};

const paymentStatuses: Readonly<Record<string, StatusMeta>> = {
  PENDING: { label: 'Chờ thanh toán', className: 'bg-amber-50 text-amber-800' },
  SUCCESS: { label: 'Thành công', className: 'bg-emerald-50 text-emerald-700' },
  FAILED: { label: 'Thất bại', className: 'bg-rose-50 text-rose-700' },
  REFUNDED: { label: 'Đã hoàn tiền', className: 'bg-sky-50 text-sky-700' },
};

const paymentMethods: Readonly<Record<string, string>> = {
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
};

export function getOrderStatusMeta(value: string): StatusMeta {
  return orderStatuses[value] ?? unknownStatus;
}

export function getPaymentStatusMeta(value: string): StatusMeta {
  return paymentStatuses[value] ?? unknownStatus;
}

export function getPaymentMethodLabel(value: string): string {
  return paymentMethods[value] ?? value.replaceAll('_', ' ');
}

export function parseOrderStatus(value: string | null): OrderStatus | undefined {
  return value === 'PENDING' || value === 'CONFIRMED' || value === 'CANCELLED' ? value : undefined;
}

export function parsePaymentStatus(value: string | null): PaymentStatus | undefined {
  return value === 'PENDING' || value === 'SUCCESS' || value === 'FAILED' || value === 'REFUNDED'
    ? value
    : undefined;
}

export function parseOrderPage(value: string | null): { page: number; isValid: boolean } {
  if (value === null) return { page: 1, isValid: true };
  if (!/^[1-9]\d*$/.test(value)) return { page: 1, isValid: false };
  const page = Number(value);
  return Number.isSafeInteger(page) ? { page, isValid: true } : { page: 1, isValid: false };
}

export function buildOrderListParams(
  page: number,
  search: string,
  status?: OrderStatus,
  paymentStatus?: PaymentStatus,
): GetAdminOrdersParams {
  return {
    page,
    size: ORDER_PAGE_SIZE,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(status ? { status } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    sortKey: 'createdAt',
    sortType: 'DESC',
  };
}

export function buildOrderStatisticParams(status?: OrderStatus): GetAdminOrdersParams {
  return {
    ...buildOrderListParams(1, '', status),
    size: 1,
  };
}

export const orderCurrency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

export const orderDate = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
});
