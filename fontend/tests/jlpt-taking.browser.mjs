import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Run against a local Next server. API and auth bootstrap responses are intercepted.
const origin = process.env.JLPT_TEST_ORIGIN ?? 'http://localhost:3138';
const browserPath = process.env.AUTH_TEST_BROWSER ?? [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
assert.ok(browserPath, 'Set AUTH_TEST_BROWSER to an installed Chromium browser');
const profile = await mkdtemp(join(tmpdir(), 'studify-jlpt-taking-'));
const browser = spawn(browserPath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });

let socket;
try {
  let port;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
    catch { await delay(100); }
  }
  assert.ok(port, 'Browser did not start');
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  const errors = [];
  const posts = [];
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
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(`${expression}: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`);
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let attempt = 0; attempt < 150; attempt++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    throw new Error(`Timed out: ${expression}; ${JSON.stringify(await evaluate('document.body.innerText.slice(0, 500)'))}; posts=${JSON.stringify(posts)}; errors=${JSON.stringify(errors)}`);
  };
  const navigate = async (path) => { await send('Page.navigate', { url: `${origin}${path}` }); };
  const screenshot = async (name) => {
    const result = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(join(profile, name), Buffer.from(result.data, 'base64'));
  };
  const exam = {
    id: 5, title: 'N5 Practice', description: 'Practice exam', jlptLevel: 'N5', isPublished: true, totalTimeMinutes: 60,
    sessions: [
      { id: 8, name: 'Listening', sessionType: 'listening', sortOrder: 2, timeLimitMinutes: 15, questionCount: 6, parts: [{ id: 30, name: 'Listening part', instructions: 'Listen and choose.', sortOrder: 1, questionCount: 6, audioMediaId: null }] },
      { id: 6, name: 'Language knowledge', sessionType: 'language_knowledge', sortOrder: 1, timeLimitMinutes: 25, questionCount: 24, parts: [{ id: 13, name: 'Second part', instructions: 'Choose a word.', sortOrder: 2, questionCount: 8, audioMediaId: null }, { id: 12, name: 'First part', instructions: 'Choose the correct reading.', sortOrder: 1, questionCount: 16, audioMediaId: null }] },
    ],
  };
  const attempt = (examId, mode, sessionId) => ({
    attemptId: 901, examId, examTitle: exam.title, mode, startedAt: new Date().toISOString(),
    sessions: [
      { attemptSessionId: 100, sessionId: 6, sessionTitle: 'Language knowledge', sessionOrder: 1, parts: [
        { attemptPartId: 102, partId: 12, partName: 'First part', partOrder: 1, questions: [
          { questionId: 200, questionOrder: 1, questionText: '川を読みます。', answers: [{ answerId: 300, answerText: 'かわ' }, { answerId: 301, answerText: 'やま' }] },
          ...Array.from({ length: 15 }, (_, index) => ({ questionId: 1000 + index, questionOrder: index + 2, questionText: `Question ${index + 2}`, answers: [{ answerId: 2000 + index, answerText: 'Choice' }] })),
        ] },
        { attemptPartId: 103, partId: 13, partName: 'Second part', partOrder: 2, questions: [
          { questionId: 201, questionOrder: 1, questionText: 'Choose a word.', answers: [{ answerId: 302, answerText: 'one' }] },
          ...Array.from({ length: 7 }, (_, index) => ({ questionId: 1101 + index, questionOrder: index + 2, questionText: `Part two question ${index + 2}`, answers: [{ answerId: 2101 + index, answerText: 'Choice' }] })),
        ] },
      ] },
      { attemptSessionId: 101, sessionId: 8, sessionTitle: 'Listening', sessionOrder: 2, parts: [{ attemptPartId: 104, partId: 30, partName: 'Listening part', partOrder: 1, questions: [
        { questionId: 202, questionOrder: 1, questionText: 'What did you hear?', answers: [{ answerId: 303, answerText: 'A' }] },
        ...Array.from({ length: 5 }, (_, index) => ({ questionId: 1201 + index, questionOrder: index + 2, questionText: `Listening question ${index + 2}`, answers: [{ answerId: 2201 + index, answerText: 'Choice' }] })),
      ] }] },
    ].filter((session) => mode === 'full' || session.sessionId === sessionId),
  });
  async function intercept({ requestId, request }) {
    try {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/api/v1/')) {
        if (url.origin === origin) await send('Fetch.continueRequest', { requestId });
        else await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
        return;
      }
      const headers = [
        { name: 'Access-Control-Allow-Origin', value: origin },
        { name: 'Access-Control-Allow-Credentials', value: 'true' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, OPTIONS' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-XSRF-TOKEN' },
      ];
      if (request.method === 'OPTIONS') { await send('Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: headers }); return; }
      let responseCode = 200;
      let body = url.pathname.endsWith('/auth/refresh-token')
        ? { data: { access_token: 'test-access', tokenType: 'Bearer', expiresIn: 600, user: { id: 73, name: 'Student', email: 'student@example.test' } } }
        : { data: { token: 'test-csrf', headerName: 'X-XSRF-TOKEN' } };
      const examId = Number(url.pathname.match(/\/jlpt-exams\/(\d+)/)?.[1]);
      if (url.pathname.endsWith('/detail')) body = { data: examId === 404 ? null : { ...exam, id: examId } };
      if (examId === 404) responseCode = 404;
      if (request.method === 'POST' && url.pathname.endsWith('/attempts')) {
        const payload = JSON.parse(request.postData);
        posts.push({ examId, payload });
        body = { data: attempt(examId, payload.mode, payload.sessionId) };
      }
      if (request.method === 'PUT' && url.pathname.endsWith('/answers')) {
        const payload = JSON.parse(request.postData);
        body = { data: { ...payload, attemptId: 901, attemptSessionId: Number(url.pathname.match(/\/sessions\/(\d+)/)?.[1]), attemptAnswerId: payload.questionId, answeredAt: new Date().toISOString() } };
      }
      if (url.pathname.endsWith('/result')) { responseCode = 400; body = { message: 'JLPT attempt is not completed' }; }
      await send('Fetch.fulfillRequest', { requestId, responseCode, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, ...headers], body: Buffer.from(JSON.stringify(body)).toString('base64') });
    } catch (error) { errors.push(error.message); await send('Fetch.failRequest', { requestId, errorReason: 'Failed' }); }
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await navigate('/student/jlpt-exams/5');
  await waitFor('[...document.querySelectorAll("a")].some(link => link.getAttribute("href") === "/jlpt-exams/5/taking?mode=session&sessionId=6")');
  await navigate('/jlpt-exams/5/taking?mode=full');
  await waitFor('[...document.querySelectorAll("button")].some(button => button.textContent.includes("Begin attempt"))');
  assert.equal(posts.length, 0);
  await send('Page.reload');
  await waitFor('[...document.querySelectorAll("button")].some(button => button.textContent.includes("Begin attempt"))');
  assert.equal(posts.length, 0);
  await evaluate('const start = [...document.querySelectorAll("button")].find(button => button.textContent.includes("Begin attempt")); start.click(); start.click()');
  await waitFor('document.querySelector("header")?.textContent.includes("Attempt #901")');
  assert.deepEqual(posts, [{ examId: 5, payload: { userId: 73, mode: 'full' } }]);
  assert.equal(await evaluate('document.querySelector("main")?.textContent.includes("Choose the correct reading.")'), true);
  assert.equal(await evaluate('document.querySelector("main")?.textContent.includes("川を読みます。")'), true);
  assert.deepEqual(await evaluate('[...document.querySelectorAll("#exam-navigation section button:first-child span:first-child")].map(item => item.textContent)'), ['Language knowledge', 'Listening']);
  assert.equal(await evaluate('[...document.querySelectorAll("button")].some(button => button.textContent.includes("Submit Exam") && !button.disabled)'), true);
  assert.equal(await evaluate('document.body.textContent.includes("Correct answer")'), false);
  await evaluate('[...document.querySelectorAll("input[type=radio]")].find(input => input.value === "300").click()');
  assert.equal(await evaluate('[...document.querySelectorAll("input[type=radio]")].find(input => input.value === "300").checked'), true);
  await evaluate('[...document.querySelectorAll("button")].find(button => button.getAttribute("aria-label")?.startsWith("Flag question 1")).click()');
  assert.equal(await evaluate('[...document.querySelectorAll("button")].find(button => button.getAttribute("aria-label")?.startsWith("Remove flag from question 1")).getAttribute("aria-pressed")'), 'true');
  await evaluate('[...document.querySelectorAll("#exam-navigation section > button")].find(button => button.textContent.includes("Listening")).click()');
  await waitFor('document.querySelector("main")?.textContent.includes("What did you hear?")');
  assert.equal(await evaluate('document.querySelector("main")?.textContent.includes("Listen and choose.")'), true);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await evaluate('document.querySelector("header button[aria-controls=exam-navigation]").click()');
  await waitFor('getComputedStyle(document.querySelector("#exam-navigation")).display !== "none"');
  await navigate('/jlpt-exams/5/taking?mode=session&sessionId=6');
  await waitFor('[...document.querySelectorAll("button")].some(button => button.textContent.includes("Begin attempt"))');
  await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.includes("Begin attempt")).click()');
  await waitFor('document.querySelector("main")?.textContent.includes("川を読みます。")');
  assert.deepEqual(posts[1], { examId: 5, payload: { userId: 73, mode: 'session', sessionId: 6 } });
  assert.equal(await evaluate('document.querySelectorAll("#exam-navigation section").length'), 1);
  await navigate('/jlpt-exams/5/taking?mode=session&sessionId=999');
  await waitFor('document.querySelector("main")?.textContent.includes("Invalid session link")');
  assert.equal(posts.length, 2);
  await navigate('/jlpt-exams/5/taking?mode=session&sessionId=session-1');
  await waitFor('document.querySelector("main")?.textContent.includes("valid numeric session ID")');
  await navigate('/jlpt-exams/invalid/taking?mode=full');
  await waitFor('document.querySelector("main")?.textContent.includes("positive number")');
  await navigate('/jlpt-exams/5/taking?mode=full');
  await waitFor('document.querySelector("main")?.textContent.includes("川を読みます。")');
  assert.equal(posts.length, 2);
  await evaluate('[...document.querySelectorAll("input[type=radio]")].find(input => input.value === "300").click()');
  const measureScroll = async () => evaluate('(() => { const root = document.querySelector(".jlpt-taking-route"); const main = document.querySelector("#exam-questions"); const sidebar = document.querySelector("#exam-navigation > div"); return { viewport: innerHeight, documentHeight: document.scrollingElement.scrollHeight, scrollY, documentScrollTop: document.scrollingElement.scrollTop, bodyScrollTop: document.body.scrollTop, rootScrollTop: root?.scrollTop, rootScrollHeight: root?.scrollHeight, rootTop: root?.getBoundingClientRect().top, rootBottom: root?.getBoundingClientRect().bottom, mainClientHeight: main?.clientHeight, mainScrollHeight: main?.scrollHeight, mainScrollTop: main?.scrollTop, sidebarClientHeight: sidebar?.clientHeight, sidebarScrollHeight: sidebar?.scrollHeight, sidebarScrollTop: sidebar?.scrollTop }; })()');
  const assertViewport = (metrics) => {
    assert.equal(metrics.documentHeight, metrics.viewport);
    assert.equal(metrics.scrollY, 0);
    assert.equal(metrics.documentScrollTop, 0);
    assert.equal(metrics.bodyScrollTop, 0);
    assert.equal(metrics.rootScrollTop, 0);
    assert.equal(metrics.rootTop, 0);
    assert.equal(metrics.rootBottom, metrics.viewport);
    assert.ok(metrics.mainScrollHeight > metrics.mainClientHeight);
  };
  const clickQuestion = async (number, mobile) => {
    if (mobile) {
      await evaluate('document.querySelector("header button[aria-controls=exam-navigation]").click()');
      await waitFor('getComputedStyle(document.querySelector("#exam-navigation")).display !== "none"');
    }
    const point = await evaluate(`(() => { const list = document.querySelector('#exam-navigation > div'); const button = document.querySelector('#exam-navigation button[aria-label^="Question ${number},"]'); const listRect = list.getBoundingClientRect(); const buttonRect = button.getBoundingClientRect(); list.scrollTop += buttonRect.top - listRect.top - list.clientHeight / 2; const rect = button.getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
    const questionId = { 1: 200, 16: 1014, 24: 1107, 30: 1205 }[number];
    await waitFor(`document.querySelector('#exam-navigation button[aria-label^="Question ${number},"]')?.getAttribute('aria-current') === 'true' && document.querySelector('#question-${questionId}')`);
    await delay(800);
    const metrics = await measureScroll();
    assertViewport(metrics);
    const geometry = await evaluate(`(() => { const card = document.querySelector('#question-${questionId}').getBoundingClientRect(); const pane = document.querySelector('#exam-questions').getBoundingClientRect(); return { cardTop: card.top, cardBottom: card.bottom, paneTop: pane.top, paneBottom: pane.bottom }; })()`);
    assert.ok(geometry.cardBottom > geometry.paneTop && geometry.cardTop < geometry.paneBottom, `Question ${number} ${mobile ? 'mobile' : 'desktop'}: ${JSON.stringify({ geometry, metrics })}`);
    assert.ok(metrics.mainScrollTop >= 0 && metrics.mainScrollTop <= metrics.mainScrollHeight - metrics.mainClientHeight);
    if (number === 24 || number === 30) assert.ok(Math.abs(metrics.mainScrollTop - (metrics.mainScrollHeight - metrics.mainClientHeight)) < 1);
    return metrics;
  };
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await evaluate('document.querySelector("#exam-questions").scrollTop = 0');
  for (const number of [1, 16, 24, 30, 1]) await clickQuestion(number, false);
  assert.equal(await evaluate('[...document.querySelectorAll("input[type=radio]")].find(input => input.value === "300").checked'), true);
  assert.equal(posts.length, 2);
  await evaluate('document.querySelector("#exam-questions").scrollTop = 0');
  assertViewport(await measureScroll());
  assert.equal((await measureScroll()).mainScrollTop, 0);
  await screenshot('desktop-top.png');
  await evaluate('window.scrollTo(0, document.scrollingElement.scrollHeight)');
  assertViewport(await measureScroll());
  await evaluate('document.querySelector("#exam-questions").scrollTop = document.querySelector("#exam-questions").scrollHeight');
  assert.ok((await measureScroll()).mainScrollTop > 0);
  assert.equal(await evaluate('(() => { const card = document.querySelector("#question-1107").getBoundingClientRect(); const pane = document.querySelector("#exam-questions").getBoundingClientRect(); return card.top >= pane.top && card.top < pane.bottom; })()'), true);
  assertViewport(await measureScroll());
  await screenshot('desktop-bottom.png');
  await evaluate('document.querySelector("#exam-navigation > div").scrollTop = document.querySelector("#exam-navigation > div").scrollHeight');
  const desktopSidebar = await measureScroll();
  assert.equal(desktopSidebar.sidebarScrollTop, Math.max(0, desktopSidebar.sidebarScrollHeight - desktopSidebar.sidebarClientHeight));
  assertViewport(await measureScroll());
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate('window.scrollTo(0, 0)');
  await evaluate('document.querySelector("#exam-questions").scrollTop = 0');
  for (const number of [1, 16, 24, 30, 1]) await clickQuestion(number, true);
  assert.equal(await evaluate('[...document.querySelectorAll("input[type=radio]")].find(input => input.value === "300").checked'), true);
  assert.equal(posts.length, 2);
  await evaluate('document.querySelector("#exam-questions").scrollTop = 0');
  assertViewport(await measureScroll());
  assert.equal((await measureScroll()).mainScrollTop, 0);
  await screenshot('mobile-top.png');
  await evaluate('window.scrollTo(0, document.scrollingElement.scrollHeight)');
  assertViewport(await measureScroll());
  await evaluate('window.scrollTo(0, 0)');
  await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 20, y: 20, deltaX: 0, deltaY: 2000 });
  await delay(150);
  assertViewport(await measureScroll());
  await evaluate('document.querySelector("header button[aria-controls=exam-navigation]").click()');
  await waitFor('getComputedStyle(document.querySelector("#exam-navigation")).display !== "none"');
  await evaluate('document.querySelector("#exam-navigation > div").scrollTop = document.querySelector("#exam-navigation > div").scrollHeight');
  assert.ok((await measureScroll()).sidebarScrollTop > 0);
  assertViewport(await measureScroll());
  await evaluate('document.querySelector("header button[aria-controls=exam-navigation]").click()');
  await evaluate('document.querySelector("#exam-questions").scrollTop = document.querySelector("#exam-questions").scrollHeight');
  await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 200, y: 400, deltaX: 0, deltaY: 2000 });
  await delay(150);
  assert.ok((await measureScroll()).mainScrollTop > 0);
  assert.equal(await evaluate('(() => { const card = document.querySelector("#question-1107").getBoundingClientRect(); const pane = document.querySelector("#exam-questions").getBoundingClientRect(); return card.top >= pane.top && card.top < pane.bottom; })()'), true);
  assertViewport(await measureScroll());
  await screenshot('mobile-bottom.png');
  assert.deepEqual(errors, []);
  process.stdout.write(`JLPT attempt browser checks passed; screenshots: ${profile}\n`);
} finally {
  socket?.close();
  browser.kill();
}
