const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const date = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

export function formatCoursePrice(value: number | null) {
  return value === null || !Number.isFinite(value) ? 'Chưa có giá' : currency.format(value);
}

export function formatCourseDate(value: string | null) {
  if (!value) return 'Chưa có dữ liệu';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Chưa có dữ liệu' : date.format(parsed);
}
