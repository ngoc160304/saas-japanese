import type { Metadata } from 'next';
import { StorefrontFooter } from '@/components/layout/storefront/StorefrontFooter';
import { StorefrontHeader } from '@/components/layout/storefront/StorefrontHeader';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { CartPage } from '@/features/cart/components/CartPage';

export const metadata: Metadata = {
  title: 'Giỏ hàng | StudyJLPT',
  description: 'Xem lại các khóa học trong giỏ hàng StudyJLPT của bạn.',
};

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-storefront text-slate-800">
      <StorefrontHeader activePage="cart" />
      <AuthGuard>
        <CartPage />
      </AuthGuard>
      <StorefrontFooter />
    </div>
  );
}
