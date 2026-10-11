import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Run against a local Next server. API responses are mocked at the network boundary.
const origin = process.env.LESSON_TEST_ORIGIN ?? 'http://localhost:3000';
const browserPath =
  process.env.AUTH_TEST_BROWSER ??
  [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].find(existsSync);
assert.ok(browserPath, 'Chromium browser unavailable');
const profile = await mkdtemp(join(tmpdir(), 'studify-lesson-phase1-'));
const browser = spawn(
  browserPath,
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
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
      break;
    } catch {
      await delay(100);
    }
  }
  assert.ok(port, 'Chromium did not start');
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(pages.find((page) => page.type === 'page').webSocketDebuggerUrl);
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
    for (let attempt = 0; attempt < 200; attempt += 1) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    throw new Error(`Timed out: ${expression}`);
  };
  const navigate = (path) => send('Page.navigate', { url: origin + path });
  const lesson = (id, overrides = {}) => ({
    id,
    courseId: 7,
    title: `Lesson ${id}`,
    slug: `lesson-${id}`,
    grammar:
      id === 21
        ? '<h2 onclick="window.injected=true">Real grammar 21</h2><script>window.injected=true</script>'
        : null,
    durationMinutes: id === 21 ? 35 : null,
    isPublished: id === 21,
    isDeleted: false,
    videoMediaId: null,
    videoUrl: id === 21 ? 'https://example.test/lecture.mp4' : null,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  });
  const lessons = [
    lesson(21),
    ...Array.from({ length: 11 }, (_, index) => lesson(index + 23)),
    lesson(22),
  ];
  const course = (id) => ({
    id,
    title: `Course ${id}`,
    slug: `course-${id}`,
    description: '',
    published: true,
    categoryName: null,
    lessonCount: 13,
    price: 0,
    thumnailURL: null,
    createdAt: null,
  });
  const requests = [];
  let failVocab = true;
  listeners.set('Fetch.requestPaused', async ({ requestId, request }) => {
    try {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/api/v1/')) {
        if (url.origin === origin) await send('Fetch.continueRequest', { requestId });
        else await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
        return;
      }
      requests.push(`${request.method} ${url.pathname}${url.search}`);
      let status = 200;
      let body;
      if (request.method === 'OPTIONS') status = 204;
      else if (url.pathname.endsWith('/auth/csrf'))
        body = { data: { token: 'test-csrf', headerName: 'X-XSRF-TOKEN' } };
      else if (url.pathname.endsWith('/auth/refresh-token'))
        body = {
          data: {
            access_token: 'test-access',
            tokenType: 'Bearer',
            expiresIn: 600,
            user: { id: 1, name: 'Admin', email: 'admin@example.test' },
          },
        };
      else if (/\/courses\/(7|8)$/.test(url.pathname))
        body = { data: course(Number(url.pathname.split('/').at(-1))) };
      else if (url.pathname.endsWith('/courses/10')) {
        status = 403;
        body = { status, message: 'Forbidden' };
      } else if (/\/lessons\/\d+$/.test(url.pathname)) {
        const id = Number(url.pathname.split('/').at(-1));
        if (id === 22) await delay(350);
        const item = lessons.find((candidate) => candidate.id === id);
        if (item) body = { data: item };
        else {
          status = 404;
          body = { status, message: 'Lesson không tồn tại' };
        }
      } else if (url.pathname.endsWith('/lessons')) {
        const page = Number(url.searchParams.get('page'));
        body = {
          data: {
            content: lessons.slice(page * 12, (page + 1) * 12),
            totalPages: 2,
            totalElements: 13,
            number: page,
            size: 12,
          },
        };
      } else if (url.pathname.endsWith('/vocabularies')) {
        if (failVocab && url.searchParams.get('lessonId') === '22') {
          failVocab = false;
          status = 503;
          body = { status, message: 'Unavailable' };
        } else
          body = {
            data: {
              content:
                url.searchParams.get('lessonId') === '22'
                  ? [
                      {
                        id: 1,
                        lessonId: 22,
                        word: '学生',
                        reading: 'がくせい',
                        meaningVi: 'sinh viên',
                        exampleSentenceJp: null,
                        exampleSentenceVi: null,
                        partOfSpeech: 'Danh từ',
                      },
                    ]
                  : [],
              totalPages: 1,
            },
          };
      } else if (url.pathname.endsWith('/kanjis'))
        body = {
          data: {
            content:
              url.searchParams.get('lessonId') === '22'
                ? [
                    {
                      id: 1,
                      lessonId: 22,
                      kanji: '学',
                      onyomi: 'ガク',
                      kunyomi: null,
                      meaningVi: 'học',
                      strokeCount: 8,
                      exampleWords: null,
                    },
                  ]
                : [],
            totalPages: 1,
          },
        };
      else {
        status = 404;
        body = { status, message: 'Unexpected test request' };
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
        body: Buffer.from(status === 204 ? '' : JSON.stringify(body)).toString('base64'),
      });
    } catch (error) {
      await send('Fetch.failRequest', { requestId, errorReason: 'Failed' });
      throw error;
    }
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await navigate('/admin/courses/7/lessons/21?tab=grammar&keep=yes');
  await waitFor('document.querySelector("#grammar-heading")');
  assert.equal(
    await evaluate('document.querySelector("h1")?.textContent.includes("Lesson 21")'),
    true,
  );
  await waitFor('document.querySelector("aside")?.textContent.includes("13 available lessons")');
  assert.equal(
    await evaluate('document.querySelector("aside")?.textContent.includes("Lesson 22")'),
    true,
  );
  await waitFor('document.querySelector("iframe")');
  assert.equal(await evaluate('document.querySelector("iframe")?.contentDocument'), null);
  assert.equal(
    await evaluate('document.querySelector("iframe").srcdoc.includes("onclick")'),
    false,
  );
  assert.equal(
    await evaluate('document.querySelector("iframe").srcdoc.includes("<script>")'),
    false,
  );
  await evaluate('document.querySelector("#lesson-content-tab-vocabulary").click()');
  await waitFor('location.search.includes("tab=vocabulary")');
  assert.equal(await evaluate('new URLSearchParams(location.search).get("keep")'), 'yes');
  await evaluate(
    '[...document.querySelectorAll("aside a")].find((a) => a.href.includes("/lessons/22"))?.click()',
  );
  await waitFor('location.pathname.endsWith("/lessons/22")');
  await waitFor('document.querySelector("h1")?.textContent.includes("Lesson 22")');
  assert.equal(
    await evaluate('document.querySelector("h1")?.textContent.includes("Lesson 21")'),
    false,
  );
  assert.equal(await evaluate('document.body.textContent.includes("Chưa có video")'), true);
  assert.equal(
    await evaluate(
      'document.querySelector("#lesson-content-tab-vocabulary").getAttribute("aria-selected")',
    ),
    'true',
  );
  await waitFor('document.querySelector("#lesson-content-panel-vocabulary [role=alert]")');
  assert.ok(requests.some((request) => request.includes('/vocabularies?lessonId=22')));
  assert.equal(
    requests.some((request) => request.includes('/study/lessons/22/vocabularies')),
    false,
  );
  await evaluate(
    'document.querySelector("#lesson-content-panel-vocabulary [role=alert] button").click()',
  );
  await waitFor(
    'document.querySelector("#lesson-content-panel-vocabulary")?.textContent.includes("学生")',
  );
  await evaluate('document.querySelector("#lesson-content-tab-kanji").click()');
  await waitFor(
    'document.querySelector("#lesson-content-panel-kanji")?.textContent.includes("学")',
  );
  assert.ok(requests.some((request) => request.includes('/kanjis?lessonId=22')));
  await evaluate('history.back()');
  await waitFor(
    'document.querySelector("#lesson-content-tab-vocabulary").getAttribute("aria-selected") === "true"',
  );
  await navigate('/admin/courses/8/lessons/21?tab=kanji');
  await waitFor('document.body?.textContent.includes("Bài học không khả dụng")');
  assert.equal(await evaluate('document.querySelector("#grammar-heading")'), null);
  await navigate('/admin/courses/7/lessons/999');
  await waitFor('document.body?.textContent.includes("Bài học không khả dụng")');
  await navigate('/admin/courses/10/lessons/21');
  await waitFor('document.body?.textContent.includes("Không có quyền truy cập")');
  await navigate('/admin/courses/7/lessons/22?tab=quiz');
  await waitFor(
    'document.querySelector("#lesson-content-panel-quiz")?.textContent.includes("Chưa có API quản trị Quiz")',
  );
  assert.equal(
    requests.some((request) => request.includes('/study/lessons/22/quiz')),
    false,
  );
  await navigate('/admin/courses/7/lessons/22?tab=kanji&keep=yes');
  await waitFor(
    'document.querySelector("#lesson-content-tab-kanji")?.getAttribute("aria-selected") === "true"',
  );
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await evaluate(
    '[...document.querySelectorAll("button")].find((button) => button.getAttribute("aria-label") === "Open curriculum")?.click()',
  );
  await waitFor('document.querySelector("[role=dialog]")?.textContent.includes("Lesson 21")');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  const mobileShot = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(profile, 'lesson-mobile.png'), Buffer.from(mobileShot.data, 'base64'));
  await evaluate(
    '[...document.querySelectorAll("[role=dialog] a")].find((link) => link.href.includes("/lessons/21"))?.click()',
  );
  await waitFor('document.querySelector("h1")?.textContent.includes("Lesson 21")');
  await waitFor('!document.querySelector("[role=dialog]")');
  assert.equal(
    await evaluate(
      'document.querySelector("#lesson-content-tab-kanji")?.getAttribute("aria-selected")',
    ),
    'true',
  );
  await evaluate(
    '[...document.querySelectorAll("button")].find((button) => button.getAttribute("aria-label") === "Open curriculum")?.click()',
  );
  await waitFor('document.querySelector("[role=dialog]")');
  await evaluate(
    '[...document.querySelectorAll("[role=dialog] button")].find((button) => button.textContent.includes("Grammar + Video"))?.click()',
  );
  await waitFor('location.search.includes("tab=grammar")');
  await waitFor('!document.querySelector("[role=dialog]")');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await delay(200);
  const desktopShot = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(profile, 'lesson-grammar.png'), Buffer.from(desktopShot.data, 'base64'));
  process.stdout.write(
    `Screenshots: ${profile}\nLesson phase 1 browser checks passed (mocked API).\n`,
  );
} finally {
  socket?.close();
  browser.kill();
}
