import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Existing repository Chrome/CDP setup. Every API call is intercepted; no live writes.
const origin = process.env.ADMIN_JLPT_TEST_ORIGIN ?? 'http://localhost:3001';
const profile = await mkdtemp(join(tmpdir(), 'studify-admin-jlpt-'));
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
  const pending = new Map(),
    listeners = new Map();
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
    for (let i = 0; i < 200; i++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    throw new Error(`Timed out: ${expression}`);
  };
  const errors = [],
    requests = [];
  let mode = 'admin',
    holdSession = false,
    releaseSession;
  const summary = {
    id: 1,
    level: 'N3',
    title: 'Đề thi JLPT N3 — bộ đề kiểm tra tiếng Nhật',
    description: null,
    totalTimeMinutes: 30,
    status: 'DRAFT',
    hasAttempts: false,
    contentLocked: false,
    sessionCount: 1,
    partCount: 1,
    questionCount: 1,
    passingScore: 95,
    createdAt: '2026-10-15T00:00:00Z',
    updatedAt: '2026-10-15T00:00:00Z',
  };
  const detail = {
    ...summary,
    sessions: [
      {
        id: 2,
        name: 'Kiến thức ngôn ngữ',
        sessionType: 'language_knowledge',
        timeLimitMinutes: 30,
        sortOrder: 0,
        parts: [
          {
            id: 3,
            name: 'Mondai 1',
            instructions: null,
            sortOrder: 0,
            audio: null,
            questions: [
              {
                id: 4,
                questionText: '日本語',
                passageText: null,
                questionType: 'single_choice',
                explanation: null,
                points: 1,
                sortOrder: 0,
                image: null,
                answers: [],
              },
            ],
          },
        ],
      },
    ],
  };
  listeners.set('Runtime.exceptionThrown', (event) => errors.push(event.exceptionDetails.text));
  listeners.set('Fetch.requestPaused', async ({ requestId, request }) => {
    try {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/api/v1/')) {
        await send(
          url.origin === origin ? 'Fetch.continueRequest' : 'Fetch.failRequest',
          url.origin === origin ? { requestId } : { requestId, errorReason: 'BlockedByClient' },
        );
        return;
      }
      let status = 200,
        data;
      if (request.method === 'OPTIONS') status = 204;
      else {
        requests.push({
          path: url.pathname,
          method: request.method,
          params: Object.fromEntries(url.searchParams),
        });
        const path = url.pathname;
        if (path.endsWith('/csrf')) data = { token: 'synthetic-csrf', headerName: 'X-XSRF-TOKEN' };
        else if (path.endsWith('/refresh-token')) {
          if (holdSession)
            await new Promise((resolve) => {
              releaseSession = resolve;
            });
          if (mode === 'anonymous') status = 401;
          else
            data = {
              access_token: 'synthetic-access',
              tokenType: 'Bearer',
              expiresIn: 600,
              user: { id: 1, name: 'Tester', email: 'tester@example.test' },
            };
        } else if (path.endsWith('/admin/jlpt-exams/stats')) {
          if (mode === 'denied') status = 403;
          else if (mode === 'stats-error') status = 500;
          else data = { totalExams: 21, draftExams: 10, publishedExams: 8, archivedExams: 3 };
        } else if (path.endsWith('/admin/jlpt-exams/1')) {
          if (mode === 'missing') status = 404;
          else if (mode === 'detail-denied') status = 403;
          else if (mode === 'expired') status = 401;
          else if (mode === 'empty-structure')
            data = {
              ...summary,
              sessionCount: 0,
              partCount: 0,
              questionCount: 0,
              totalTimeMinutes: 0,
              sessions: [],
            };
          else
            data =
              mode === 'archived'
                ? { ...detail, status: 'ARCHIVED', contentLocked: true, hasAttempts: true }
                : detail;
        } else if (path.endsWith('/admin/jlpt-exams')) {
          if (mode === 'list-error') status = 500;
          else if (mode === 'list-denied') status = 403;
          else {
            const number = Number(url.searchParams.get('page') ?? 0),
              size = Number(url.searchParams.get('size') ?? 10);
            const rows = mode === 'empty' || number > 2 ? [] : [summary];
            data = {
              content: rows,
              number,
              size,
              numberOfElements: rows.length,
              totalElements: mode === 'empty' ? 0 : 21,
              totalPages: mode === 'empty' ? 0 : 3,
              first: number === 0,
              last: number >= 2,
              empty: !rows.length,
              pageable: {
                pageNumber: number,
                pageSize: size,
                offset: number * size,
                paged: true,
                unpaged: false,
                sort: { empty: false, sorted: true, unsorted: false },
              },
              sort: { empty: false, sorted: true, unsorted: false },
            };
          }
        } else throw new Error(`Unexpected API ${request.method} ${path}`);
      }
      const body =
        status >= 400
          ? {
              status,
              message:
                status === 404
                  ? 'JLPT exam not found'
                  : status === 403
                    ? 'Access denied'
                    : 'Authentication required',
              fieldErrors: {},
              timestamp: '2026-10-15T00:00:00Z',
            }
          : { statusCode: status, error: null, message: 'OK', data };
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
      // Full-page navigation cancels requests paused by CDP on the previous page.
      if (error.message.includes('Invalid InterceptionId')) return;
      errors.push(error.message);
      try {
        await send('Fetch.failRequest', { requestId, errorReason: 'Failed' });
      } catch (failure) {
        if (!failure.message.includes('Invalid InterceptionId')) errors.push(failure.message);
      }
    }
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  const navigate = async (path) => {
    await send('Page.navigate', { url: origin + path });
    await waitFor('document.readyState === "complete"');
  };
  const hasText = (text) => `document.body.innerText.includes(${JSON.stringify(text)})`;
  const protectedCalls = () => requests.filter((r) => r.path.includes('/admin/jlpt-exams'));
  const contentCalls = () => protectedCalls().filter((r) => !r.path.endsWith('/stats'));
  const screenshot = async (name, width) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });
    await delay(200);
    assert.equal(
      await evaluate('document.documentElement.scrollWidth <= innerWidth'),
      true,
      `${name}: horizontal overflow`,
    );
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
    });
    await writeFile(join(profile, `${name}.png`), Buffer.from(shot.data, 'base64'));
  };

  holdSession = true;
  await navigate('/admin/exams');
  for (let i = 0; !releaseSession && i < 100; i++) await delay(100);
  assert.ok(releaseSession);
  assert.equal(protectedCalls().length, 0, 'No protected fetch before auth initialization');
  holdSession = false;
  releaseSession();
  await waitFor(hasText(summary.title));
  await screenshot('list-desktop', 1440);
  await screenshot('list-mobile', 390);
  assert.ok(
    protectedCalls()
      .filter((r) => r.path.endsWith('/stats'))
      .every((r) => Object.keys(r.params).length === 0),
  );

  requests.length = 0;
  await navigate(
    '/admin/exams?page=2&search=日本語&level=N3&status=ARCHIVED&sortKey=title&sortType=ASC',
  );
  await waitFor(hasText(summary.title));
  assert.ok(
    contentCalls().some(
      (r) =>
        r.params.page === '1' && r.params.status === 'ARCHIVED' && r.params.sortKey === 'title',
    ),
  );
  for (const r of protectedCalls().filter((r) => r.path.endsWith('/stats')))
    assert.ok(Object.keys(r.params).every((key) => ['search', 'level'].includes(key)));
  await navigate('/admin/exams?page=99');
  await waitFor('location.search.includes("page=3")');
  await waitFor(hasText(summary.title));

  await navigate('/admin/exams/1');
  await waitFor(hasText('Mondai 1'));
  await screenshot('detail-desktop', 1440);
  await screenshot('detail-mobile', 390);
  assert.equal(
    await evaluate(
      '[...document.querySelectorAll("button")].some(b => /Save|Lưu đề|Xuất bản|Thêm phiên/.test(b.innerText))',
    ),
    false,
  );
  mode = 'archived';
  await navigate('/admin/exams/1');
  await waitFor(hasText('giữ lại lịch sử làm bài'));
  mode = 'empty-structure';
  await navigate('/admin/exams/1');
  await waitFor(hasText('Đề thi chưa có phiên thi.'));
  mode = 'empty';
  await navigate('/admin/exams');
  await waitFor(hasText('Chưa có đề thi phù hợp.'));
  mode = 'missing';
  await navigate('/admin/exams/1');
  await waitFor(hasText('Không tìm thấy đề thi'));
  mode = 'admin';
  requests.length = 0;
  await navigate('/admin/exams/invalid');
  await waitFor(hasText('Không tìm thấy đề thi'));
  assert.equal(contentCalls().length, 0, 'Invalid route ID must not fetch detail');

  for (const nextMode of ['denied', 'detail-denied', 'list-denied']) {
    mode = nextMode;
    requests.length = 0;
    await navigate(nextMode === 'detail-denied' ? '/admin/exams/1' : '/admin/exams');
    await waitFor(hasText('Không có quyền truy cập'));
    if (nextMode === 'denied')
      assert.equal(contentCalls().length, 0, 'Non-admin must not fetch list/detail');
    assert.equal(await evaluate(hasText(summary.title)), false);
  }
  for (const nextMode of ['stats-error', 'list-error']) {
    mode = nextMode;
    await navigate('/admin/exams');
    await waitFor(hasText('Chưa thể tải dữ liệu đề thi'));
    mode = 'admin';
    await evaluate(
      '[...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Thử lại").click()',
    );
    await waitFor(hasText(summary.title));
  }
  mode = 'expired';
  await navigate('/admin/exams/1');
  await waitFor('location.pathname === "/login"');
  mode = 'anonymous';
  requests.length = 0;
  await navigate('/admin/exams');
  await waitFor('location.pathname === "/login"');
  assert.equal(protectedCalls().length, 0);
  assert.equal(await evaluate('new URLSearchParams(location.search).get("next")'), '/admin/exams');
  assert.deepEqual(errors, []);
  process.stdout.write(
    `PASS: auth bootstrap/anonymous/403/401, list/stats URL isolation, pagination, detail/archived/empty/404, retry, desktop/mobile. Screenshots: ${profile}\n`,
  );
} finally {
  socket?.close();
  browser.kill();
}
