import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { OrderListItem } from '../types/order';
import {
  orderCurrency,
  orderDate,
  orderStatuses,
  paymentMethods,
  paymentStatuses,
} from '../utils/order-list';

export function OrdersTable({
  orders,
  onReset,
}: {
  orders: readonly OrderListItem[];
  onReset: () => void;
}) {
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
                'Người đặt hàng',
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
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="h-16 border-slate-100 hover:bg-slate-50/70">
                <TableCell className="px-4 font-semibold text-slate-900">
                  {order.order_number}
                </TableCell>
                <TableCell className="px-4">{order.customer_name}</TableCell>
                <TableCell className="px-4 text-right font-semibold tabular-nums">
                  {orderCurrency.format(order.total_amount)}
                </TableCell>
                <TableCell className="px-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${orderStatuses[order.status].className}`}
                  >
                    {orderStatuses[order.status].label}
                  </span>
                </TableCell>
                <TableCell className="px-4">{paymentMethods[order.payment_method]}</TableCell>
                <TableCell className="px-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentStatuses[order.payment_status].className}`}
                  >
                    {paymentStatuses[order.payment_status].label}
                  </span>
                </TableCell>
                <TableCell className="px-4 text-slate-500">
                  <time dateTime={order.created_at}>
                    {orderDate.format(new Date(order.created_at))}
                  </time>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {orders.length === 0 && (
          <div className="px-4 py-12 text-center" role="status">
            <p className="text-sm font-semibold text-slate-800">Không tìm thấy đơn hàng phù hợp</p>
            <p className="mb-4 mt-1 text-xs text-slate-500">
              Thử từ khóa khác hoặc xóa bộ lọc để xem tất cả đơn hàng.
            </p>
            <Button variant="outline" onClick={onReset}>
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
