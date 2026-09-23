export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export interface AuthSession {
  access_token: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface RegisterResponse {
  email: string;
  nextAction: 'VERIFY_EMAIL';
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface AuthResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface CsrfResponse {
  token: string;
  headerName: string;
}
