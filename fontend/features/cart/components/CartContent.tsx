'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { BookOpen, LoaderCircle, ShieldCheck, Trash2 } from 'lucide-react';
import type { Cart, CartItem } from '@/apis/cart/cart.type';
import { formatCoursePrice } from '@/features/course/utils/course-format';

export type CartCheckoutStatus = 'idle' | 'creating-order' | 'submitting-payment';

interface CartContentProps {
  cart: Cart;
  pendingItemId: number | null;
  selectedCartItemIds: readonly number[];
  selectedTotal: number;
  checkoutStatus: CartCheckoutStatus;
  checkoutDisabled: boolean;
  selectionLocked: boolean;
  onItemSelectionChange: (cartItemId: number, selected: boolean) => void;
  onSelectAllChange: (selected: boolean) => void;
  onCheckout: () => void;
  onRemove: (cartItemId: number) => void;
}

function CartSelectionCheckbox({
  checked,
  indeterminate = false,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  const checkboxRef = useCallback(
    (element: HTMLInputElement | null) => {
      if (element) element.indeterminate = indeterminate;
    },
    [indeterminate],
  );

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label={label}
      aria-checked={indeterminate ? 'mixed' : checked}
      onChange={(event) => onChange(event.currentTarget.checked)}
      className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}

function CartItemThumbnail({ item }: { item: CartItem }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = item.thumbnailUrl && item.thumbnailUrl !== failedUrl;

  return (
    <div className="relative flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 sm:h-22 sm:w-28">
      {showImage ? (
        // Backend media URLs are remote and do not require the Next image optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnailUrl ?? undefined}
          alt={`Ảnh khóa học ${item.courseTitle}`}
          width={112}
          height={88}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailedUrl(item.thumbnailUrl)}
        />
      ) : (
        <>
          <span
            className="pointer-events-none absolute inset-0 flex select-none items-center justify-center text-3xl font-extrabold text-slate-200 sm:text-4xl"
            aria-hidden="true"
          >
            日本語
          </span>
          <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-brand-navy shadow-xs">
            <BookOpen className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="sr-only">Khóa học chưa có ảnh</span>
        </>
      )}
    </div>
  );
}

function CartItemRow({
  item,
  selected,
  selectionLocked,
  removing,
  removalPending,
  onSelectionChange,
  onRemove,
}: {
  item: CartItem;
  selected: boolean;
  selectionLocked: boolean;
  removing: boolean;
  removalPending: boolean;
  onSelectionChange: (cartItemId: number, selected: boolean) => void;
  onRemove: (cartItemId: number) => void;
}) {
  return (
    <article className="flex flex-col items-start justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
      <div className="flex min-w-0 flex-grow items-start gap-4 sm:items-center">
        <CartSelectionCheckbox
          checked={selected}
          disabled={selectionLocked}
          label={`Chọn ${item.courseTitle} (mục ${item.id}) để thanh toán`}
          onChange={(checked) => onSelectionChange(item.id, checked)}
        />
        <div className="flex min-w-0 flex-grow items-start gap-4 sm:items-center">
          <CartItemThumbnail item={item} />
          <div className="min-w-0 flex-grow">
            <span className="mb-1.5 inline-block rounded border border-slate-200/60 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              Khóa học
            </span>
            <h2 className="text-base leading-snug font-bold text-slate-800 sm:text-lg">
              <Link
                href="/#courses"
                className="transition-colors hover:text-brand-blue focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                {item.courseTitle}
              </Link>
            </h2>
          </div>
        </div>
      </div>
      <div className="flex w-full shrink-0 items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:w-auto sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
        <p className="text-base font-bold text-slate-800 sm:text-lg">
          {formatCoursePrice(item.price)}
        </p>
        <button
          type="button"
          disabled={removalPending || selectionLocked}
          onClick={() => onRemove(item.id)}
          aria-label={`Xóa ${item.courseTitle} khỏi giỏ hàng`}
          className="inline-flex items-center gap-1.5 rounded text-xs font-medium text-slate-400 transition-colors hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
        >
          {removing ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{removing ? 'Đang xóa…' : 'Xóa khỏi giỏ'}</span>
        </button>
      </div>
    </article>
  );
}

export function CartContent({
  cart,
  pendingItemId,
  selectedCartItemIds,
  selectedTotal,
  checkoutStatus,
  checkoutDisabled,
  selectionLocked,
  onItemSelectionChange,
  onSelectAllChange,
  onCheckout,
  onRemove,
}: CartContentProps) {
  const count = cart.items.length;
  const selectedIds = new Set(selectedCartItemIds);
  const selectedCount = selectedCartItemIds.length;
  const allSelected = count > 0 && selectedCount === count;
  const selectionIndeterminate = selectedCount > 0 && !allSelected;
  const checkoutLabel =
    checkoutStatus === 'creating-order'
      ? 'Đang tạo đơn hàng…'
      : checkoutStatus === 'submitting-payment'
        ? 'Đang chuyển đến thanh toán…'
        : 'Tiến hành thanh toán';

  return (
    <div className="flex flex-col items-start gap-8 lg:flex-row">
      <section aria-labelledby="cart-items-title" className="w-full lg:w-2/3">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <h2 id="cart-items-title" className="text-sm font-bold text-slate-800">
                Khóa học trong giỏ
              </h2>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 has-[:disabled]:cursor-not-allowed">
                <CartSelectionCheckbox
                  checked={allSelected}
                  indeterminate={selectionIndeterminate}
                  disabled={selectionLocked}
                  label="Chọn tất cả khóa học để thanh toán"
                  onChange={onSelectAllChange}
                />
                <span>Chọn tất cả</span>
              </label>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {count} khóa học
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {cart.items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                selectionLocked={selectionLocked}
                removing={pendingItemId === item.id}
                removalPending={pendingItemId !== null}
                onSelectionChange={onItemSelectionChange}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      </section>

      <aside aria-labelledby="cart-summary-title" className="w-full lg:w-1/3">
        <div className="sticky top-28 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2
            id="cart-summary-title"
            className="border-b border-slate-100 pb-4 text-lg font-bold text-slate-800"
          >
            Tóm tắt đơn hàng
          </h2>
          <dl className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <dt>Số lượng</dt>
              <dd className="font-medium text-slate-800">{selectedCount} khóa học đã chọn</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Tạm tính</dt>
              <dd className="font-semibold text-slate-800">{formatCoursePrice(selectedTotal)}</dd>
            </div>
          </dl>
          <div className="border-t border-slate-100 pt-4">
            <div className="mb-1 flex items-baseline justify-between gap-4">
              <span className="text-base font-bold text-slate-800">Tổng cộng</span>
              <span className="text-right text-2xl font-extrabold text-brand-navy">
                {formatCoursePrice(selectedTotal)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Đã bao gồm thuế GTGT nếu có</p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              type="button"
              disabled={checkoutDisabled}
              onClick={onCheckout}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue px-4 py-3.5 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
            >
              {checkoutStatus !== 'idle' && (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              <span aria-live="polite">{checkoutLabel}</span>
            </button>
            <Link
              href="/#courses"
              className="block w-full rounded py-2 text-center text-xs font-semibold text-slate-500 transition-colors hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              ← Tiếp tục xem khóa học
            </Link>
          </div>
          <div className="flex items-center justify-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
            <span>Thanh toán an toàn &amp; bảo mật</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
