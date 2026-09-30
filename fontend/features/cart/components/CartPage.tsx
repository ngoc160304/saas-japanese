'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { cartAPI, cartQueryKeys } from '@/apis/cart/cart.api';
import { ordersAPI } from '@/apis/orders/orders.api';
import { BANK_TRANSFER_PAYMENT_METHOD, type Order } from '@/apis/orders/orders.type';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  getCartItemsTotal,
  getSelectedCartItems,
  haveSameCartItemIds,
  reconcileSelectedCartItemIds,
} from '@/features/cart/utils/cart-selection';
import {
  getSePayCheckoutData,
  SePayCheckoutError,
  submitSePayCheckout,
  type SePayCheckoutData,
} from '@/features/cart/utils/sepay-checkout';
import { CartContent, type CartCheckoutStatus } from './CartContent';

interface RetainedCheckout {
  cartItemIds: number[];
  data: SePayCheckoutData;
}

function CartPageHeader({ subtitle }: { subtitle: string }) {
  return (
    <section className="border-b border-slate-200 bg-white pt-8 pb-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500">
          <ol className="flex items-center gap-2">
            <li>
              <Link
                href="/"
                className="rounded transition-colors hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                Trang chủ
              </Link>
            </li>
            <li aria-hidden="true" className="text-slate-300">
              /
            </li>
            <li className="font-semibold text-slate-800" aria-current="page">
              Giỏ hàng
            </li>
          </ol>
        </nav>
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-800 md:text-4xl">
          Giỏ hàng của bạn
        </h1>
        <p className="text-sm text-slate-500 md:text-base">{subtitle}</p>
      </div>
    </section>
  );
}

function CartLoading() {
  return (
    <div role="status" aria-label="Đang tải giỏ hàng" className="flex flex-col gap-8 lg:flex-row">
      <div className="w-full animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-soft lg:w-2/3">
        <div className="mb-8 h-5 w-40 rounded bg-slate-100" />
        <div className="flex gap-4">
          <div className="h-20 w-24 shrink-0 rounded-xl bg-slate-100 sm:w-28" />
          <div className="flex-1 space-y-3 py-1">
            <div className="h-4 w-20 rounded bg-slate-100" />
            <div className="h-5 max-w-sm rounded bg-slate-100" />
          </div>
        </div>
      </div>
      <div className="w-full animate-pulse space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft lg:w-1/3">
        <div className="h-6 w-44 rounded bg-slate-100" />
        <div className="h-px bg-slate-100" />
        <div className="h-4 rounded bg-slate-100" />
        <div className="h-11 rounded-lg bg-slate-100" />
      </div>
      <span className="sr-only">Đang tải giỏ hàng…</span>
    </div>
  );
}

function EmptyCart() {
  return (
    <section className="mx-auto my-8 max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-soft sm:p-14">
      <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <ShoppingCart className="h-8 w-8" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h2 className="mb-2 text-xl font-bold text-slate-800">Giỏ hàng của bạn đang trống</h2>
      <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-slate-500">
        Hiện tại bạn chưa có khóa học nào trong giỏ hàng. Hãy khám phá các khóa học chất lượng của
        chúng tôi.
      </p>
      <Link
        href="/#courses"
        className="inline-flex items-center justify-center rounded-lg bg-brand-navy px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        Khám phá khóa học
      </Link>
    </section>
  );
}

