import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';
import axios from 'axios';

// Run the actual TS modules with Node's test runner, without adding a test framework.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function loadApp() {
  const cache = new Map();
  function load(path) {
    const file = existsSync(`${path}.ts`) ? `${path}.ts` : resolve(path, 'index.ts');
    if (cache.has(file)) {
      assert.equal(cache.get(file).loaded, true, `Circular runtime dependency: ${file}`);
      return cache.get(file).exports;
    }
    const compiledModule = { exports: {}, loaded: false };
    cache.set(file, compiledModule);
    const source = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
      fileName: file,
    }).outputText;
    const requireDependency = createRequire(file);
    const localRequire = (specifier) => {
      if (specifier.startsWith('@/')) return load(resolve(root, specifier.slice(2)));
      if (specifier.startsWith('.')) return load(resolve(dirname(file), specifier));
      return requireDependency(specifier);
    };
    new Script(`(function(require, module, exports) {${source}\n})`, {
      filename: file,
    }).runInThisContext()(localRequire, compiledModule, compiledModule.exports);
    compiledModule.loaded = true;
    return compiledModule.exports;
  }
  const infrastructure = load(resolve(root, 'lib/authorize-axios'));
  const actions = load(resolve(root, 'store/authSlice'));
  const api = load(resolve(root, 'apis/auth/auth.api')).authAPI;
  const store = load(resolve(root, 'store')).makeStore();
  const events = { expired: 0, system: 0 };
  infrastructure.injectStore(store, {
    refresh: api.refresh,
    sessionReceived: actions.sessionReceived,
    clearAuth: actions.clearAuth,
    onSessionExpired: () => {
      events.expired++;
    },
    onSystemError: () => {
      events.system++;
    },
  });
  return { ...infrastructure, client: infrastructure.default, actions, api, store, events, load };
}

const session = (token = 'test-access') => ({
  access_token: token,
  tokenType: 'Bearer',
  expiresIn: 600,
  user: { id: 1, email: 'student@example.test', name: 'Student' },
});
const response = (config, data, status = 200) => ({
  config,
  data,
  status,
  statusText: String(status),
  headers: {},
});
function fail(
  config,
  status,
  data = { status, message: 'Authentication required', fieldErrors: {} },
) {
  throw new axios.AxiosError(
    'Request failed',
    'ERR_BAD_RESPONSE',
    config,
    null,
    response(config, data, status),
  );
}
const deferred = () => {
  let resolvePromise;
  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
};
const csrf = (config) =>
  response(config, { data: { token: 'test-csrf', headerName: 'X-XSRF-TOKEN' } });

test('anonymous bootstrap is silent and Strict Mode dispatches only one refresh', async () => {
  const app = loadApp();
  let calls = 0;
  app.client.defaults.adapter = async (config) => {
    if (config.url === '/auth/csrf') return csrf(config);
    calls++;
    return fail(config, 401);
  };
  await Promise.all([
    app.store.dispatch(app.actions.refreshSession()),
    app.store.dispatch(app.actions.refreshSession()),
  ]);
  assert.equal(calls, 1);
  assert.equal(app.store.getState().auth.initialized, true);
  assert.equal(app.store.getState().auth.status, 'idle');
  assert.deepEqual(app.events, { expired: 0, system: 0 });
});

test('login sends CSRF, rememberMe and credentials; duplicate dispatch is rejected', async () => {
  const app = loadApp();
  app.store.dispatch(app.actions.clearAuth());
  let logins = 0;
  app.client.defaults.adapter = async (config) => {
    if (config.url === '/auth/csrf') return csrf(config);
    assert.equal(config.url, '/auth/login');
    assert.equal(config.headers.get('X-XSRF-TOKEN'), 'test-csrf');
    assert.equal(config.headers.has('Authorization'), false);
    assert.equal(config.withCredentials, true);
    assert.equal(JSON.parse(config.data).rememberMe, true);
    logins++;
    return response(config, { data: session() });
  };
  const data = { email: 'student@example.test', password: 'test-password', rememberMe: true };
  await Promise.all([
    app.store.dispatch(app.actions.login(data)),
    app.store.dispatch(app.actions.login(data)),
  ]);
  assert.equal(logins, 1);
  assert.equal(app.actions.selectIsAuthenticated(app.store.getState()), true);
  assert.deepEqual(Object.keys(app.store.getState()), ['auth']);
  assert.equal('password' in app.store.getState().auth, false);
});

