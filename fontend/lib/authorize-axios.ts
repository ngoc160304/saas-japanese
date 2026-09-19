import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { UnknownAction } from '@reduxjs/toolkit';
import type { AuthSession } from '@/apis/auth/auth.type';
import { getApiErrorMessage } from '@/lib/api-error';
import { API_VERSION } from '@/utils/constant';

interface RetryConfig extends InternalAxiosRequestConfig {
  _authRetry?: boolean;
  _authRevision?: number;
}

interface AuthStore {
  getState: () => { auth: { accessToken: string | null; revision: number; initialized: boolean } };
  dispatch: (action: UnknownAction) => unknown;
}

interface AuthBindings {
  refresh: () => Promise<AuthSession>;
  sessionReceived: (session: AuthSession) => UnknownAction;
  clearAuth: () => UnknownAction;
  onSessionExpired: () => void;
  onSystemError: (message: string) => void;
}

const authorizeAxiosInstance = axios.create({
  baseURL: `${(process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')}/${API_VERSION}`,
  timeout: 30_000,
  withCredentials: true,
});

let authStore: AuthStore | undefined;
let bindings: AuthBindings | undefined;
let refreshTokenPromise: Promise<AuthSession> | null = null;
let expirationNotified = false;

// Browser provider injection avoids runtime imports of store, slice and auth API.
export function injectStore(store: AuthStore, nextBindings: AuthBindings) {
  authStore = store;
  bindings = nextBindings;
}

function isAuthEndpoint(url = '') {
  return /\/auth\/(?:csrf|login|register|logout|refresh-token|verify-user)(?:[?#]|$)/.test(url);
}

function expireSession() {
  if (expirationNotified || !authStore || !bindings) return;
  expirationNotified = true;
  authStore.dispatch(bindings.clearAuth());
  bindings.onSessionExpired();
}

export function refreshAccessToken(): Promise<AuthSession> {
  if (refreshTokenPromise) return refreshTokenPromise;
  const store = authStore;
  const handlers = bindings;
  if (!store || !handlers) return Promise.reject(new Error('Auth provider is not ready'));
  const { revision, initialized } = store.getState().auth;
  refreshTokenPromise = handlers
    .refresh()
    .then((session) => {
      // A logout or new login must never be undone by an older response.
      if (store.getState().auth.revision !== revision)
        throw new axios.CanceledError('Session changed');
      store.dispatch(handlers.sessionReceived(session));
      expirationNotified = false;
      return session;
    })
    .catch((error: unknown) => {
      if (store.getState().auth.revision === revision) {
        if (initialized) expireSession();
        else store.dispatch(handlers.clearAuth());
      }
      throw error;
    })
    .finally(() => {
      refreshTokenPromise = null;
    });
  return refreshTokenPromise;
}

export async function waitForSessionRefresh() {
  // Let Set-Cookie finish before login/logout changes the browser session.
  await refreshTokenPromise?.catch(() => undefined);
}

authorizeAxiosInstance.interceptors.request.use(async (config: RetryConfig) => {
  if (isAuthEndpoint(config.url)) {
    config.headers.delete('Authorization');
    return config;
  }
  if (refreshTokenPromise) await refreshTokenPromise;
  const auth = authStore?.getState().auth;
  config._authRevision ??= auth?.revision;
  if (auth?.accessToken) {
    config.headers.set('Authorization', `Bearer ${auth.accessToken}`);
    expirationNotified = false;
  } else config.headers.delete('Authorization');
  return config;
});

authorizeAxiosInstance.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || axios.isCancel(error)) return Promise.reject(error);
    const config: RetryConfig | undefined = error.config;
    if (!config || isAuthEndpoint(config.url)) return Promise.reject(error);
    const auth = authStore?.getState().auth;
    if (error.response?.status === 401 && auth && bindings) {
      if (config._authRevision !== auth.revision) return Promise.reject(error);
      if (config._authRetry || (auth.initialized && !auth.accessToken)) {
        expireSession();
        return Promise.reject(error);
      }
      config._authRetry = true;
      // Late 401s for an old token reuse the token that already refreshed.
      if (
        !auth.accessToken ||
        config.headers.get('Authorization') === `Bearer ${auth.accessToken}`
      ) {
        await refreshAccessToken();
      }
      if (authStore?.getState().auth.revision !== config._authRevision)
        return Promise.reject(error);
      return authorizeAxiosInstance(config);
    }
    if (!error.response || error.response.status >= 500)
      bindings?.onSystemError(getApiErrorMessage(error));
    return Promise.reject(error);
  },
);

export default authorizeAxiosInstance;