export function CartPage() {
  const queryClient = useQueryClient();
  const checkoutLockRef = useRef(false);
  const [checkoutStatus, setCheckoutStatus] = useState<CartCheckoutStatus>('idle');
  const [retainedCheckout, setRetainedCheckout] = useState<RetainedCheckout | null>(null);
  const cartQuery = useQuery({
    queryKey: cartQueryKeys.detail,
    queryFn: cartAPI.getCurrent,
    retry: false,
  });
  const deletion = useMutation({
    mutationFn: cartAPI.deleteItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cartQueryKeys.all });
      toast.success('Đã xóa khóa học khỏi giỏ hàng.');
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
  const orderCreation = useMutation({ mutationFn: ordersAPI.create });

  const cartItems = cartQuery.data?.items;
  const [selectionState, setSelectionState] = useState<{
    cartItems: typeof cartItems;
    selectedCartItemIds: number[];
  }>(() => ({ cartItems, selectedCartItemIds: [] }));
  const reconciledSelectedCartItemIds = reconcileSelectedCartItemIds(
    selectionState.selectedCartItemIds,
    cartItems ?? [],
  );
  if (selectionState.cartItems !== cartItems) {
    setSelectionState({ cartItems, selectedCartItemIds: reconciledSelectedCartItemIds });
  }
  const selectedCartItemIds =
    selectionState.cartItems === cartItems
      ? selectionState.selectedCartItemIds
      : reconciledSelectedCartItemIds;

  const selectedItems = useMemo(
    () => getSelectedCartItems(cartItems ?? [], selectedCartItemIds),
    [cartItems, selectedCartItemIds],
  );
  const currentSelectedCartItemIds = useMemo(
    () => selectedItems.map((item) => item.id),
    [selectedItems],
  );
  const selectedTotal = useMemo(() => getCartItemsTotal(selectedItems), [selectedItems]);
  const checkoutBusy = checkoutStatus !== 'idle';

  function changeItemSelection(cartItemId: number, selected: boolean) {
    if (checkoutLockRef.current || !cartItems?.some((item) => item.id === cartItemId)) return;
    setSelectionState((current) => {
      const reconciled = reconcileSelectedCartItemIds(current.selectedCartItemIds, cartItems);
      if (selected)
        return {
          cartItems,
          selectedCartItemIds: reconciled.includes(cartItemId)
            ? reconciled
            : [...reconciled, cartItemId],
        };
      return {
        cartItems,
        selectedCartItemIds: reconciled.filter((id) => id !== cartItemId),
      };
    });
  }

  function changeAllSelections(selected: boolean) {
    if (checkoutLockRef.current || !cartItems) return;
    setSelectionState({
      cartItems,
      selectedCartItemIds: selected ? cartItems.map((item) => item.id) : [],
    });
  }

  function removeCartItem(cartItemId: number) {
    if (checkoutLockRef.current || deletion.isPending) return;
    deletion.mutate(cartItemId);
  }

  async function waitForCheckoutStatusPaint() {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  }

  async function checkout() {
    if (checkoutLockRef.current || deletion.isPending || currentSelectedCartItemIds.length === 0)
      return;

    checkoutLockRef.current = true;
    const cartItemIds = [...currentSelectedCartItemIds];
    const reusableCheckout =
      retainedCheckout && haveSameCartItemIds(retainedCheckout.cartItemIds, cartItemIds)
        ? retainedCheckout.data
        : null;
    setCheckoutStatus(reusableCheckout ? 'submitting-payment' : 'creating-order');

    try {
      let checkoutData = reusableCheckout;
      if (!checkoutData) {
        const order: Order = await orderCreation.mutateAsync({
          cartItemIds,
          paymentMethod: BANK_TRANSFER_PAYMENT_METHOD,
        });
        checkoutData = getSePayCheckoutData(order);
        setRetainedCheckout({ cartItemIds, data: checkoutData });
      }

      setCheckoutStatus('submitting-payment');
      await waitForCheckoutStatusPaint();
      submitSePayCheckout(checkoutData);
    } catch (error) {
      toast.error(error instanceof SePayCheckoutError ? error.message : getApiErrorMessage(error));
      setCheckoutStatus('idle');
      checkoutLockRef.current = false;
    }
  }

  const count = cartQuery.data?.items.length;
  const subtitle = cartQuery.isPending
    ? 'Đang tải giỏ hàng…'
    : cartQuery.isError
      ? 'Chưa thể tải thông tin giỏ hàng'
      : `${count ?? 0} khóa học trong giỏ hàng`;

  return (
    <main className="flex-1 bg-bg-light pb-20">
      <CartPageHeader subtitle={subtitle} />
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        {cartQuery.isPending ? (
          <CartLoading />
        ) : cartQuery.isError || !cartQuery.data ? (
          <section
            role="alert"
            className="mx-auto my-8 max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-soft"
          >
            <h2 className="text-xl font-bold text-slate-800">Không thể tải giỏ hàng</h2>
            <p className="mt-2 text-sm text-rose-600">{getApiErrorMessage(cartQuery.error)}</p>
            <button
              type="button"
              disabled={cartQuery.isFetching}
              onClick={() => void cartQuery.refetch()}
              className="mt-6 rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cartQuery.isFetching ? 'Đang thử lại…' : 'Thử lại'}
            </button>
          </section>
        ) : cartQuery.data.items.length === 0 ? (
          <EmptyCart />
        ) : (
          <CartContent
            cart={cartQuery.data}
            pendingItemId={deletion.isPending ? (deletion.variables ?? null) : null}
            selectedCartItemIds={currentSelectedCartItemIds}
            selectedTotal={selectedTotal}
            checkoutStatus={checkoutStatus}
            checkoutDisabled={
              currentSelectedCartItemIds.length === 0 || deletion.isPending || checkoutBusy
            }
            selectionLocked={checkoutBusy}
            onItemSelectionChange={changeItemSelection}
            onSelectAllChange={changeAllSelections}
            onCheckout={() => void checkout()}
            onRemove={removeCartItem}
          />
        )}
      </div>
    </main>
  );
}
