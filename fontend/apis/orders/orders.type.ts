import type { ApiResponse } from '@/types/api';
import type { PageResponse } from '@/types/pagination';
import type { QueryParams } from '@/types/query';

export const BANK_TRANSFER_PAYMENT_METHOD = 'BANK_TRANSFER' as const;

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = typeof BANK_TRANSFER_PAYMENT_METHOD;

export interface CreateOrderRequest {
  cartItemIds: number[];
  paymentMethod: PaymentMethod;
}

export interface OrderItem {
  id: number;
  courseId: number;
  courseTitle: string;
  thumbnailUrl: string | null;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  confirmedAt: string | null;
  paidAt: string | null;
  checkoutUrl: string | null;
  checkoutFields: Record<string, string> | null;
}

export type CreateOrderResponse = ApiResponse<Order>;

export interface GetAdminOrdersParams extends QueryParams {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  sortKey: 'createdAt';
  sortType: 'DESC';
}

export type GetAdminOrdersResponse = ApiResponse<PageResponse<Order>>;
