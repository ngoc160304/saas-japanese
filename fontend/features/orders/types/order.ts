export type OrderStatus = 'pending' | 'confirmed' | 'cancelled';
export type PaymentMethod = 'BANK_TRANSFER' | 'VNPAY' | 'MOMO';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

// List projection of orders; timestamps use ISO 8601, amounts are in VND.
export interface Order {
  id: number;
  user_id: number;
  order_number: string;
  total_amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  created_at: string;
}

export interface OrderUser {
  id: number;
  full_name: string;
}

export type OrderListItem = Order & { customer_name: string };
