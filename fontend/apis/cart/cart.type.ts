import type { ApiResponse } from '@/types/api';

export interface CartItem {
  id: number;
  courseId: number;
  courseTitle: string;
  price: number | null;
  thumbnailUrl: string | null;
}

export interface Cart {
  id: number | null;
  items: CartItem[];
  totalAmount: number;
}

export type GetCartResponse = ApiResponse<Cart>;

export interface AddCourseToCartVariables {
  courseId: number;
}
