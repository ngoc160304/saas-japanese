'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ShieldCheck } from 'lucide-react';
import { authAPI } from '@/apis/auth/auth.api';
import { verifyEmailSchema, type VerifyEmailValues } from '../schemas/auth.schema';
import { safeReturnPath } from '../auth-navigation';
import { useAuthForm } from '../hooks/useAuthForm';
import { AuthField } from './AuthField';
import { AuthFormError, AuthSubmit } from './AuthFormFeedback';

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = safeReturnPath(searchParams.get('next'));
  const form = useForm<VerifyEmailValues>({
    resolver: zodResolver(verifyEmailSchema),
    mode: 'onBlur',
    defaultValues: { email: searchParams.get('email') ?? '', otp: '' },
  });
  const feedback = useAuthForm(form, 'verify', ['email', 'otp'], destination);
  const { errors, isSubmitting } = form.formState;
  return (
    <>
      <form
        noValidate
        aria-busy={isSubmitting}
        className="space-y-4"
        onSubmit={form.handleSubmit((values) =>
          feedback.submit(
            () => authAPI.verifyEmail(values),
            'Đang xác thực…',
            'Xác thực email thành công!',
            () =>
              router.replace(
                `/login?verifiedEmail=${encodeURIComponent(values.email)}&next=${encodeURIComponent(destination)}`,
              ),
          ),
        )}
      >
        <AuthFormError message={errors.root?.message} />
        <fieldset
          disabled={isSubmitting || feedback.busy}
          className="space-y-4 disabled:opacity-70"
        >
          <AuthField
            id="verify-email"
            label="Email"
            icon={Mail}
            type="email"
            autoComplete="email"
            required
            error={errors.email?.message}
            {...form.register('email')}
          />
          <AuthField
            id="verify-otp"
            label="Mã xác thực"
            icon={ShieldCheck}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6 chữ số trong email"
            required
            maxLength={6}
            error={errors.otp?.message}
            {...form.register('otp')}
          />
          <AuthSubmit pending={isSubmitting} disabled={feedback.busy}>
            {isSubmitting ? 'Đang xác thực…' : 'Xác thực email'}
          </AuthSubmit>
        </fieldset>
        {!feedback.initialized && (
          <p role="status" className="text-center text-xs text-slate-500">
            Đang kiểm tra phiên đăng nhập…
          </p>
        )}
      </form>
      <p className="mt-5 text-xs leading-relaxed text-slate-500">
        Kiểm tra cả thư mục thư rác. Nếu mã hết hạn, vui lòng liên hệ hỗ trợ; tính năng gửi lại mã
        hiện chưa khả dụng.
      </p>
      <p className="mt-6 border-t border-slate-100 pt-4 text-center text-xs">
        <Link
          href={`/login?next=${encodeURIComponent(destination)}`}
          className="font-bold text-sky-600 hover:underline"
        >
          Quay lại đăng nhập →
        </Link>
      </p>
    </>
  );
}
