import type { CartItem } from '@/apis/cart/cart.type';

export function reconcileSelectedCartItemIds(
  selectedCartItemIds: readonly number[],
  items: readonly CartItem[],
) {
  const availableIds = new Set(items.map((item) => item.id));
  return selectedCartItemIds.filter(
    (cartItemId, index) =>
      availableIds.has(cartItemId) && selectedCartItemIds.indexOf(cartItemId) === index,
  );
}

export function getSelectedCartItems(
  items: readonly CartItem[],
  selectedCartItemIds: readonly number[],
) {
  const selectedIds = new Set(reconcileSelectedCartItemIds(selectedCartItemIds, items));
  return items.filter((item) => selectedIds.has(item.id));
}

export function getCartItemsTotal(items: readonly CartItem[]) {
  return items.reduce((total, item) => total + (item.price ?? 0), 0);
}

export function haveSameCartItemIds(first: readonly number[], second: readonly number[]) {
  return first.length === second.length && first.every((id, index) => id === second[index]);
}
