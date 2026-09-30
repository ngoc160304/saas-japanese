import authorizeAxiosInstance from '@/lib/authorize-axios';
import type {
  AdminOrderQuery,
  CreateOrderRequest,
  CreateOrderResponse,
  GetAdminOrdersResponse,
} from './orders.type';

async function getAdminOrders(params: AdminOrderQuery, signal?: AbortSignal) {
  const response = await authorizeAxiosInstance.get<GetAdminOrdersResponse>('/admin/orders', {
    params: { ...params, search: params.search?.trim() || undefined },
    signal,
    localErrorHandling: true,
  });
  return response.data.data;
}

async function create(data: CreateOrderRequest) {
  const response = await authorizeAxiosInstance.post<CreateOrderResponse>('/orders', data, {
    localErrorHandling: true,
  });
  return response.data.data;
}

export const ordersAPI = { create, getAdminOrders };
