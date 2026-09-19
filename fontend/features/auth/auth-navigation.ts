const AUTH_PATHS = new Set(['/login', '/register', '/verify-email']);

export function safeReturnPath(value: string | null | undefined): string {
  if (!value?.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value))
    return '/';
  try {
    const url = new URL(value, 'https://studify.invalid');
    if (url.origin !== 'https://studify.invalid' || AUTH_PATHS.has(url.pathname)) return '/';
    return url.pathname + url.search + url.hash;
  } catch {
    return '/';
  }
}
