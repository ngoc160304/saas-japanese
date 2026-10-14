import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Requires a local Next server. All backend requests are intercepted.
const origin = process.env.COURSE_TEST_ORIGIN ?? 'http://localhost:3000';
const profile = await mkdtemp(join(tmpdir(), 'studify-course-browser-'));
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
  const course = (id, price) => ({
    id,
    price,
    title: id === 10 ? 'Khóa học miễn phí' : 'Khóa học trả phí',
    slug: `course-${id}`,
    description: 'Khóa học thử nghiệm',
    categoryName: 'JLPT',
    lessonCount: 0,
    totalDurationMinutes: 0,
    thumnailURL: null,
    updatedAt: '2026-01-01T00:00:00Z',
  });
  let authenticated = false;
  let userId = 1;
  let checkFails = false;
  let enrollmentMode = 'success';
  let enrollmentCalls = 0;
  let cartCalls = 0;
  const enrollmentsByUser = new Map([
    [1, new Set()],
    [2, new Set()],
  ]);
  const enrolled = () => enrollmentsByUser.get(userId);
  const errors = [];
  listeners.set('Runtime.exceptionThrown', (event) => errors.push(event.exceptionDetails.text));
  listeners.set('Fetch.requestPaused', async ({ requestId, request }) => {
    try {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/api/v1/')) {
        if (url.origin === origin) await send('Fetch.continueRequest', { requestId });
        else await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
        return;
      }
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
      let status = 200;
      let body;
      if (request.method === 'OPTIONS') status = 204;
      else if (url.pathname.endsWith('/auth/csrf')) {
        body = { data: { token: 'test-csrf', headerName: 'X-XSRF-TOKEN' } };
      } else if (url.pathname.endsWith('/auth/refresh-token')) {
        if (authenticated)
          body = {
            data: {
              access_token: 'test-access',
              user: { id: userId, email: 'student@example.test', name: 'Student' },
            },
          };
        else status = 401;
      } else if (url.pathname.endsWith('/auth/logout')) {
        authenticated = false;
        status = 204;
      } else if (/\/client\/courses\/(10|11)\/lessons$/.test(url.pathname)) {
        body = { data: [] };
      } else if (/\/client\/courses\/(10|11)$/.test(url.pathname)) {
        const id = Number(url.pathname.split('/').at(-1));
        body = { data: course(id, id === 10 ? 0 : 100000) };
      } else if (url.pathname.endsWith('/courses/my-courses')) {
        if (!authenticated) status = 401;
        else if (checkFails) status = 503;
        else
          body = {
            data: {
              content: [...enrolled()].map((courseId) => ({
                Id: courseId,
                userId,
                courseId,
                courseTitle: 'Khóa học miễn phí',
                enrollAt: '2026-01-01T00:00:00Z',
                completedAt: null,
                progressPercent: 0,
              })),
              totalPages: 1,
            },
          };
      } else if (url.pathname.endsWith('/courses/10/enroll')) {
        assert.equal(request.method, 'POST');
        assert.equal(request.postData, undefined);
        const requestUserId = userId;
        enrollmentCalls++;
        if (enrollmentMode === 'delayed') await delay(450);
        if (enrollmentMode === 'logout') await delay(1200);
        if (enrollmentMode === 'failure') status = 503;
        else if (enrollmentMode === 'already') {
          enrollmentsByUser.get(requestUserId).add(10);
          status = 400;
          body = { message: 'Bạn đã đăng ký course này' };
        } else if (enrollmentMode === 'unpublished') {
          status = 400;
          body = { message: 'Course chưa được công khai' };
        } else enrollmentsByUser.get(requestUserId).add(10);
      } else if (url.pathname.endsWith('/cart/add/11')) {
        cartCalls++;
        body = {
          data: {
            id: 1,
            items: [
              {
                id: 1,
                courseId: 11,
                courseTitle: 'Khóa học trả phí',
                price: 100000,
                thumbnailUrl: null,
              },
            ],
            totalAmount: 100000,
          },
        };
      } else if (url.pathname.endsWith('/cart')) {
        body = { data: { id: 1, items: [], totalAmount: 0 } };
      } else status = 404;
      if (status >= 400 && !body)
        body = {
          status,
          message: status === 401 ? 'Invalid credentials or token' : 'Service unavailable',
          fieldErrors: {},
        };
      await send('Fetch.fulfillRequest', {
        requestId,
        responseCode: status,
        responseHeaders: headers,
        body: Buffer.from(
          status === 204 || (status === 200 && body === undefined) ? '' : JSON.stringify(body),
        ).toString('base64'),
      });
    } catch (error) {
      if (error.message.includes('Invalid InterceptionId')) return;
      errors.push(error.message);
      await send('Fetch.failRequest', { requestId, errorReason: 'Failed' }).catch(() => undefined);
    }
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  const navigate = async (path) => {
    await send('Page.navigate', { url: origin + path });
    await waitFor('document.readyState === "complete"');
  };
  const button = (text) =>
    `[...document.querySelectorAll('aside button')].find(button => button.textContent.includes(${JSON.stringify(text)}))`;
  const click = (text) => evaluate(`${button(text)}.click()`);

  await navigate('/courses/10');
  await waitFor(`${button('Đăng ký miễn phí')} && !${button('Đăng ký miễn phí')}.disabled`);
  assert.equal(
    await evaluate(`document.querySelector('aside').innerText.includes('Mua ngay')`),
    false,
  );
  await click('Đăng ký miễn phí');
  await waitFor('location.pathname === "/login"');
  assert.equal(await evaluate('new URLSearchParams(location.search).get("next")'), '/courses/10');
  assert.equal(enrollmentCalls, 0);

  authenticated = true;
  await navigate('/courses/10');
  await waitFor(`${button('Đăng ký miễn phí')} && !${button('Đăng ký miễn phí')}.disabled`);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  enrollmentMode = 'delayed';
  await evaluate(
    `(() => { const action = ${button('Đăng ký miễn phí')}; action.click(); action.click(); })()`,
  );
  await waitFor('document.querySelector(\'aside a[href="/student/courses/10"]\') !== null');
  assert.equal(enrollmentCalls, 1);
  assert.equal(
    await evaluate('document.body.innerText.includes("Đăng ký khóa học thành công.")'),
    true,
  );
  await send('Page.reload');
  await waitFor('document.querySelector(\'aside a[href="/student/courses/10"]\') !== null');

  enrolled().clear();
  checkFails = true;
  await navigate('/courses/10');
  await waitFor('document.querySelector(\'aside [role="alert"]\') !== null');
  assert.equal(await evaluate(`${button('Đăng ký miễn phí')}.disabled`), true);
  checkFails = false;
  await click('Thử lại');
  await waitFor(`${button('Đăng ký miễn phí')} && !${button('Đăng ký miễn phí')}.disabled`);
  enrollmentMode = 'failure';
  await click('Đăng ký miễn phí');
  await waitFor('document.querySelector("[data-sonner-toast][data-type=error]") !== null');
  assert.equal(await evaluate(`${button('Đăng ký miễn phí')}.disabled`), false);
  enrollmentMode = 'already';
  await click('Đăng ký miễn phí');
  await waitFor('document.querySelector(\'aside a[href="/student/courses/10"]\') !== null');

  enrolled().clear();
  await navigate('/courses/10');
  await waitFor(`${button('Đăng ký miễn phí')} && !${button('Đăng ký miễn phí')}.disabled`);
  enrollmentMode = 'unpublished';
  await click('Đăng ký miễn phí');
  await waitFor('document.body.innerText.includes("Khóa học chưa được công khai.")');
  assert.equal(await evaluate(`${button('Đăng ký miễn phí')}.disabled`), false);

  await navigate('/courses/11');
  await waitFor(`${button('Thêm vào giỏ hàng')} && !${button('Thêm vào giỏ hàng')}.disabled`);
  await click('Thêm vào giỏ hàng');
  await waitFor('document.body.innerText.includes("Đã thêm khóa học vào giỏ hàng.")');
  assert.equal(cartCalls, 1);
  assert.equal(
    await evaluate('document.querySelector(\'aside\').innerText.includes("Mua ngay")'),
    true,
  );

  await navigate('/courses/10');
  await waitFor(`${button('Đăng ký miễn phí')} && !${button('Đăng ký miễn phí')}.disabled`);
  enrollmentMode = 'logout';
  await click('Đăng ký miễn phí');
  await evaluate('document.querySelector(\'button[aria-label^="Mở menu tài khoản"]\').click()');
  await waitFor(
    '[...document.querySelectorAll("button")].some(button => button.textContent.includes("Đăng xuất"))',
  );
  await evaluate(
    '[...document.querySelectorAll("button")].find(button => button.textContent.includes("Đăng xuất")).click()',
  );
  await waitFor('location.pathname === "/login"');
  userId = 2;
  authenticated = true;
  await navigate('/courses/10');
  await waitFor(`${button('Đăng ký miễn phí')} && !${button('Đăng ký miễn phí')}.disabled`);
  await delay(1400);
  assert.equal(
    await evaluate('document.body.innerText.includes("Đăng ký khóa học thành công.")'),
    false,
  );
  assert.equal(
    await evaluate('document.querySelector(\'aside a[href="/student/courses/10"]\') !== null'),
    false,
  );
  assert.deepEqual(errors, []);
  process.stdout.write(
    'Course enrollment browser checks passed: anonymous login return, empty success, duplicate click, refresh, lookup retry, enrollment retry, already enrolled, unpublished course, paid cart, and logout during a pending request.\n',
  );
} finally {
  socket?.close();
  browser.kill();
}
