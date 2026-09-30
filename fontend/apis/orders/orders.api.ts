import authorizeAxiosInstance from '@/lib/authorize-axios';
import type { CreateOrderRequest, CreateOrderResponse } from './orders.type';

async function create(data: CreateOrderRequest) {
  const response = await authorizeAxiosInstance.post<CreateOrderResponse>('/orders', data, {
    localErrorHandling: true,
  });
  return response.data.data;
}

export const ordersAPI = { create };
