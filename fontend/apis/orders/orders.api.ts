import authorizeAxiosInstance from '@/lib/authorize-axios';
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  GetAdminOrdersParams,
  GetAdminOrdersResponse,
} from './orders.type';

async function create(data: CreateOrderRequest) {
  const response = await authorizeAxiosInstance.post<CreateOrderResponse>('/orders', data, {
    localErrorHandling: true,
  });
  return response.data.data;
}

async function getAdminOrders(
  { page, size = 10, search, status, paymentStatus, sortKey, sortType }: GetAdminOrdersParams,
  signal?: AbortSignal,
) {
  const normalizedSearch = search?.trim();
  const response = await authorizeAxiosInstance.get<GetAdminOrdersResponse>('/admin/orders', {
    params: {
      page: Math.max(0, page - 1),
      size: Math.min(12, Math.max(1, size)),
      ...(normalizedSearch ? { search: normalizedSearch } : {}),
      ...(status ? { status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      sortKey,
      sortType,
    },
    signal,
    localErrorHandling: true,
  });
  return response.data.data;
}

export const ordersAPI = { create, getAdminOrders };
