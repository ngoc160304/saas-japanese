import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const origin = process.env.JLPT_TEST_ORIGIN ?? 'http://localhost:3138';
const browserPath = process.env.AUTH_TEST_BROWSER ?? [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
assert.ok(browserPath, 'Set AUTH_TEST_BROWSER to an installed Chromium browser');

const profile = await mkdtemp(join(tmpdir(), 'jlpt-result-'));
const browser = spawn(browserPath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
let socket;
try {
  let port;
  for (let index = 0; index < 100; index++) {
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
    catch { await delay(100); }
  }
  assert.ok(port, 'Browser did not start');
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  const apiRequests = [];
  const errors = [];
  const fixture = (attemptId) => ({
    attemptId, examId: 5, examTitle: 'N5 - Đề luyện tập 02 (30 câu)', jlptLevel: 'N5', status: 'COMPLETED', mode: 'full',
    totalScore: 11, maxScore: 30, overallPassScore: 80, correctCount: 11, totalQuestions: 30,
    isPassed: attemptId === 6, startedAt: '2026-10-08T08:43:28.157927Z', finishedAt: '2026-10-08T08:52:14.791004Z', durationSeconds: 526,
    scoringSections: [
      { name: 'Language Knowledge + Reading', score: 8, maxScore: 24, minimumPassScore: 38, correctCount: 8, totalQuestions: 24, isPassed: false },
      { name: 'Listening', score: 3, maxScore: 6, minimumPassScore: 19, correctCount: 3, totalQuestions: 6, isPassed: false },
    ],
    sessions: [
      { attemptSessionId: 1, sessionId: 6, sessionName: 'Kiến thức ngôn ngữ', sessionType: 'language_knowledge', score: 4, maxScore: 16, correctCount: 4, totalQuestions: 16,
        parts: [12, 13].map((partId, index) => ({ attemptPartId: index + 1, partId, partName: `Mondai ${index + 1} - Ngôn ngữ`, score: index ? 0 : 4, maxScore: 8, correctCount: index ? 0 : 4, totalQuestions: 8 })) },
      { attemptSessionId: 2, sessionId: 7, sessionName: 'Đọc hiểu', sessionType: 'reading', score: 4, maxScore: 8, correctCount: 4, totalQuestions: 8,
        parts: [14, 15, 16, 17].map((partId, index) => ({ attemptPartId: index + 3, partId, partName: `Mondai ${index + 1} - Đọc hiểu`, score: 1, maxScore: 2, correctCount: 1, totalQuestions: 2 })) },
      { attemptSessionId: 3, sessionId: 8, sessionName: 'Nghe hiểu', sessionType: 'listening', score: 3, maxScore: 6, correctCount: 3, totalQuestions: 6,
        parts: [18, 19, 20].map((partId, index) => ({ attemptPartId: index + 7, partId, partName: `Mondai ${index + 1} - Nghe hiểu`, score: 1, maxScore: 2, correctCount: 1, totalQuestions: 2 })) },
    ].map((session) => ({ ...session, status: 'COMPLETED', startedAt: '2026-10-08T08:43:28.157927Z', finishedAt: '2026-10-08T08:52:14.791004Z', durationSeconds: 526 })),
  });
  const resultFixture = (attemptId) => {
    const result = fixture(attemptId);
    if (attemptId === 2) {
      result.mode = 'session';
      delete result.isPassed;
      delete result.overallPassScore;
      result.scoringSections = [];
      result.sessions = [];
    }
    return result;
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let index = 0; index < 150; index++) {
      if (await evaluate(`Boolean(document.body && (${expression}))`)) return;
      await delay(100);
    }
    throw new Error(`Timed out: ${expression}; body=${await evaluate('document.body.innerText.slice(0, 600)')}; errors=${errors}`);
  };
  const navigate = (path) => send('Page.navigate', { url: `${origin}${path}` });
  const screenshot = async (name, captureBeyondViewport = false) => {
    const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport });
    await writeFile(join(profile, name), Buffer.from(image.data, 'base64'));
  };
  async function intercept({ requestId, request }) {
    try {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/api/v1/')) {
        if (url.origin === origin) await send('Fetch.continueRequest', { requestId });
        else await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
        return;
      }
      apiRequests.push(`${request.method} ${url.pathname}`);
      const headers = [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Access-Control-Allow-Origin', value: origin },
        { name: 'Access-Control-Allow-Credentials', value: 'true' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-XSRF-TOKEN' },
      ];
      let responseCode = 200;
      let body = url.pathname.endsWith('/auth/refresh-token')
        ? { data: { access_token: 'test-access', tokenType: 'Bearer', expiresIn: 600, user: { id: 73, name: 'Student', email: 'student@example.test' } } }
        : { data: { token: 'test-csrf', headerName: 'X-XSRF-TOKEN' } };
      if (url.pathname.endsWith('/result')) {
        const attemptId = Number(url.pathname.match(/\/attempts\/(\d+)/)?.[1]);
        if (attemptId === 3) { responseCode = 400; body = { message: 'JLPT attempt is not completed' }; }
        else if (attemptId === 4) { responseCode = 403; body = { message: 'Forbidden' }; }
        else if (attemptId === 5) { responseCode = 500; body = { message: 'Temporary failure' }; }
        else if (attemptId === 7) body = { data: { attemptId, status: 'COMPLETED' } };
        else body = { data: resultFixture(attemptId) };
      }
      await send('Fetch.fulfillRequest', { requestId, responseCode: request.method === 'OPTIONS' ? 204 : responseCode, responseHeaders: headers, body: Buffer.from(JSON.stringify(body)).toString('base64') });
    } catch (error) { errors.push(error.message); await send('Fetch.failRequest', { requestId, errorReason: 'Failed' }); }
  }
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const callback = pending.get(message.id);
      pending.delete(message.id);
      if (message.error?.message === 'Invalid InterceptionId.') callback.resolve({});
      else if (message.error) callback.reject(new Error(JSON.stringify(message.error)));
      else callback.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    else if (message.method === 'Fetch.requestPaused') void intercept(message.params);
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate('/student/jlpt_exam_result/1');
  await waitFor('document.querySelector("h1")?.textContent === "N5 - Đề luyện tập 02 (30 câu)"');
  assert.equal(await evaluate('document.querySelectorAll("main").length'), 1);
  assert.equal(await evaluate('document.querySelectorAll("#sidebar").length'), 1);
  assert.equal(await evaluate('document.querySelector("#sidebar a[aria-current=location]")?.textContent.includes("JLPT Exams")'), true);
  assert.equal(await evaluate('document.body.innerText.includes("11 / 30")'), true);
  assert.equal(await evaluate('document.body.innerText.includes("36,7%")'), true);
  assert.equal(await evaluate('document.body.innerText.includes("8 phút 46 giây")'), true);
  assert.equal(await evaluate('document.body.innerText.includes("08/10/2026") && document.body.innerText.includes("UTC+7")'), true);
  assert.equal(await evaluate('document.body.innerText.includes("Chưa đạt")'), true);
  assert.equal(await evaluate('document.querySelectorAll("section[aria-labelledby=scoring-sections-title] article").length'), 2);
  assert.equal(await evaluate('document.querySelectorAll("article[aria-labelledby^=result-session-]").length'), 3);
  assert.equal(await evaluate('document.querySelectorAll("article[aria-labelledby^=result-session-] h4").length'), 9);
  assert.equal(await evaluate('document.body.innerText.includes("38") && document.body.innerText.includes("19") && document.body.innerText.includes("80")'), true);
  assert.equal(await evaluate('document.querySelectorAll("[role=progressbar]").length'), 14);
  assert.equal(await evaluate('[...document.querySelectorAll("a")].some(link => link.getAttribute("href") === "/student/jlpt_exam_review/1")'), true);
  assert.equal(await evaluate('[...document.querySelectorAll("a")].some(link => link.getAttribute("href") === "/student/jlpt-exams/5")'), true);
  assert.equal(await evaluate('[...document.querySelectorAll("a")].some(link => link.getAttribute("href") === "/student/jlpt_exam_history")'), true);
  assert.equal(await evaluate('(() => { const heights = [...document.querySelectorAll("section[aria-label=\'Result actions\'] a")].map(link => link.getBoundingClientRect().height); return heights.length === 3 && Math.max(...heights) - Math.min(...heights) < 1; })()'), true);
  assert.equal(apiRequests.includes('GET /api/v1/jlpt-exams/attempts/1/result'), true);
  assert.equal(apiRequests.some((request) => request.startsWith('POST /api/v1/jlpt-exams/')), false);
  await screenshot('desktop.png', true);

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.reload');
  await waitFor('document.querySelector("h1")?.textContent === "N5 - Đề luyện tập 02 (30 câu)"');
  const mobileMetrics = await evaluate('({ innerWidth, sidebarWidth: document.querySelector("#sidebar").getBoundingClientRect().width, mainWidth: document.querySelector("main").getBoundingClientRect().width, xl: matchMedia("(min-width: 1280px)").matches })');
  assert.equal(mobileMetrics.innerWidth, 390, JSON.stringify(mobileMetrics));
  assert.equal(mobileMetrics.sidebarWidth, 390, JSON.stringify(mobileMetrics));
  assert.equal(mobileMetrics.xl, false, JSON.stringify(mobileMetrics));
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  assert.equal(await evaluate('document.querySelectorAll("article[aria-labelledby^=result-session-] h4").length'), 9);
  assert.equal(await evaluate('(() => { const buttons = [...document.querySelectorAll("section[aria-label=\'Result actions\'] a")]; return buttons.length === 3 && buttons.every(link => Math.abs(link.getBoundingClientRect().height - buttons[0].getBoundingClientRect().height) < 1 && Math.abs(link.getBoundingClientRect().width - buttons[0].getBoundingClientRect().width) < 1); })()'), true);
  await screenshot('mobile.png');
  await evaluate('window.scrollTo(0, document.scrollingElement.scrollHeight)');
  await screenshot('mobile-bottom.png');
  for (const id of ['0', 'invalid', '9007199254740992']) {
    const response = await fetch(`${origin}/student/jlpt_exam_result/${id}`);
    const html = await response.text();
    assert.equal(html.includes('404'), true, `Expected ${id} to render the 404 page`);
  }
  await navigate('/student/jlpt_exam_result/0');
  await waitFor('document.body.innerText.includes("404")');
  await navigate('/student/jlpt_exam_result/2');
  await waitFor('document.querySelector("#result-title")?.textContent.includes("N5 -")');
  assert.equal(await evaluate('document.body.innerText.includes("Đã hoàn thành phần luyện tập")'), true);
  assert.equal(await evaluate('document.body.innerText.includes("Chưa đạt")'), false);
  assert.equal(await evaluate('document.body.innerText.includes("Ngưỡng đạt toàn bài")'), false);
  assert.equal(apiRequests.includes('GET /api/v1/jlpt-exams/attempts/2/result'), true);
  await navigate('/student/jlpt_exam_result/6');
  await waitFor('document.querySelector("#result-title")?.textContent.includes("N5 -")');
  assert.equal(await evaluate('document.body.innerText.includes("Đã đạt")'), true);
  await navigate('/student/jlpt_exam_result/7');
  await waitFor('document.body.innerText.includes("Dữ liệu kết quả")');
  assert.equal(await evaluate('document.querySelector("#result-title") === null'), true);
  await navigate('/student/jlpt_exam_result/3');
  await waitFor('document.body.innerText.includes("chưa hoàn thành")');
  assert.equal(await evaluate('document.querySelector("#result-title") === null'), true);
  await navigate('/student/jlpt_exam_result/4');
  await waitFor('document.body.innerText.includes("Không tìm thấy lượt làm bài")');
  await navigate('/student/jlpt_exam_result/5');
  await waitFor('document.body.innerText.includes("Thử lại")');
  const failedRequests = apiRequests.filter((request) => request === 'GET /api/v1/jlpt-exams/attempts/5/result').length;
  await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.includes("Thử lại")).click()');
  for (let index = 0; index < 50 && apiRequests.filter((request) => request === 'GET /api/v1/jlpt-exams/attempts/5/result').length <= failedRequests; index++) await delay(100);
  assert.ok(apiRequests.filter((request) => request === 'GET /api/v1/jlpt-exams/attempts/5/result').length > failedRequests);
  assert.equal(await evaluate('document.querySelector("#result-title") === null'), true);
  assert.deepEqual(errors, []);
  process.stdout.write(`JLPT result browser checks passed; screenshots: ${profile}\n`);
} finally {
  socket?.close();
  browser.kill();
}
