import { Suspense } from 'react';
import { IsLoading } from '@/components/common/loading/IsLoading';
import OrdersPage from '@/features/orders/component/OrdersPage';

export default function Page() {
  return (
    <Suspense fallback={<IsLoading />}>
      <OrdersPage />
    </Suspense>
  );
}
