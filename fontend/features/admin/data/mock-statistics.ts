import type { StatCardItemProps } from '@/components/common/stats/StatCardItem';

// Deliberately independent of list queries, their filters and pagination.
export const adminMockStatistics = {
  courses: [
    { label: 'Tổng khóa học', value: 62, description: 'Danh sách khóa học' },
    { label: 'Đã xuất bản', value: 54, description: 'Sẵn sàng cho học viên', valueClassName: 'text-emerald-700' },
    { label: 'Bản nháp', value: 8, description: 'Đang chuẩn bị', valueClassName: 'text-amber-800' },
    { label: 'Tổng bài học', value: 428, description: 'Nội dung giảng dạy', valueClassName: 'text-indigo-700' },
  ],
  categories: [
    { label: 'Tổng danh mục', value: 8, description: 'Kỹ năng tiếng Nhật' },
    { label: 'Khóa học liên kết', value: 62, description: 'Lộ trình N5 đến N1' },
    { label: 'Tổng bài học', value: 428, description: 'Nội dung giảng dạy' },
    { label: 'Tỷ lệ xuất bản', value: 0.871, formatOptions: { style: 'percent', maximumFractionDigits: 1 }, description: 'Khóa học sẵn sàng' },
  ],
  orders: [
    { label: 'Tổng đơn hàng', value: 1250, description: 'Tất cả đơn hàng' },
    { label: 'Chờ xác nhận', value: 38, description: 'Cần xử lý', valueClassName: 'text-amber-800' },
    { label: 'Đã xác nhận', value: 1184, description: 'Đã hoàn tất', valueClassName: 'text-emerald-700' },
    { label: 'Đã hủy', value: 28, description: 'Đơn hàng đã hủy', valueClassName: 'text-rose-700' },
  ],
} satisfies Record<'courses' | 'categories' | 'orders', readonly StatCardItemProps[]>;
