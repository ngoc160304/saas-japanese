import type { Order } from '@/apis/orders/orders.type';

export interface SePayCheckoutData {
  checkoutUrl: string;
  checkoutFields: Readonly<Record<string, string>>;
}

export class SePayCheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SePayCheckoutError';
  }
}

export function getSePayCheckoutData(
  order: Pick<Order, 'checkoutUrl' | 'checkoutFields'>,
): SePayCheckoutData {
  const { checkoutUrl, checkoutFields } = order;

  if (!checkoutUrl?.trim() || !checkoutFields || Object.keys(checkoutFields).length === 0) {
    throw new SePayCheckoutError(
      'Đơn hàng đã được tạo nhưng thiếu thông tin thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ.',
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(checkoutUrl);
  } catch {
    throw new SePayCheckoutError(
      'Địa chỉ cổng thanh toán không hợp lệ. Vui lòng thử lại hoặc liên hệ hỗ trợ.',
    );
  }
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    throw new SePayCheckoutError(
      'Địa chỉ cổng thanh toán không hợp lệ. Vui lòng thử lại hoặc liên hệ hỗ trợ.',
    );
  }

  for (const [name, value] of Object.entries(checkoutFields)) {
    if (!name || typeof value !== 'string') {
      throw new SePayCheckoutError(
        'Thông tin thanh toán không hợp lệ. Vui lòng thử lại hoặc liên hệ hỗ trợ.',
      );
    }
  }

  return { checkoutUrl, checkoutFields };
}

export function submitSePayCheckout({ checkoutUrl, checkoutFields }: SePayCheckoutData) {
  if (typeof document === 'undefined' || !document.body) {
    throw new SePayCheckoutError('Không thể mở cổng thanh toán trên thiết bị này.');
  }

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = checkoutUrl;
  form.target = '_self';
  form.enctype = 'application/x-www-form-urlencoded';

  for (const [name, value] of Object.entries(checkoutFields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.append(input);
  }

  let submitted = false;
  try {
    document.body.append(form);
    const nativeSubmit = form.ownerDocument.defaultView?.HTMLFormElement.prototype.submit;
    if (!nativeSubmit) throw new Error('Native form submission is unavailable');
    nativeSubmit.call(form);
    submitted = true;
  } catch {
    throw new SePayCheckoutError(
      'Không thể chuyển đến cổng thanh toán. Vui lòng kiểm tra trình duyệt và thử lại.',
    );
  } finally {
    if (!submitted) form.remove();
  }

  // A successful self-targeted submit replaces this document. The timeout is a fallback for
  // browsers that silently block navigation without throwing from the native submit method.
  form.ownerDocument.defaultView?.setTimeout(() => form.remove(), 60_000);
}
