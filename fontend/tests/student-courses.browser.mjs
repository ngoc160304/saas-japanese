import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Run against a local Next server. Backend requests are intercepted in Chrome.
const origin = process.env.COURSES_TEST_ORIGIN ?? 'http://localhost:3001';
const profile = await mkdtemp(join(tmpdir(), 'studify-courses-browser-'));
const browser = spawn(
  process.env.COURSES_TEST_BROWSER ??
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-allow-origins=*',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { windowsHide: true, stdio: 'ignore' },
);
let socket;
try {
  let port;
  for (let attempt = 0; attempt < 100; attempt += 1) {
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
  const errors = [];
  const consoleWarnings = [];
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const callback = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) callback.reject(new Error(JSON.stringify(message.error)));
      else callback.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') {
      errors.push(message.params.exceptionDetails.text);
    } else if (message.method === 'Runtime.consoleAPICalled') {
      if (message.params.type === 'warning' || message.params.type === 'error') {
        consoleWarnings.push(
          message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '),
        );
      }
    } else if (message.method === 'Fetch.requestPaused') {
      void handleRequest(message.params);
    }
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
    for (let attempt = 0; attempt < 200; attempt += 1) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    throw new Error(
      `Timed out: ${expression}; page: ${await evaluate('location.href + " " + document.body.innerText.slice(0, 500)')}; errors: ${errors.join(', ')}`,
    );
  };
  const courses = Array.from({ length: 13 }, (_, index) => ({
    id: index + 1,
    title: index === 0 ? 'Free Basics' : `Paid Course ${index + 1}`,
    slug: `course-${index + 1}`,
    description: 'Japanese learning course',
    categoryName: 'Japanese',
    lessonCount: 2,
    price: index === 0 ? 0 : 100000,
    thumnailURL: null,
    updatedAt: '2026-01-01T00:00:00Z',
    totalDurationMinutes: 35,
  }));
  const enrollments = Array.from({ length: 12 }, (_, index) => 100 + index).concat(3);
  const cartItems = [];
  let enrollPosts = 0;
  let failList = false;
  let sessionExpired = false;
  const listRequests = [];
  async function handleRequest({ requestId, request }) {
    try {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/api/v1/')) {
        if (url.origin === origin) await send('Fetch.continueRequest', { requestId });
        else await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
        return;
      }
      let status = 200;
      let body = { data: null };
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
      if (request.method === 'OPTIONS') status = 204;
      else if (url.pathname.endsWith('/auth/csrf'))
        body = { data: { token: 'browser-test-csrf', headerName: 'X-XSRF-TOKEN' } };
      else if (url.pathname.endsWith('/auth/refresh-token')) {
        if (sessionExpired) status = 401;
        else
          body = {
            data: {
              access_token: 'browser-test-token',
              tokenType: 'Bearer',
              expiresIn: 600,
              user: { id: 1, email: 'student@example.test', name: 'Student' },
            },
          };
      } else if (url.pathname === '/api/v1/client/courses') {
        if (failList) {
          status = 500;
          failList = false;
        } else {
          const title = (url.searchParams.get('title') ?? '').toLowerCase();
          const pricing = url.searchParams.get('pricing');
          const filtered = courses.filter(
            (course) =>
              course.title.toLowerCase().includes(title) &&
              (pricing === 'free'
                ? course.price === 0
                : pricing === 'paid'
                  ? course.price > 0
                  : true),
          );
          const page = Number(url.searchParams.get('page') ?? 0);
          const size = Number(url.searchParams.get('size') ?? 9);
          const content = filtered.slice(page * size, (page + 1) * size);
          body = {
            data: {
              content,
              number: page,
              size,
              numberOfElements: content.length,
              totalElements: filtered.length,
              totalPages: Math.ceil(filtered.length / size),
              first: page === 0,
              last: (page + 1) * size >= filtered.length,
            },
          };
        }
      } else if (/^\/api\/v1\/client\/courses\/\d+\/lessons$/.test(url.pathname)) {
        body = {
          data: [
            { id: 11, title: 'Lesson One', slug: 'lesson-one', durationMinutes: 20 },
            { id: 12, title: 'Lesson Two', slug: 'lesson-two', durationMinutes: 15 },
          ],
        };
      } else if (/^\/api\/v1\/client\/courses\/\d+$/.test(url.pathname)) {
        const course = courses.find((item) => item.id === Number(url.pathname.split('/').at(-1)));
        if (course) body = { data: course };
        else status = 404;
      } else if (url.pathname === '/api/v1/courses/my-courses') {
        assert.equal(request.method, 'GET');
        assert.equal(request.headers.Authorization, 'Bearer browser-test-token');
        assert.equal(url.searchParams.has('pricing'), false);
        assert.equal(url.searchParams.has('title'), false);
        listRequests.push(url.search);
        const page = Number(url.searchParams.get('page') ?? 0);
        const size = Number(url.searchParams.get('size') ?? 10);
        const courseTitle = (url.searchParams.get('courseTitle') ?? '').toLowerCase();
        const filtered = enrollments.filter((courseId) =>
          `Course ${courseId}`.toLowerCase().includes(courseTitle),
        );
        const content = filtered.slice(page * size, (page + 1) * size).map((courseId) => ({
          Id: courseId + 1000,
          userId: 1,
          courseId,
          courseTitle: courseId === 1 ? 'Free Basics' : `Course ${courseId}`,
          enrollAt: '2026-01-01T00:00:00Z',
          completedAt: courseId === 100 ? '2026-02-01T00:00:00Z' : null,
          progressPercent: courseId === 100 ? 100 : 25,
        }));
        if (failList) {
          status = 500;
          failList = false;
        } else body = {
          data: {
            content,
            number: page,
            size,
            numberOfElements: content.length,
            totalElements: filtered.length,
            totalPages: Math.ceil(filtered.length / size),
            first: page === 0,
            last: (page + 1) * size >= filtered.length,
          },
        };
      } else if (/^\/api\/v1\/courses\/\d+\/enroll$/.test(url.pathname)) {
        assert.equal(request.method, 'POST');
        enrollPosts += 1;
        const courseId = Number(url.pathname.split('/').at(-2));
        if (sessionExpired) status = 401;
        else if (courseId === 1) {
          enrollments.push(courseId);
          body = {
            data: {
              Id: 200,
              userId: 1,
              courseId,
              courseTitle: 'Free Basics',
              enrollAt: '2026-01-01T00:00:00Z',
              completedAt: null,
              progressPercent: 0,
            },
          };
        } else {
          cartItems.push({
            id: 22,
            courseId,
            courseTitle: 'Paid Course 2',
            price: 100000,
            thumbnailUrl: null,
          });
          body = '';
        }
      } else if (url.pathname === '/api/v1/cart') {
        body = { data: { id: 1, items: cartItems, totalAmount: cartItems.length * 100000 } };
      }
      if (status >= 400) body = { statusCode: status, message: 'Unavailable', fieldErrors: {} };
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
  }
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  const navigate = async (path) => {
    await send('Page.navigate', { url: origin + path });
    await waitFor('document.readyState === "complete"');
  };
  await navigate('/student/dashboard');
  await waitFor('document.querySelector(\'a[href="/student/courses"]\') !== null');
  await evaluate('document.querySelector(\'a[href="/student/courses"]\').click()');
  await waitFor(
    'location.pathname === "/student/courses" && document.body.innerText.includes("Course 100")',
  );
  assert.equal(enrollPosts, 0);
  assert.equal(await evaluate('document.body.innerText.includes("Completed Feb 1, 2026")'), true);
  assert.equal(await evaluate('document.body.innerText.includes("100%")'), true);
  assert.equal(await evaluate('document.querySelector(\'a[href="/student/courses/100"]\') !== null'), true);
  assert.equal(listRequests.some((search) => search.includes('page=0') && search.includes('size=9')), true);
  assert.equal(
    await evaluate(
      'document.querySelector(\'a[href="/student/courses"]\').className.includes("ring-sky-500")',
    ),
    true,
  );
  await evaluate(
    'document.querySelector(\'input[placeholder="Search my courses by title…"]\').focus()',
  );
  await send('Input.insertText', { text: 'Course 100' });
  await waitFor(
    'location.search.includes("courseTitle=Course+100") && document.body.innerText.includes("Course 100")',
  );
  assert.equal(listRequests.some((search) => search.includes('courseTitle=Course+100')), true);
  await evaluate(
    'Array.from(document.querySelectorAll("button")).find((button) => button.textContent.includes("Clear search"))?.click()',
  );
  await waitFor('location.search === "" && document.body.innerText.includes("Course 100")');
  await evaluate('document.querySelector(\'button[aria-label="Trang 2"]\').click()');
  await waitFor(
    'location.search.includes("page=2") && document.body.innerText.includes("Course 3")',
  );
  assert.equal(listRequests.some((search) => search.includes('page=1') && search.includes('size=9')), true);
  failList = true;
  await evaluate(
    'document.querySelector(\'input[placeholder="Search my courses by title…"]\').focus()',
  );
  await send('Input.insertText', { text: 'Failure' });
  await waitFor('document.body.innerText.includes("Retry")');
  assert.equal(await evaluate('new URLSearchParams(location.search).has("page")'), false);
  await evaluate(
    'Array.from(document.querySelectorAll("button")).find((button) => button.textContent === "Retry")?.click()',
  );
  await waitFor('document.body.innerText.includes("No courses match your search")');
  await evaluate(
    'Array.from(document.querySelectorAll("button")).find((button) => button.textContent.includes("Clear search"))?.click()',
  );
  await waitFor('location.search === "" && document.body.innerText.includes("Course 100")');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await delay(200);
  const desktop = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  });
  await writeFile(join(profile, 'courses-desktop.png'), Buffer.from(desktop.data, 'base64'));
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await delay(200);
  assert.equal(
    await evaluate('document.documentElement.scrollWidth <= innerWidth'),
    true,
    'mobile list horizontal overflow',
  );
  const mobile = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  });
  await writeFile(join(profile, 'courses-mobile.png'), Buffer.from(mobile.data, 'base64'));
  const savedEnrollments = enrollments.splice(0);
  await navigate('/student/courses?courseTitle=none');
  await waitFor('document.body.innerText.includes("No courses match your search")');
  await evaluate(
    'Array.from(document.querySelectorAll("button")).find((button) => button.textContent.includes("Clear search"))?.click()',
  );
  await waitFor('document.body.innerText.includes("You have no enrolled courses yet")');
  enrollments.push(...savedEnrollments);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await navigate('/student/courses/3');
  await waitFor(
    'document.body.innerText.includes("Already enrolled") && document.body.innerText.includes("Lesson One")',
  );
  assert.equal(enrollPosts, 0);
  await evaluate('document.querySelector(\'a[href="/student/courses"]\').click()');
  await waitFor('location.pathname === "/student/courses" && document.body.innerText.includes("Course 100")');
  await navigate('/student/courses/1');
  await waitFor(
    'location.pathname === "/student/courses/1" && document.body.innerText.includes("Enroll for free") && document.body.innerText.includes("Lesson One")',
  );
  await evaluate(
    'const button = Array.from(document.querySelectorAll("button")).find((item) => item.textContent.includes("Enroll for free")); button.click(); button.click()',
  );
  await waitFor('document.body.innerText.includes("Already enrolled")');
  assert.equal(enrollPosts, 1);
  await navigate('/student/courses?page=2');
  await waitFor('document.body.innerText.includes("Free Basics")');
  assert.equal(await evaluate('document.querySelector(\'a[href="/student/courses/1"]\') !== null'), true);
  await navigate('/student/courses/2');
  await waitFor('document.body.innerText.includes("Add to cart")');
  await evaluate(
    'Array.from(document.querySelectorAll("button")).find((button) => button.textContent.includes("Add to cart")).click()',
  );
  await waitFor('location.pathname === "/cart"');
  assert.equal(enrollPosts, 2);
  await navigate('/student/courses/2');
  await waitFor('document.body.innerText.includes("View cart")');
  assert.equal(await evaluate('document.body.innerText.includes("Already enrolled")'), false);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await delay(200);
  assert.equal(
    await evaluate('document.documentElement.scrollWidth <= innerWidth'),
    true,
    'mobile horizontal overflow',
  );
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await delay(200);
  assert.equal(
    await evaluate('document.documentElement.scrollWidth <= innerWidth'),
    true,
    'desktop horizontal overflow',
  );
  const detail = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  });
  await writeFile(join(profile, 'detail-desktop.png'), Buffer.from(detail.data, 'base64'));
  await navigate('/student/courses/999');
  await waitFor('document.body.innerText.includes("Course unavailable")');
  await navigate('/student/courses/4');
  await waitFor('document.body.innerText.includes("Add to cart")');
  sessionExpired = true;
  await evaluate(
    'Array.from(document.querySelectorAll("button")).find((button) => button.textContent.includes("Add to cart")).click()',
  );
  await waitFor('location.pathname === "/login"');
  assert.deepEqual(errors, []);
  assert.deepEqual(
    consoleWarnings.filter((message) => message.includes('Each child in a list should have a unique')),
    [],
    'React should not warn about enrollment card keys',
  );
  process.stdout.write(`Student courses browser checks passed (mocked API). Captures: ${profile}\n`);
} finally {
  socket?.close();
  browser.kill();
}