test('concurrent 401s refresh once and retry with the new token', async () => {
  const app = loadApp();
  app.store.dispatch(app.actions.sessionReceived(session('old')));
  let refreshes = 0;
  let retries = 0;
  app.client.defaults.adapter = async (config) => {
    if (config.url === '/auth/csrf') return csrf(config);
    if (config.url === '/auth/refresh-token') {
      refreshes++;
      return response(config, { data: session('new') });
    }
    if (config.headers.get('Authorization') === 'Bearer old') return fail(config, 401);
    assert.equal(config.headers.get('Authorization'), 'Bearer new');
    retries++;
    return response(config, {});
  };
  await Promise.all(Array.from({ length: 8 }, () => app.client.get('/course-categories')));
  assert.equal(refreshes, 1);
  assert.equal(retries, 8);
});

test('a delayed old-token 401 reuses the token without rotating again', async () => {
  const app = loadApp();
  app.store.dispatch(app.actions.sessionReceived(session('old')));
  const delayed = deferred();
  let refreshes = 0;
  app.client.defaults.adapter = async (config) => {
    if (config.url === '/auth/csrf') return csrf(config);
    if (config.url === '/auth/refresh-token') {
      refreshes++;
      return response(config, { data: session('new') });
    }
    if (config.headers.get('Authorization') === 'Bearer old') {
      if (config.url === '/late') await delayed.promise;
      return fail(config, 401);
    }
    return response(config, {});
  };
  const late = app.client.get('/late');
  await app.client.get('/first');
  delayed.resolve();
  await late;
  assert.equal(refreshes, 1);
});

test('failed refresh clears auth and emits one expiration event for all waiters', async () => {
  const app = loadApp();
  app.store.dispatch(app.actions.sessionReceived(session()));
  let refreshes = 0;
  app.client.defaults.adapter = async (config) => {
    if (config.url === '/auth/csrf') return csrf(config);
    if (config.url === '/auth/refresh-token') refreshes++;
    return fail(config, 401);
  };
  const results = await Promise.allSettled(
    Array.from({ length: 5 }, () => app.client.get('/private')),
  );
  assert.ok(results.every((result) => result.status === 'rejected'));
  assert.equal(refreshes, 1);
  assert.equal(app.store.getState().auth.accessToken, null);
  assert.deepEqual(app.events, { expired: 1, system: 0 });
});

test('a retry that still returns 401 stops after one retry', async () => {
  const app = loadApp();
  app.store.dispatch(app.actions.sessionReceived(session()));
  let resourceCalls = 0;
  app.client.defaults.adapter = async (config) => {
    if (config.url === '/auth/csrf') return csrf(config);
    if (config.url === '/auth/refresh-token') return response(config, { data: session('new') });
    resourceCalls++;
    return fail(config, 401);
  };
  await assert.rejects(app.client.get('/private'));
  assert.equal(resourceCalls, 2);
  assert.equal(app.events.expired, 1);
});

test('auth endpoint errors and permission 403s never trigger refresh or a global toast', async () => {
  const app = loadApp();
  app.store.dispatch(app.actions.sessionReceived(session()));
  let calls = 0;
  app.client.defaults.adapter = async (config) => {
    calls++;
    return fail(config, config.url === '/private' ? 403 : 401);
  };
  for (const path of [
    '/auth/login',
    '/auth/register',
    '/auth/logout',
    '/auth/refresh-token',
    '/auth/verify-user',
    '/private',
  ]) {
    await assert.rejects(app.client.post(path));
  }
  assert.equal(calls, 6);
  assert.deepEqual(app.events, { expired: 0, system: 0 });
});

test('logout during refresh waits for cookie rotation and cannot resurrect auth', async () => {
  const app = loadApp();
  app.store.dispatch(app.actions.sessionReceived(session()));
  const started = deferred();
  const finish = deferred();
  const order = [];
  app.client.defaults.adapter = async (config) => {
    if (config.url === '/auth/csrf') return csrf(config);
    if (config.url === '/auth/refresh-token') {
      started.resolve();
      await finish.promise;
      order.push('refresh');
      return response(config, { data: session('new') });
    }
    order.push('logout');
    return response(config, undefined, 204);
  };
  const refreshing = app.store.dispatch(app.actions.refreshSession());
  await started.promise;
  const loggingOut = app.store.dispatch(app.actions.logout());
  assert.equal(app.store.getState().auth.accessToken, null);
  finish.resolve();
  await Promise.all([refreshing, loggingOut]);
  assert.deepEqual(order, ['refresh', 'logout']);
  assert.equal(app.actions.selectIsAuthenticated(app.store.getState()), false);
  assert.equal(app.store.getState().auth.status, 'idle');
});

