import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Order } from '@/apis/orders/orders.type';
import {
  orderCurrency,
  orderDate,
  orderStatuses,
  paymentMethods,
  paymentStatuses,
} from '../utils/order-list';

const orderStatusLabels: Record<string, { label: string; className: string }> = orderStatuses;
const paymentStatusLabels: Record<string, { label: string; className: string }> = paymentStatuses;
const paymentMethodLabels: Record<string, string> = paymentMethods;

export function OrdersTable({
  orders,
  onReset,
}: {
  orders: readonly Order[];
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
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="h-16 border-slate-100 hover:bg-slate-50/70">
                <TableCell className="px-4 font-semibold text-slate-900">
                  {order.orderNumber}
                </TableCell>
                <TableCell className="px-4">
                  {order.items.length
                    ? order.items.map((item) => item.courseTitle).join(', ')
                    : '—'}
                </TableCell>
                <TableCell className="px-4 text-right font-semibold tabular-nums">
                  {orderCurrency.format(order.totalAmount)}
                </TableCell>
                <TableCell className="px-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${orderStatusLabels[order.status.toLowerCase()]?.className ?? 'bg-slate-100 text-slate-700'}`}
                  >
                    {orderStatusLabels[order.status.toLowerCase()]?.label ?? order.status}
                  </span>
                </TableCell>
                <TableCell className="px-4">
                  {paymentMethodLabels[order.paymentMethod] ?? order.paymentMethod}
                </TableCell>
                <TableCell className="px-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentStatusLabels[order.paymentStatus]?.className ?? 'bg-slate-100 text-slate-700'}`}
                  >
                    {paymentStatusLabels[order.paymentStatus]?.label ?? order.paymentStatus}
                  </span>
                </TableCell>
                <TableCell className="px-4 text-slate-500">
                  <time dateTime={order.createdAt}>
                    {orderDate.format(new Date(order.createdAt))}
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
