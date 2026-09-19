import { getApiError } from '@/lib/api-error';

export function getAuthError(error: unknown, context: 'login' | 'register' | 'verify') {
  const result = getApiError(error);
  if (context === 'login' && result.status === 401)
    result.message = 'Email hoặc mật khẩu không chính xác, hoặc tài khoản chưa được xác thực.';
  if (context === 'login' && result.status === 403)
    result.message = 'Không thể đăng nhập. Hãy kiểm tra xác thực email rồi thử lại.';
  if (context === 'register' && result.status === 409) {
    result.message = 'Email đã được đăng ký. Vui lòng đăng nhập hoặc xác thực tài khoản.';
    result.fieldErrors.email = result.message;
  }
  if (result.fieldErrors.passwordWithinByteLimit) {
    result.fieldErrors.password = 'Mật khẩu không được vượt quá 72 byte UTF-8.';
  }
  return result;
}
