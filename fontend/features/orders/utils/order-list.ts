import type { OrderListItem, OrderStatus, PaymentMethod, PaymentStatus } from '../types/order';

export const orderStatuses: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Chờ xác nhận', className: 'bg-amber-50 text-amber-800' },
  confirmed: { label: 'Đã xác nhận', className: 'bg-emerald-50 text-emerald-700' },
  cancelled: { label: 'Đã hủy', className: 'bg-rose-50 text-rose-700' },
};
export const paymentStatuses: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING: { label: 'Chờ thanh toán', className: 'bg-amber-50 text-amber-800' },
  SUCCESS: { label: 'Thành công', className: 'bg-emerald-50 text-emerald-700' },
  FAILED: { label: 'Thất bại', className: 'bg-rose-50 text-rose-700' },
  REFUNDED: { label: 'Đã hoàn tiền', className: 'bg-sky-50 text-sky-700' },
};
export const paymentMethods: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Chuyển khoản',
  VNPAY: 'VNPAY',
  MOMO: 'MoMo',
};

export function parseOrderStatus(value: string | null): OrderStatus | 'all' {
  return value === 'pending' || value === 'confirmed' || value === 'cancelled' ? value : 'all';
}

export function parsePaymentStatus(value: string | null): PaymentStatus | 'all' {
  return value === 'PENDING' || value === 'SUCCESS' || value === 'FAILED' || value === 'REFUNDED'
    ? value
    : 'all';
}

function normalizeSearch(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function filterOrders(
  orders: readonly OrderListItem[],
  search: string,
  status: OrderStatus | 'all',
  paymentStatus: PaymentStatus | 'all',
) {
  const query = normalizeSearch(search);
  return orders
    .filter(
      (order) =>
        (status === 'all' || order.status === status) &&
        (paymentStatus === 'all' || order.payment_status === paymentStatus) &&
        normalizeSearch(`${order.order_number} ${order.customer_name} ${order.user_id}`).includes(
          query,
        ),
    )
    .sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export const orderCurrency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
export const orderDate = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
});
