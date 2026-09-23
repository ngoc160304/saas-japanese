import { z } from 'zod';

const email = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập email.')
  .email('Email không đúng định dạng.')
  .max(254, 'Email tối đa 254 ký tự.');
const password = z
  .string()
  .min(1, 'Vui lòng nhập mật khẩu.')
  .max(72, 'Mật khẩu tối đa 72 ký tự.')
  .refine((value) => value.trim().length > 0, 'Mật khẩu không được chỉ chứa khoảng trắng.')
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    'Mật khẩu tối đa 72 byte UTF-8; ký tự có dấu có thể chiếm nhiều byte.',
  );

export const loginSchema = z.object({ email, password, rememberMe: z.boolean() });
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập họ và tên.')
      .max(150, 'Họ tên tối đa 150 ký tự.'),
    email,
    phone: z.string().trim().max(20, 'Số điện thoại tối đa 20 ký tự.'),
    password: password.refine((value) => value.length >= 8, 'Mật khẩu phải có ít nhất 8 ký tự.'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu.'),
    agreeTerms: z.boolean().refine(Boolean, 'Bạn cần đồng ý với điều khoản để tiếp tục.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận không khớp.',
  });
export const verifyEmailSchema = z.object({
  email,
  otp: z.string().regex(/^[0-9]{6}$/, 'Mã xác thực gồm 6 chữ số.'),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type VerifyEmailValues = z.infer<typeof verifyEmailSchema>;
