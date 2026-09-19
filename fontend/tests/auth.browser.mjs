import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Requires a local Next server. All backend requests are intercepted, never sent.
const origin = process.env.AUTH_TEST_ORIGIN ?? 'http://localhost:3001';
const profile = await mkdtemp(join(tmpdir(), 'studify-auth-browser-'));
const browser = spawn(
  process.env.AUTH_TEST_BROWSER ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { windowsHide: true, stdio: 'ignore' },
);
let socket;
try {
  let port;
  for (let i = 0; i < 100; i++) {
    try {
      port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
      break;
    } catch {
      await delay(100);
    }
  }
  assert.ok(port, 'Chrome did not start');
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let nextId = 0;
  const pending = new Map();
  const listeners = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const callback = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) callback.reject(new Error(JSON.stringify(message.error)));
      else callback.resolve(message.result);
    } else listeners.get(message.method)?.(message.params);
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let i = 0; i < 200; i++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    throw new Error(`Timed out: ${expression}`);
  };
  let authenticated = false;
  let registered = false;
  let verified = false;
  let refreshes = 0;
  let logins = 0;
  let registrations = 0;
  const errors = [];
  listeners.set('Runtime.consoleAPICalled', (event) => {
    if (
      event.type === 'error' &&
      event.args.some((arg) => /hydrated|hydration/i.test(arg.value ?? ''))
    ) {
      errors.push('Hydration mismatch');
    }
  });
  listeners.set('Runtime.exceptionThrown', (event) => errors.push(event.exceptionDetails.text));
  listeners.set('Fetch.requestPaused', async ({ requestId, request }) => {
    try {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/api/v1/')) {
        if (url.origin === origin) await send('Fetch.continueRequest', { requestId });
        else await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
        return;
      }
      let status = 200;
      let body;
      const headers = [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Access-Control-Allow-Origin', value: origin },
        { name: 'Access-Control-Allow-Credentials', value: 'true' },
        {
          name: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization, X-XSRF-TOKEN',
        },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
      ];
      const session = {
        access_token: `browser-test-access-${refreshes}`,
        tokenType: 'Bearer',
        expiresIn: 600,
        user: { id: 1, email: 'student@example.test', name: 'Student' },
      };
      const payload = request.postData ? JSON.parse(request.postData) : {};
      if (request.method === 'OPTIONS') status = 204;
      else if (url.pathname.endsWith('/csrf')) {
        body = { data: { token: 'browser-test-csrf', headerName: 'X-XSRF-TOKEN' } };
        headers.push({
          name: 'Set-Cookie',
          value: 'XSRF-TOKEN=browser-test-csrf; HttpOnly; Path=/; SameSite=Lax',
        });
      } else {
        if (request.method === 'POST')
          assert.equal(request.headers['X-XSRF-TOKEN'], 'browser-test-csrf');
        if (url.pathname.endsWith('/refresh-token')) {
          refreshes++;
          if (authenticated) body = { data: session };
          else status = 401;
        } else if (url.pathname.endsWith('/register')) {
          registrations++;
          await delay(200);
          assert.equal(payload.confirmPassword, undefined);
          assert.equal(payload.agreeTerms, undefined);
          registered = true;
          status = 201;
          body = { data: { email: payload.email, nextAction: 'VERIFY_EMAIL' } };
        } else if (url.pathname.endsWith('/verify-user')) {
          verified = registered && payload.otp === '123456';
          if (verified) body = 'Verify success';
          else status = 400;
        } else if (url.pathname.endsWith('/login')) {
          logins++;
          authenticated = verified && payload.password === 'browser-test-password';
          if (authenticated) {
            body = { data: session };
            headers.push({
              name: 'Set-Cookie',
              value: 'refresh_token=browser-test-cookie; HttpOnly; Path=/api/v1/auth; SameSite=Lax',
            });
          } else status = 401;
        } else if (url.pathname.endsWith('/logout')) {
          authenticated = false;
          status = 204;
          headers.push({
            name: 'Set-Cookie',
            value: 'refresh_token=; HttpOnly; Path=/api/v1/auth; Max-Age=0; SameSite=Lax',
          });
        } else if (authenticated)
          body = { data: { content: [], pageable: { pageNumber: 0 }, totalPages: 0 } };
        else status = 401;
      }
      if (status >= 400)
        body = { status, message: 'Invalid credentials or token', fieldErrors: {} };
      await send('Fetch.fulfillRequest', {
        requestId,
        responseCode: status,
        responseHeaders: headers,
        body: Buffer.from(
          status === 204 ? '' : typeof body === 'string' ? body : JSON.stringify(body),
        ).toString('base64'),
      });
    } catch (error) {
      errors.push(error.message);
      await send('Fetch.failRequest', { requestId, errorReason: 'Failed' });
    }
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  const navigate = async (path) => {
    await send('Page.navigate', { url: origin + path });
    await waitFor('document.readyState === "complete"');
  };
  const fill = async (id, value) => {
    await evaluate(`document.getElementById(${JSON.stringify(id)}).focus()`);
    await send('Input.insertText', { text: value });
  };
  const submit = () => evaluate('document.querySelector("form").requestSubmit()');
  const screenshot = async (name, width, height) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });
    await delay(200);
    assert.equal(
      await evaluate('document.documentElement.scrollWidth <= innerWidth'),
      true,
      `${name}: horizontal overflow`,
    );
    const result = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
    });
    await writeFile(join(profile, name + '.png'), Buffer.from(result.data, 'base64'));
  };

  await navigate('/login');
  await waitFor(
    'document.querySelector("form fieldset") && !document.querySelector("form fieldset").disabled',
  );
  await screenshot('login-desktop', 1440, 1000);
  await screenshot('login-mobile', 390, 844);
  await submit();
  await waitFor('document.getElementById("login-email-error") !== null');
  assert.equal(logins, 0);

  await fill('login-email', 'student@example.test');
  await fill('login-password', 'wrong-password');
  await submit();
  await waitFor('document.querySelector("form [role=alert]") !== null');
  assert.equal(logins, 1);
  assert.equal(
    await evaluate('document.querySelectorAll("[data-sonner-toast][data-type=error]").length'),
    1,
  );

  await navigate('/register?next=/admin/categories-course');
  await waitFor(
    'document.querySelector("form fieldset") && !document.querySelector("form fieldset").disabled',
  );
  await screenshot('register-mobile', 390, 844);
  await screenshot('register-desktop', 1440, 1100);
  await fill('register-name', 'Student');
  await fill('register-email', 'student@example.test');
  await fill('register-password', 'browser-test-password');
  await fill('register-confirm', 'browser-test-password');
  await evaluate('document.querySelector("input[name=agreeTerms]").click()');
  await submit();
  await submit();
  await waitFor('location.pathname === "/verify-email" && document.getElementById("verify-otp")');
  assert.equal(registrations, 1);
  await fill('verify-otp', '123456');
  await submit();
  await waitFor('location.pathname === "/login" && document.getElementById("login-password")');
  await fill('login-password', 'browser-test-password');
  await evaluate('document.querySelector("input[name=rememberMe]").click()');
  await submit();
  await waitFor(
    'location.pathname === "/admin/categories-course" && document.body.innerText.includes("Đăng xuất")',
  );
  assert.equal(logins, 2);
  const beforeReload = refreshes;
  await send('Page.reload');
  await waitFor('document.body.innerText.includes("Đăng xuất")');
  assert.equal(refreshes, beforeReload + 1);
  assert.equal(
    await evaluate('Object.keys(localStorage).length + Object.keys(sessionStorage).length'),
    0,
  );
  assert.equal(await evaluate('document.cookie.includes("refresh_token")'), false);
  await evaluate(
    '[...document.querySelectorAll("button")].find(button => button.textContent.includes("Đăng xuất")).click()',
  );
  await waitFor('location.pathname === "/login" && document.getElementById("login-password")');
  assert.equal(authenticated, false);
  await navigate('/admin/categories-course');
  await waitFor('location.pathname === "/login"');
  assert.deepEqual(errors, []);
  process.stdout.write(
    `Browser auth passed: responsive layouts, validation, register → OTP → login, return URL, reload bootstrap, logout, protected route, no token storage.\nScreenshots: ${profile}\n`,
  );
} finally {
  socket?.close();
  browser.kill();
}
