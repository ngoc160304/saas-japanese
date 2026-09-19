'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LockKeyhole, Mail } from 'lucide-react';
import { login } from '@/store/authSlice';
import { useAppDispatch } from '@/store/hooks';
import { loginSchema, type LoginValues } from '../schemas/auth.schema';
import { safeReturnPath } from '../auth-navigation';
import { useAuthForm } from '../hooks/useAuthForm';
import { AuthField } from './AuthField';
import { AuthFormError, AuthSubmit } from './AuthFormFeedback';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const destination = safeReturnPath(searchParams.get('next'));
  const verifiedEmail = searchParams.get('verifiedEmail');
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { email: verifiedEmail ?? '', password: '', rememberMe: false },
  });
  const feedback = useAuthForm(form, 'login', ['email', 'password'], destination);
  const { errors, isSubmitting } = form.formState;

  return (
    <>
      {verifiedEmail && (
        <p
          role="status"
          className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-700"
        >
          Email đã được xác thực. Bạn có thể đăng nhập.
        </p>
      )}
      <form
        noValidate
        aria-busy={isSubmitting}
        className="space-y-4"
        onSubmit={form.handleSubmit((values) =>
          feedback.submit(
            () => dispatch(login(values)).unwrap(),
            'Đang đăng nhập…',
            'Đăng nhập thành công!',
            () => router.replace(destination),
          ),
        )}
      >
        <AuthFormError message={errors.root?.message} />
        <fieldset
          disabled={isSubmitting || feedback.busy}
          className="space-y-4 disabled:opacity-70"
        >
          <AuthField
            id="login-email"
            label="Email Address"
            icon={Mail}
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            required
            error={errors.email?.message}
            {...form.register('email')}
          />
          <AuthField
            id="login-password"
            label="Mật khẩu"
            icon={LockKeyhole}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            error={errors.password?.message}
            {...form.register('password')}
          />
          <div className="flex justify-end">
            <button
              type="button"
              disabled
              title="Chức năng khôi phục mật khẩu hiện chưa khả dụng"
              className="cursor-not-allowed text-xs font-semibold text-slate-400"
            >
              Quên mật khẩu? (Chưa khả dụng)
            </button>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              className="size-4 accent-sky-600 focus-visible:outline-sky-500"
              {...form.register('rememberMe')}
            />
            Ghi nhớ đăng nhập (30 ngày)
          </label>
          <AuthSubmit pending={isSubmitting} disabled={feedback.busy}>
            {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </AuthSubmit>
        </fieldset>
        {!feedback.initialized && (
          <p role="status" className="text-center text-xs text-slate-500">
            Đang kiểm tra phiên đăng nhập…
          </p>
        )}
      </form>
      <div className="flex items-center gap-3 py-5">
        <span className="flex-1 border-t border-slate-100" />
        <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Hoặc tiếp tục với
        </span>
        <span className="flex-1 border-t border-slate-100" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {['Google', 'Apple'].map((provider) => (
          <button
            key={provider}
            type="button"
            disabled
            title={`${provider}: Sắp ra mắt`}
            aria-label={`Đăng nhập bằng ${provider} (Sắp ra mắt)`}
            className="cursor-not-allowed rounded-2xl border border-slate-200/80 bg-slate-50/60 px-3 py-2.5 text-xs font-bold text-slate-600 opacity-60"
          >
            {provider}
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-3 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
        <p>
          Chưa có tài khoản?{' '}
          <Link
            href={`/register?next=${encodeURIComponent(destination)}`}
            className="font-bold text-sky-600 hover:underline"
          >
            Đăng ký tài khoản mới →
          </Link>
        </p>
        <Link
          href="/verify-email"
          className="inline-block font-semibold text-sky-600 hover:underline"
        >
          Xác thực email bằng mã OTP
        </Link>
      </div>
    </>
  );
}