test('late failures from a previous session do not log out a new login', async () => {
  const app = loadApp();
  app.store.dispatch(app.actions.sessionReceived(session('old')));
  const started = deferred();
  const finish = deferred();
  app.client.defaults.adapter = async (config) => {
    started.resolve();
    await finish.promise;
    return fail(config, 401);
  };
  const request = app.client.get('/private');
  await started.promise;
  app.store.dispatch(app.actions.clearAuth());
  app.store.dispatch(app.actions.sessionReceived(session('new')));
  finish.resolve();
  await assert.rejects(request);
  assert.equal(app.store.getState().auth.accessToken, 'new');
  assert.equal(app.events.expired, 0);
});

test('register returns the verification step and verify handles a plain-text response', async () => {
  const app = loadApp();
  app.store.dispatch(app.actions.clearAuth());
  let csrfCalls = 0;
  app.client.defaults.adapter = async (config) => {
    if (config.url === '/auth/csrf') {
      csrfCalls++;
      return csrf(config);
    }
    assert.equal(config.headers.get('X-XSRF-TOKEN'), 'test-csrf');
    if (config.url === '/auth/register')
      return response(
        config,
        { data: { email: 'student@example.test', nextAction: 'VERIFY_EMAIL' } },
        201,
      );
    return response(config, 'Verify success');
  };
  const result = await app.store
    .dispatch(
      app.actions.register({
        fullName: 'Student',
        email: 'student@example.test',
        password: 'test-password',
      }),
    )
    .unwrap();
  assert.equal(result.nextAction, 'VERIFY_EMAIL');
  assert.equal(app.actions.selectIsAuthenticated(app.store.getState()), false);
  assert.equal(await app.api.verifyEmail({ email: result.email, otp: '123456' }), 'Verify success');
  assert.equal(csrfCalls, 2);
});

test('schema checks UTF-8 length, matching passwords, consent and numeric OTP', () => {
  const app = loadApp();
  const { registerSchema, loginSchema, verifyEmailSchema } = app.load(
    resolve(root, 'features/auth/schemas/auth.schema'),
  );
  const data = {
    fullName: 'Student',
    email: 'student@example.test',
    password: 'test-password',
    confirmPassword: 'test-password',
    phone: '',
    agreeTerms: true,
  };
  assert.equal(registerSchema.safeParse(data).success, true);
  assert.equal(registerSchema.safeParse({ ...data, confirmPassword: 'different' }).success, false);
  assert.equal(registerSchema.safeParse({ ...data, agreeTerms: false }).success, false);
  assert.equal(
    registerSchema.safeParse({
      ...data,
      password: '界'.repeat(25),
      confirmPassword: '界'.repeat(25),
    }).success,
    false,
  );
  assert.equal(
    loginSchema.safeParse({ email: data.email, password: ' ', rememberMe: false }).success,
    false,
  );
  assert.equal(verifyEmailSchema.safeParse({ email: data.email, otp: '012345' }).success, true);
  assert.equal(verifyEmailSchema.safeParse({ email: data.email, otp: 'abcdef' }).success, false);
});

test('return URLs stay same-origin and system errors do not expose server details', () => {
  const app = loadApp();
  const { safeReturnPath } = app.load(resolve(root, 'features/auth/auth-navigation'));
  for (const path of [
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/login',
    'javascript:alert(1)',
  ])
    assert.equal(safeReturnPath(path), '/');
  assert.equal(
    safeReturnPath('/admin/categories-course?page=2'),
    '/admin/categories-course?page=2',
  );
  const { getApiError } = app.load(resolve(root, 'lib/api-error'));
  const error = new axios.AxiosError('secret', '', undefined, null, {
    status: 500,
    data: { message: 'secret stack trace' },
  });
  assert.equal(getApiError(error).message.includes('secret'), false);
});
