import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Exercises the actual built app with backend-contract responses intercepted in Chrome.
const origin = process.env.COURSE_DETAIL_TEST_ORIGIN ?? 'http://localhost:3100';
const profile = await mkdtemp(join(tmpdir(), 'studyjlpt-course-detail-browser-'));
const browser = spawn(
  process.env.COURSE_DETAIL_TEST_BROWSER ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
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
  for (let index = 0; index < 100; index++) {
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
    if (result.exceptionDetails)
      throw new Error(
        result.exceptionDetails.exception?.description ?? result.exceptionDetails.text,
      );
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let index = 0; index < 200; index++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    throw new Error(`Timed out: ${expression}`);
  };
  const navigate = async (path) => {
    await send('Page.navigate', { url: origin + path });
    await waitFor('document.readyState === "complete"');
  };
  const textIncludes = (text) => `document.body.innerText.includes(${JSON.stringify(text)})`;
  const button = `document.querySelector('aside button')`;
  const clickAdd = async () => {
    await waitFor(`${button} && !${button}.disabled`);
    await evaluate(`${button}.click()`);
  };
  const viewport = (width, height) =>
    send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });
  const screenshot = async (name) => {
    const result = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    await writeFile(join(profile, name + '.png'), Buffer.from(result.data, 'base64'));
  };

  const errors = [];
  const addRequests = [];
  const publicRequests = [];
  let authenticated = true;
  let authDelay = 0;
  let courseMode = 'success';
  let lessonMode = 'success';
  let addMode = 'success';
  let cartItems = [];
  const session = {
    access_token: 'browser-test',
    tokenType: 'Bearer',
    expiresIn: 600,
    user: { id: 1, name: 'Learner', email: 'learner@example.test', role: 'student' },
  };
  listeners.set('Runtime.exceptionThrown', ({ exceptionDetails }) =>
    errors.push(exceptionDetails.text),
  );
  listeners.set('Fetch.requestPaused', async ({ requestId, request }) => {
    try {
      const url = new URL(request.url);
      let status = 200;
      let data = {};
      let message;
      if (request.method === 'OPTIONS') status = 204;
      else if (url.pathname.endsWith('/auth/csrf'))
        data = { token: 'test', headerName: 'X-XSRF-TOKEN' };
      else if (url.pathname.endsWith('/auth/refresh-token')) {
        await delay(authDelay);
        status = authenticated ? 200 : 401;
        data = session;
      } else if (url.pathname.endsWith('/auth/login')) {
        authenticated = true;
        data = session;
      } else if (/\/client\/courses\/\d+\/lessons$/.test(url.pathname)) {
        publicRequests.push(url.pathname);
        await delay(200);
        if (lessonMode === 'error') status = 500;
        data =
          lessonMode === 'empty'
            ? []
            : [
                {
                  id: 901,
                  title: 'Bài học thật thứ nhất',
                  slug: 'lesson-one',
                  durationMinutes: 45,
                },
                {
                  id: 902,
                  title: 'Bài học chưa có thời lượng',
                  slug: 'lesson-two',
                  durationMinutes: null,
                },
              ];
      } else if (/\/client\/courses\/\d+$/.test(url.pathname)) {
        publicRequests.push(url.pathname);
        const id = Number(url.pathname.split('/').at(-1));
        await delay(200);
        status = courseMode === 'missing' ? 404 : courseMode === 'error' ? 500 : 200;
        data = {
          id,
          title: `Khóa học API ${id}`,
          slug: `course-${id}`,
          description: 'Mô tả từ API',
          categoryName: 'JLPT N3',
          lessonCount: lessonMode === 'empty' ? 0 : 2,
          totalDurationMinutes: lessonMode === 'empty' ? 0 : 45,
          price: 499000,
          thumnailURL: null,
          updatedAt: '2026-10-01T00:00:00Z',
        };
      } else if (/\/cart\/add\/\d+$/.test(url.pathname)) {
        addRequests.push({ method: request.method, path: url.pathname, body: request.postData });
        await delay(650);
        if (addMode === 'network') {
          await send('Fetch.failRequest', { requestId, errorReason: 'InternetDisconnected' });
          return;
        }
        const messages = {
          duplicate: 'Chương trình học đã có trong giỏ hàng',
          enrolled: 'Bạn đã đăng ký course này',
          unpublished: 'Course chưa được công khai',
          missing: 'Course không tồn tại',
        };
        if (addMode === 'unauthorized') {
          authenticated = false;
          status = 401;
        } else if (addMode === 'server') status = 500;
        else if (messages[addMode]) {
          status = addMode === 'missing' ? 404 : 400;
          message = messages[addMode];
        } else {
          const courseId = Number(url.pathname.split('/').at(-1));
          cartItems = [
            {
              id: 301,
              courseId,
              courseTitle: `Khóa học API ${courseId}`,
              price: 499000,
              thumbnailUrl: null,
            },
          ];
        }
        data = { id: 1, items: cartItems, totalAmount: cartItems.length * 499000 };
      } else if (url.pathname.endsWith('/cart')) {
        data = { id: 1, items: cartItems, totalAmount: cartItems.length * 499000 };
      } else {
        status = 404;
      }
      await send('Fetch.fulfillRequest', {
        requestId,
        responseCode: status,
        responseHeaders: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'Access-Control-Allow-Origin', value: origin },
          { name: 'Access-Control-Allow-Credentials', value: 'true' },
          {
            name: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-XSRF-TOKEN',
          },
          { name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
        ],
        body: Buffer.from(
          status === 204
            ? ''
            : JSON.stringify(
                status >= 400
                  ? { status, message: message ?? 'Request failed', fieldErrors: {} }
                  : { statusCode: 200, error: null, message: 'OK', data },
              ),
        ).toString('base64'),
      });
    } catch (error) {
      // Navigation/query cancellation can discard an intercepted request while its delay is pending.
      if (error.message.includes('Invalid InterceptionId')) return;
      errors.push(error.message);
      await send('Fetch.failRequest', { requestId, errorReason: 'Failed' }).catch(() => undefined);
    }
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/v1/*' }] });
  await viewport(1440, 1000);
  await navigate('/courses/42');
  await waitFor(textIncludes('Bài học thật thứ nhất'));
  assert.equal(addRequests.length, 0);
  assert.ok(publicRequests.includes('/api/v1/client/courses/42/lessons'));
  assert.equal(await evaluate(textIncludes('Khóa học API 42')), true);
  assert.equal(await evaluate(textIncludes('Chưa có thời lượng')), true);
  assert.equal(await evaluate(textIncludes('Cam kết hoàn tiền')), false);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  assert.equal(
    await evaluate("getComputedStyle(document.querySelector('aside').parentElement).position"),
    'sticky',
  );
  await screenshot('desktop');
  await evaluate(`for(let i=0;i<12;i++) ${button}.click()`);
  await waitFor(`${button}.disabled && ${button}.textContent.includes('Đang thêm…')`);
  await waitFor(textIncludes('Đã thêm khóa học vào giỏ hàng.'));
  assert.equal(addRequests.length, 1);
  assert.deepEqual(addRequests[0], {
    method: 'POST',
    path: '/api/v1/cart/add/42',
    body: undefined,
  });
  assert.equal(await evaluate('location.pathname'), '/courses/42');
  await waitFor(`document.querySelector('a[aria-label="Giỏ hàng, 1 khóa học"]')`);
  await evaluate(`document.querySelector('a[aria-label="Giỏ hàng, 1 khóa học"]').click()`);
  await waitFor(`location.pathname === '/cart'`);
  await waitFor(textIncludes('Khóa học API 42'));
  assert.equal(addRequests.length, 1);

  await viewport(390, 844);
  await navigate('/courses/7');
  await waitFor(textIncludes('Bài học thật thứ nhất'));
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  assert.equal(
    await evaluate(
      "document.querySelector('aside').getBoundingClientRect().top < document.querySelector('[aria-labelledby=syllabus-title]').getBoundingClientRect().top",
    ),
    true,
  );
  await screenshot('mobile');
  for (const [mode, message] of [
    ['duplicate', 'Chương trình học đã có trong giỏ hàng'],
    ['enrolled', 'Bạn đã đăng ký khóa học này.'],
    ['unpublished', 'Khóa học chưa được công khai.'],
    ['missing', 'Khóa học không còn khả dụng.'],
    ['network', 'Không thể kết nối máy chủ.'],
    ['server', 'Dịch vụ tạm thời gián đoạn.'],
  ]) {
    addMode = mode;
    await clickAdd();
    await waitFor(textIncludes(message));
    await waitFor(`!${button}.disabled`);
    assert.equal(
      await evaluate(
        `[...document.querySelectorAll('[data-sonner-toast]')].filter(el => el.textContent.includes(${JSON.stringify(message)})).length`,
      ),
      1,
    );
  }
  addMode = 'success';
  await clickAdd();
  await waitFor(`!${button}.disabled`);
  assert.equal(addRequests.at(-1).path, '/api/v1/cart/add/7');

  authenticated = false;
  authDelay = 500;
  const beforeLogin = addRequests.length;
  await navigate('/courses/42');
  assert.equal(await evaluate(`!${button} || ${button}.disabled`), true);
  await waitFor(textIncludes('Bài học thật thứ nhất'));
  await clickAdd();
  await waitFor("location.pathname === '/login'");
  assert.equal(await evaluate("new URLSearchParams(location.search).get('next')"), '/courses/42');
  assert.equal(addRequests.length, beforeLogin);
  await waitFor(
    "document.querySelector('#login-email') && !document.querySelector('fieldset').disabled",
  );
  await evaluate(`(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    for (const [id, value] of [['login-email', 'learner@example.test'], ['login-password', 'Test-password-123!']]) {
      const input = document.getElementById(id);
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    document.querySelector('form').requestSubmit();
  })()`);
  await waitFor("location.pathname === '/courses/42'");
  await waitFor(textIncludes('Bài học thật thứ nhất'));
  assert.equal(addRequests.length, beforeLogin, 'returning from login must not add automatically');
  addMode = 'unauthorized';
  await clickAdd();
  await waitFor("location.pathname === '/login'");
  assert.equal(
    await evaluate("document.querySelectorAll('[data-sonner-toast][data-type=error]').length >= 1"),
    true,
  );

  authenticated = true;
  authDelay = 0;
  courseMode = 'missing';
  await navigate('/courses/404');
  await waitFor(textIncludes('Khóa học không còn khả dụng'));
  assert.equal(await evaluate("document.querySelector('aside') === null"), true);
  courseMode = 'error';
  await navigate('/courses/42');
  await waitFor(textIncludes('Không thể tải khóa học'));
  courseMode = 'success';
  await evaluate(
    "[...document.querySelectorAll('button')].find(el => el.textContent === 'Thử lại').click()",
  );
  await waitFor(textIncludes('Bài học thật thứ nhất'));
  lessonMode = 'error';
  await navigate('/courses/42');
  await waitFor(textIncludes('Thử lại danh sách bài học'));
  lessonMode = 'empty';
  await evaluate(
    "[...document.querySelectorAll('button')].find(el => el.textContent.includes('Thử lại danh sách bài học')).click()",
  );
  await waitFor(textIncludes('Chưa có bài học công khai'));
  assert.deepEqual(errors, []);
  process.stdout.write(
    `Course detail browser passed: API data, IDs/method/body, auth/login return, rapid clicks, pending, success/cache/badge/cart, failures/retry, empty/unavailable, desktop/mobile. Screenshots: ${profile}\n`,
  );
} finally {
  socket?.close();
  browser.kill();
}
