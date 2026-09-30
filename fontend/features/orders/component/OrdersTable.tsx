import type { Order } from '@/apis/orders/orders.type';
import { IsLoading } from '@/components/common/loading/IsLoading';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getOrderStatusMeta,
  getPaymentMethodLabel,
  getPaymentStatusMeta,
  orderCurrency,
  orderDate,
} from '../utils/order-list';

interface OrdersTableProps {
  orders: readonly Order[];
  onReset: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function OrdersTable({
  orders,
  onReset,
  isLoading = false,
  error,
  onRetry,
}: OrdersTableProps) {
  return (
    <div>
      <p className="mb-3 text-xs text-slate-500">
        Ngày tạo theo giờ Việt Nam (UTC+7).{' '}
        <span className="lg:hidden">Vuốt ngang bảng để xem đủ thông tin.</span>
      </p>
      <div
        className="min-w-0 overflow-x-auto rounded-2xl border border-slate-100 focus-visible:outline-2 focus-visible:outline-sky-500 [&>div[data-slot=table-container]]:overflow-visible"
        role="region"
        aria-label="Bảng đơn hàng có thể cuộn ngang"
        tabIndex={0}
      >
        <Table aria-label="Danh sách đơn hàng" className="min-w-[1050px]">
          <TableHeader className="bg-slate-50">
            <TableRow>
              {[
                'Mã đơn hàng',
                'Khóa học',
                'Tổng tiền',
                'Trạng thái đơn',
                'Phương thức thanh toán',
                'Trạng thái thanh toán',
                'Ngày tạo',
              ].map((label) => (
                <TableHead
                  scope="col"
                  key={label}
                  className={`px-4 text-xs font-semibold text-slate-500 ${label === 'Tổng tiền' ? 'text-right' : ''}`}
                >
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody aria-busy={isLoading}>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-44">
                  <IsLoading size={28} />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="h-44 text-center">
                  <div role="alert" className="space-y-3 text-sm text-rose-600">
                    <p>{error}</p>
                    <Button type="button" variant="outline" onClick={onRetry}>
                      Thử lại
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-44 text-center">
                  <div role="status">
                    <p className="text-sm font-semibold text-slate-800">
                      Không tìm thấy đơn hàng phù hợp
                    </p>
                    <p className="mb-4 mt-1 text-xs text-slate-500">
                      Thử từ khóa khác hoặc xóa bộ lọc để xem tất cả đơn hàng.
                    </p>
                    <Button type="button" variant="outline" onClick={onReset}>
                      Xóa bộ lọc
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const orderStatus = getOrderStatusMeta(order.status);
                const paymentStatus = getPaymentStatusMeta(order.paymentStatus);

                return (
                  <TableRow key={order.id} className="h-16 border-slate-100 hover:bg-slate-50/70">
                    <TableCell className="px-4 font-semibold text-slate-900">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell className="px-4">
                      {order.items.length > 0 ? (
                        <ul className="min-w-56 space-y-1">
                          {order.items.map((item) => (
                            <li key={item.id} className="leading-5 text-slate-700">
                              {item.courseTitle}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400">Chưa có thông tin khóa học</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 text-right font-semibold tabular-nums">
                      {orderCurrency.format(order.totalAmount)}
                    </TableCell>
                    <TableCell className="px-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${orderStatus.className}`}
                      >
                        {orderStatus.label}
                      </span>
                    </TableCell>
                    <TableCell className="px-4">
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </TableCell>
                    <TableCell className="px-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentStatus.className}`}
                      >
                        {paymentStatus.label}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 text-slate-500">
                      <time dateTime={order.createdAt}>
                        {orderDate.format(new Date(order.createdAt))}
                      </time>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
