import type { ApiResponse } from '@/types/api';
import type { PageResponse } from '@/types/pagination';

export const BANK_TRANSFER_PAYMENT_METHOD = 'BANK_TRANSFER' as const;

export interface CreateOrderRequest {
  cartItemIds: number[];
  paymentMethod: typeof BANK_TRANSFER_PAYMENT_METHOD;
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
  status: string;
  paymentStatus: string;
  paymentMethod: typeof BANK_TRANSFER_PAYMENT_METHOD;
  createdAt: string;
  confirmedAt: string | null;
  paidAt: string | null;
  checkoutUrl: string | null;
  checkoutFields: Record<string, string> | null;
}

export type CreateOrderResponse = ApiResponse<Order>;

export interface AdminOrderQuery {
  page: number;
  size: number;
  search?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  paymentStatus?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  sortKey?: 'createdAt';
  sortType?: 'ASC' | 'DESC';
}

export type GetAdminOrdersResponse = ApiResponse<PageResponse<Order>>;
