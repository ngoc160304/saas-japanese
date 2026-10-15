import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Chrome/CDP fallback when Playwright MCP is unavailable. All API traffic is intercepted;
// microphone input is synthetic and no provider, paid API, or real LiveKit server is called.
const origin = process.env.STUDENT_TEST_ORIGIN ?? 'http://localhost:3000';
const profile = await mkdtemp(join(tmpdir(), 'studify-student-browser-'));
const browser = spawn(
  process.env.STUDENT_TEST_BROWSER ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
    '--remote-debugging-port=0',
    '--user-data-dir=' + profile,
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
  const tabs = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
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
    const response = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
    return response.result.value;
  };
  const waitFor = async (expression) => {
    for (let i = 0; i < 900; i++) {
      if (await evaluate('Boolean(' + expression + ')')) return;
      await delay(100);
    }
    throw new Error('Timed out: ' + expression);
  };
  const errors = [];
  let authenticated = false;
  let createRequests = 0;
  const joinRequests = [];
  const apiRequests = [];
  listeners.set('Runtime.exceptionThrown', (event) => errors.push(event.exceptionDetails.text));
  listeners.set('Runtime.consoleAPICalled', (event) => {
    if (
      event.type === 'error' &&
      event.args.some((arg) => /hydrated|hydration/i.test(arg.value ?? ''))
    )
      errors.push('Hydration mismatch');
  });
  listeners.set('Fetch.requestPaused', async ({ requestId, request }) => {
    try {
      const url = new URL(request.url);
      const isSpring = url.pathname.startsWith('/api/v1/');
      const isSpeaking = ['/create-room', '/join-room', '/end-room'].includes(url.pathname);
      if (!isSpring && !isSpeaking) {
        if (url.origin === origin) await send('Fetch.continueRequest', { requestId });
        else await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
        return;
      }
      apiRequests.push({ path: url.pathname, method: request.method });
      let status = 200;
      let body = { data: null };
      if (request.method === 'OPTIONS') status = 204;
      else if (url.pathname.endsWith('/auth/csrf'))
        body = { data: { token: 'browser-test-csrf', headerName: 'X-XSRF-TOKEN' } };
      else if (url.pathname.endsWith('/auth/refresh-token')) {
        if (authenticated)
          body = {
            data: {
              access_token: 'browser-test-access',
              tokenType: 'Bearer',
              expiresIn: 600,
              user: { id: 42, name: 'Browser Student', email: 'student@example.test' },
            },
          };
        else status = 401;
      } else if (url.pathname.endsWith('/auth/logout')) {
        authenticated = false;
        status = 204;
      } else if (!authenticated) status = 401;
      else if (url.pathname.endsWith('/student/dashboard'))
        body = {
          data: {
            enrolledCourses: 1,
            notStartedCourses: 1,
            inProgressCourses: 0,
            completedCourses: 0,
          },
        };
      else if (url.pathname.endsWith('/courses/my-courses'))
        body = {
          data: {
            content: [
              {
                Id: 10,
                userId: 42,
                courseId: 3,
                courseTitle: 'Actual API Course',
                enrollAt: '2026-10-01T00:00:00Z',
                completedAt: null,
                progressPercent: 0,
              },
            ],
            totalPages: 1,
            totalElements: 1,
            pageable: { pageNumber: 0 },
          },
        };
      else if (url.pathname.endsWith('/speaking/topics')) {
        // The local catalog must render even while the former endpoint is unavailable.
        status = 503;
      } else if (url.pathname === '/create-room') {
        createRequests++;
        assert.equal(request.headers.Authorization, undefined);
        body = { name: 'browser-room-1' };
      } else if (url.pathname === '/join-room') {
        joinRequests.push(JSON.parse(request.postData));
        status = 503;
      } else if (url.pathname === '/end-room') {
        body = { success: true, session_result: null };
      } else status = 404;
      if (status >= 400)
        body = {
          statusCode: status,
          message: 'Dịch vụ kiểm thử tạm thời không khả dụng',
          fieldErrors: {},
        };
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
        body: Buffer.from(status === 204 ? '' : JSON.stringify(body)).toString('base64'),
      });
    } catch (error) {
      errors.push(error.message);
      await send('Fetch.failRequest', { requestId, errorReason: 'Failed' });
    }
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
    window.__speakingTracks = [];
    if (navigator.mediaDevices) {
      const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (...args) => {
        const stream = await original(...args);
        window.__speakingTracks.push(...stream.getTracks());
        return stream;
      };
    }
  `,
  });
  const navigate = async (path) => {
    await send('Page.navigate', { url: origin + path });
    await waitFor('document.readyState === "complete"');
  };
  const screenshot = async (name, width, height) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });
    await delay(250);
    assert.equal(
      await evaluate('document.documentElement.scrollWidth <= innerWidth'),
      true,
      name + ': horizontal overflow',
    );
    const result = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
    });
    await writeFile(join(profile, name + '.png'), Buffer.from(result.data, 'base64'));
  };

  await navigate('/speaking');
  await waitFor('location.pathname === "/login"');
  assert.equal(
    await evaluate('new URLSearchParams(location.search).get("next")'),
    '/student/speaking',
  );

  authenticated = true;
  await navigate('/student/dashboard');
  await waitFor('document.body.innerText.includes("Actual API Course")');
  assert.equal(await evaluate('document.body.innerText.includes("Browser Student")'), true);
  assert.equal(
    await evaluate('document.body.innerText.includes("Chưa có dữ liệu thời lượng học")'),
    true,
  );
  assert.equal(await evaluate('document.querySelectorAll("main").length'), 1);
  await screenshot('dashboard-desktop', 1440, 1000);
  await screenshot('dashboard-mobile', 390, 844);

  await navigate('/student/speaking');
  await waitFor('document.querySelectorAll("main button[aria-pressed]").length === 6');
  assert.equal(await evaluate('document.querySelectorAll("main").length'), 1);
  assert.deepEqual(
    await evaluate(
      '[...document.querySelectorAll("main button[aria-pressed]")].map(button => button.querySelector(\'[data-slot="card-title"]\').textContent)',
    ),
    ['Công việc', 'Học tập', 'Du lịch', 'Đời sống', 'Mua sắm', 'Giao tiếp'],
  );
  assert.equal(
    await evaluate(
      '[...document.querySelectorAll("button")].find(button => button.textContent.includes("Bắt đầu hội thoại")).disabled',
    ),
    true,
  );
  assert.equal(
    await evaluate(
      'document.querySelector(\'a[href="/student/speaking"][aria-current="page"]\') !== null',
    ),
    true,
  );
  await screenshot('speaking-topics-mobile', 390, 844);
  await screenshot('speaking-topics-desktop', 1440, 1000);
  assert.equal(createRequests, 0);
  await evaluate(
    '[...document.querySelectorAll("main button[aria-pressed]")].find(button => button.textContent.includes("Công việc")).click()',
  );
  await evaluate(
    `const button = [...document.querySelectorAll("button")].find(button => button.textContent.includes("Bắt đầu hội thoại")); button.click(); button.click();`,
  );
  await waitFor('document.body.innerText.includes("Không kết nối được dịch vụ hội thoại")');
  assert.equal(createRequests, 1, 'Duplicate start requests');
  assert.deepEqual(joinRequests, [
    {
      room_name: 'browser-room-1',
      user_id: '42',
      user_name: 'Browser Student',
      topic: {
        id: 'work',
        title: 'Công việc',
        description: 'Luyện giao tiếp trong môi trường công sở',
      },
    },
  ]);
  await waitFor(
    'window.__speakingTracks.length > 0 && window.__speakingTracks.every(track => track.readyState === "ended")',
  );
  await screenshot('speaking-session-error-desktop', 1440, 1000);

  await navigate('/student/speaking');
  await waitFor('document.querySelectorAll("main button[aria-pressed]").length === 6');
  await evaluate(
    '[...document.querySelectorAll("button")].find(button => button.textContent.includes("Đăng xuất")).click()',
  );
  await waitFor('location.pathname === "/login"');
  assert.equal(
    apiRequests.some(
      (request) => request.path === '/api/v1/speaking/topics' && request.method === 'GET',
    ),
    false,
    'Static topics must not request the topic-list endpoint',
  );
  assert.ok(
    apiRequests.some((request) => request.path === '/create-room' && request.method === 'POST'),
  );
  assert.deepEqual(errors, []);
  process.stdout.write(
    'PASS (mocked APIs): canonical redirect/auth protection, profile/course rendering, desktop/mobile overflow, Speaking navigation/active state, six static topics without topic API requests, current-user join identity, duplicate-start guard, microphone release on API failure, and logout.\nScreenshots: ' +
      profile +
      '\n',
  );
} finally {
  socket?.close();
  browser.kill();
}
