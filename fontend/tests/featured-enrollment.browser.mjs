import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Run against a local frontend. All backend requests are intercepted.
const origin = process.env.FEATURED_TEST_ORIGIN ?? 'http://localhost:3000';
const profile = await mkdtemp(join(tmpdir(), 'studify-featured-browser-'));
const browser = spawn(
  process.env.AUTH_TEST_BROWSER ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, 'about:blank'],
  { windowsHide: true, stdio: 'ignore' },
);
let socket;
try {
  let port;
  for (let attempt = 0; attempt < 100; attempt++) {
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
  const failures = [];
  const requests = [];
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const callback = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) callback.reject(new Error(JSON.stringify(message.error)));
      else callback.resolve(message.result);
    } else listeners.get(message.method)?.(message.params);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
    });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let attempt = 0; attempt < 150; attempt++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    throw new Error(`Timed out: ${expression}; location=${await evaluate('location.href')}; courses=${await evaluate('document.querySelector("#courses")?.innerText')}; requests=${JSON.stringify(requests)}; failures=${JSON.stringify(failures)}`);
  };
  const courses = [
    { id: 16, title: 'Khóa miễn phí', price: 0 },
    { id: 17, title: 'Khóa có phí', price: 100000 },
    { id: 18, title: 'Khóa chưa công khai', price: 0 },
  ].map((course) => ({
    ...course, slug: `course-${course.id}`, description: 'Mô tả khóa học',
    categoryName: 'N5', lessonCount: 10, thumnailURL: null,
  }));
  let authenticated = false;
  let duplicateFree = false;
  const enrollCalls = [];
  let cartReads = 0;
  listeners.set('Runtime.exceptionThrown', (event) => failures.push(event.exceptionDetails.text));
  listeners.set('Fetch.requestPaused', async ({ requestId, request }) => {
    try {
      const url = new URL(request.url);
      requests.push(`${request.method} ${url.pathname}`);
      if (!url.pathname.startsWith('/api/v1/')) {
        if (url.origin === origin) await send('Fetch.continueRequest', { requestId });
        else await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
        return;
      }
      const headers = [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Access-Control-Allow-Origin', value: origin },
        { name: 'Access-Control-Allow-Credentials', value: 'true' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-XSRF-TOKEN' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
      ];
      let status = 200;
      let body = { data: null };
      if (request.method === 'OPTIONS') status = 204;
      else if (url.pathname.endsWith('/auth/csrf'))
        body = { data: { token: 'test-csrf', headerName: 'X-XSRF-TOKEN' } };
      else if (url.pathname.endsWith('/auth/refresh-token')) {
        if (authenticated)
          body = { data: { access_token: 'test-access', tokenType: 'Bearer', expiresIn: 600,
            user: { id: 4, email: 'student@example.test', name: 'Student' } } };
        else status = 401;
      } else if (url.pathname.endsWith('/auth/login')) {
        authenticated = true;
        body = { data: { access_token: 'test-access', tokenType: 'Bearer', expiresIn: 600,
          user: { id: 4, email: 'student@example.test', name: 'Student' } } };
      } else if (url.pathname.endsWith('/client/courses'))
        body = { data: { content: courses, totalPages: 1 } };
      else if (url.pathname.endsWith('/cart') && request.method === 'GET') {
        cartReads++;
        body = { data: { id: 1, items: [], totalAmount: 0 } };
      } else if (/\/courses\/\d+\/enroll$/.test(url.pathname)) {
        assert.equal(request.method, 'POST');
        assert.equal(request.headers.Authorization, 'Bearer test-access');
        const id = Number(url.pathname.split('/').at(-2));
        enrollCalls.push(id);
        await delay(300);
        if (id === 16 && !duplicateFree)
          body = { data: { Id: 7, courseId: id, courseTitle: courses[0].title,
            userId: 4, enrollAt: '2026-10-04T05:48:44Z', completedAt: null,
            progressPercent: 0 } };
        else if (id === 17) body = '';
        else {
          status = 400;
          body = { statusCode: 400,
            message: id === 16 ? 'Bạn đã đăng ký course này' : 'Course chưa được công khai' };
        }
      }
      await send('Fetch.fulfillRequest', {
        requestId, responseCode: status, responseHeaders: headers,
        body: Buffer.from(status === 204 ? '' : typeof body === 'string' ? body : JSON.stringify(body)).toString('base64'),
      });
    } catch (error) {
      failures.push(error.message);
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
  const button = (name) => `Array.from(document.querySelectorAll('#courses button')).find(button => button.textContent.includes(${JSON.stringify(name)}))`;

  await navigate('/');
  await waitFor('document.querySelectorAll("#courses article").length === 3');
  assert.equal(enrollCalls.length, 0);
  await evaluate(`${button('Đăng ký học')}.click()`);
  await waitFor('location.pathname === "/login"');
  assert.equal(enrollCalls.length, 0);
  assert.equal(await evaluate('new URLSearchParams(location.search).get("next")'), '/');

  await evaluate('document.getElementById("login-email").focus()');
  await send('Input.insertText', { text: 'student@example.test' });
  await evaluate('document.getElementById("login-password").focus()');
  await send('Input.insertText', { text: 'password123' });
  await evaluate('document.querySelector("form").requestSubmit()');
  await waitFor('location.pathname === "/"');
  await waitFor('document.querySelectorAll("#courses article").length === 3');
  await waitFor('document.querySelector("#courses button").disabled === false');
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width, height, deviceScaleFactor: 1, mobile: width < 600,
    });
    await delay(100);
    assert.equal(await evaluate('Array.from(document.querySelectorAll("#courses article")).every(card => { const rect = card.getBoundingClientRect(); return rect.left >= 0 && rect.right <= innerWidth && card.querySelector("a") && card.querySelector("button"); })'), true);
  }
  await evaluate(`{ const target = ${button('Đăng ký học')}; target.click(); target.click(); }`);
  await waitFor(`${button('Đã đăng ký học')} !== undefined`);
  assert.deepEqual(enrollCalls, [16]);
  await evaluate(`{ const target = ${button('Thêm vào giỏ hàng')}; target.click(); target.click(); }`);
  await waitFor(`${button('Đã thêm vào giỏ hàng')} !== undefined`);
  assert.deepEqual(enrollCalls, [16, 17]);
  assert.ok(cartReads >= 2, 'Cart cache was not refreshed');
  await evaluate(`${button('Đăng ký học')}.click()`);
  await waitFor('document.querySelector("[data-sonner-toast][data-type=error]") !== null');
  assert.equal(await evaluate('document.querySelectorAll("#courses article")[2].querySelector("button").textContent.includes("Đăng ký học")'), true);
  assert.deepEqual(enrollCalls, [16, 17, 18]);

  duplicateFree = true;
  await evaluate('document.querySelector("#courses a").click()');
  await waitFor('location.pathname === "/courses"');
  await evaluate('history.back()');
  await waitFor('location.pathname === "/"');
  await waitFor('document.querySelectorAll("#courses article").length === 3');
  await waitFor('document.querySelector("#courses button").disabled === false');
  await evaluate(`${button('Đăng ký học')}.click()`);
  await waitFor(`${button('Đã đăng ký học')} !== undefined`);
  assert.deepEqual(enrollCalls, [16, 17, 18, 16]);
  assert.deepEqual(failures, []);
  process.stdout.write('Featured enrollment browser flows passed.\n');
} finally {
  socket?.close();
  browser.kill();
}
