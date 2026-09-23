import authorizeAxios from '@/lib/authorize-axios';
import type {
  AuthResponse,
  AuthSession,
  CsrfResponse,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
} from './auth.type';

// Serialize cookie mutations across tabs where Web Locks is supported.
// CSRF is fetched before every POST because authentication can rotate its cookie.
async function authPost<T>(
  path: string,
  data?: LoginRequest | RegisterRequest | VerifyEmailRequest,
) {
  const request = async () => {
    const csrf = await authorizeAxios.get<AuthResponse<CsrfResponse>>('/auth/csrf');
    return authorizeAxios.post<T>(path, data, {
      headers: { [csrf.data.data.headerName]: csrf.data.data.token },
    });
  };
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('studify-auth-cookie', request);
  }
  return request();
}

export const authAPI = {
  async login(data: LoginRequest) {
    return (await authPost<AuthResponse<AuthSession>>('/auth/login', data)).data.data;
  },
  async register(data: RegisterRequest) {
    return (await authPost<AuthResponse<RegisterResponse>>('/auth/register', data)).data.data;
  },
  async refresh() {
    return (await authPost<AuthResponse<AuthSession>>('/auth/refresh-token')).data.data;
  },
  async logout() {
    await authPost<void>('/auth/logout');
  },
  async verifyEmail(data: VerifyEmailRequest) {
    // This endpoint returns plain text, not RestResponse.
    return (await authPost<string>('/auth/verify-user', data)).data;
  },
};
