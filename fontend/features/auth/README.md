# Authentication

Routes: `/login`, `/register`, `/verify-email`. Login returns to a validated local
`next` path, or `/`. Registration requires email OTP verification before login.
Password recovery and social sign-in are unavailable in the backend. The terms
text follows the prototype; published terms/privacy routes are not available yet.

`NEXT_PUBLIC_API_URL` is the backend origin (for example `http://localhost:8080`),
without `/api/v1`. The shared client adds `API_VERSION`. The backend controls
cookie security and allowed origins. Local HTTP development requires the backend's
existing `AUTH_COOKIE_SECURE=false` setting and an allowed frontend origin.

Redux owns authentication only. Tokens are not persisted, JWTs are not decoded,
and Redux DevTools is disabled because thunk actions can contain credentials.
`AuthBootstrap` injects the store and callbacks into Axios in a browser effect.
ReduxProvider supplies a stable server snapshot for delayed Suspense hydration.
CRUD data stays in TanStack Query; changing users cancels and clears its cache.

The bootstrap thunk and 401 interceptor share one refresh promise. Late 401s reuse
the latest token, requests retry once, and a session revision prevents old refresh
responses from undoing logout. Auth POSTs fetch a masked CSRF token from
`/auth/csrf`; JavaScript never reads the HttpOnly refresh or CSRF cookies.
Web Locks serialize cookie mutations across tabs where supported. Without Web
Locks, refresh coalescing applies within each tab; simultaneous refresh across
multiple tabs cannot be guaranteed. Backend permissions remain authoritative;
the admin layout guard only checks whether a session exists.

Run `pnpm test:auth` for the mocked API/interceptor/store regression suite.
Run the app on port 3001, then `pnpm test:auth:browser` for the Chrome headless flow
and mobile/desktop screenshots. The browser test intercepts backend traffic and
uses synthetic credentials; it does not contact the real backend or email service.
Override `AUTH_TEST_ORIGIN` or `AUTH_TEST_BROWSER` for another local URL/browser
executable. Screenshots are written to the printed temporary directory.
