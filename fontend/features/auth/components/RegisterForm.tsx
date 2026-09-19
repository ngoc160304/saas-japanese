'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { register as registerAccount } from '@/store/authSlice';
import { useAppDispatch } from '@/store/hooks';
import { registerSchema, type RegisterValues } from '../schemas/auth.schema';
import { useAuthForm } from '../hooks/useAuthForm';
import { safeReturnPath } from '../auth-navigation';
import { AuthField } from './AuthField';
import { AuthFormError, AuthSubmit } from './AuthFormFeedback';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = safeReturnPath(searchParams.get('next'));
  const dispatch = useAppDispatch();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });
  const feedback = useAuthForm(
    form,
    'register',
    ['fullName', 'email', 'phone', 'password'],
    destination,
  );
  const { errors, isSubmitting } = form.formState;

  return (
    <>
      <form
        noValidate
        aria-busy={isSubmitting}
        className="space-y-3.5"
        onSubmit={form.handleSubmit(({ fullName, email, phone, password }) =>
          feedback.submit(
            () =>
              dispatch(
                registerAccount({ fullName, email, password, ...(phone ? { phone } : {}) }),
              ).unwrap(),
            'Đang tạo tài khoản…',
            'Tạo tài khoản thành công! Hãy kiểm tra email để lấy mã xác thực.',
            (result) => {
              if (result.nextAction === 'VERIFY_EMAIL')
                router.replace(
                  `/verify-email?email=${encodeURIComponent(result.email)}&next=${encodeURIComponent(destination)}`,
                );
            },
          ),
        )}
      >
        <AuthFormError message={errors.root?.message} />
        <fieldset
          disabled={isSubmitting || feedback.busy}
          className="space-y-3.5 disabled:opacity-70"
        >
          <AuthField
            id="register-name"
            label="Họ và tên"
            icon={UserRound}
            type="text"
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            required
            error={errors.fullName?.message}
            {...form.register('fullName')}
          />
          <AuthField
            id="register-email"
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
            id="register-phone"
            label="Số điện thoại (Không bắt buộc)"
            icon={Phone}
            type="tel"
            autoComplete="tel"
            placeholder="0901 234 567"
            error={errors.phone?.message}
            {...form.register('phone')}
          />
          <AuthField
            id="register-password"
            label="Mật khẩu"
            icon={LockKeyhole}
            type="password"
            autoComplete="new-password"
            placeholder="Tối thiểu 8 ký tự"
            required
            error={errors.password?.message}
            {...form.register('password', { deps: ['confirmPassword'] })}
          />
          <AuthField
            id="register-confirm"
            label="Xác nhận mật khẩu"
            icon={ShieldCheck}
            type="password"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            required
            error={errors.confirmPassword?.message}
            {...form.register('confirmPassword')}
          />
          <div className="pt-1">
            <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-snug text-slate-500">
              <input
                type="checkbox"
                required
                aria-invalid={Boolean(errors.agreeTerms)}
                aria-describedby={errors.agreeTerms ? 'terms-error' : undefined}
                className="mt-0.5 size-4 shrink-0 accent-sky-600"
                {...form.register('agreeTerms')}
              />
              <span>
                Tôi đồng ý với <span className="font-bold text-slate-900">Điều khoản dịch vụ</span>{' '}
                và <span className="font-bold text-slate-900">Chính sách bảo mật</span> của Studify
                JLPT.
              </span>
            </label>
            {errors.agreeTerms && (
              <p id="terms-error" aria-live="polite" className="mt-1.5 text-xs text-rose-600">
                {errors.agreeTerms.message}
              </p>
            )}
          </div>
          <AuthSubmit pending={isSubmitting} disabled={feedback.busy}>
            {isSubmitting ? 'Đang tạo tài khoản…' : 'Tạo tài khoản miễn phí'}
          </AuthSubmit>
        </fieldset>
        {!feedback.initialized && (
          <p role="status" className="text-center text-xs text-slate-500">
            Đang kiểm tra phiên đăng nhập…
          </p>
        )}
      </form>
      <p className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
        Đã có tài khoản?{' '}
        <Link
          href={`/login?next=${encodeURIComponent(destination)}`}
          className="font-bold text-sky-600 hover:underline"
        >
          Đăng nhập ngay →
        </Link>
      </p>
    </>
  );
}
