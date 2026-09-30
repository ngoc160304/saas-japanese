import authorizeAxiosInstance from '@/lib/authorize-axios';
import type { AddCourseToCartVariables, GetCartResponse } from './cart.type';

async function getCurrent() {
  const response = await authorizeAxiosInstance.get<GetCartResponse>('/cart', {
    localErrorHandling: true,
  });
  return response.data.data;
}

async function deleteItem(cartItemId: number) {
  await authorizeAxiosInstance.delete<string>(`/cart/items/${cartItemId}`, {
    localErrorHandling: true,
  });
}

export const cartQueryKeys = {
  all: ['cart'] as const,
  detail: ['cart', 'detail'] as const,
};

async function addCourse({ courseId }: AddCourseToCartVariables) {
  const response = await authorizeAxiosInstance.post<GetCartResponse>(
    `/cart/add/${courseId}`,
    undefined,
    {
      localErrorHandling: true,
    },
  );
  return response.data.data;
}

export const cartAPI = { getCurrent, deleteItem, addCourse };
