'use client';

import { useState } from 'react';

export default function PaymentTestPage() {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      const response = await fetch('http://localhost:8080/api/v1/orders?userId=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItemIds: [23, 24],
          paymentMethod: 'BANK_TRANSFER',
        }),
      });

      const result = await response.json();

      console.log('Order response:', result);

      if (!response.ok) {
        throw new Error(result?.message || 'Không thể tạo order');
      }

      const order = result.data;

      if (!order?.checkoutUrl || !order?.checkoutFields) {
        console.error('Checkout data:', order);
        throw new Error('Backend không trả về thông tin checkout SePay');
      }

      const form = document.createElement('form');

      form.method = 'POST';
      form.action = order.checkoutUrl;

      Object.entries(order.checkoutFields).forEach(([key, value]) => {
        const input = document.createElement('input');

        input.type = 'hidden';
        input.name = key;
        input.value = String(value);

        form.appendChild(input);
      });

      document.body.appendChild(form);

      form.submit();
    } catch (error) {
      console.error('Payment error:', error);

      alert(error instanceof Error ? error.message : 'Không thể tạo thanh toán SePay');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-2 text-2xl font-bold">Test SePay Sandbox</h1>

        <p className="mb-6 text-sm text-slate-500">
          Tạo Order và chuyển sang trang thanh toán SePay.
        </p>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Đang tạo thanh toán...' : 'Thanh toán với SePay'}
        </button>
      </div>
    </main>
  );
}
