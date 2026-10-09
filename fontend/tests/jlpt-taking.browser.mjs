import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Run against a local Next server. The existing auth bootstrap is intercepted.
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
    try {
      port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
      break;
    } catch {
      await delay(100);
    }
  }
  assert.ok(port, 'Browser did not start');
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });

  let nextId = 0;
  const pending = new Map();
  const listeners = new Map();
  socket.onclose = () => {
    for (const callback of pending.values()) callback.reject(new Error('Browser DevTools connection closed'));
    pending.clear();
  };
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
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let attempt = 0; attempt < 150; attempt++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    const state = await evaluate('({ url: location.href, text: document.body.innerText.slice(0, 500) })');
    throw new Error(`Timed out: ${expression}; ${JSON.stringify(state)}; api=${JSON.stringify(apiRequests)}; errors=${JSON.stringify(errors)}`);
  };
  const viewport = (width, height) => send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: width < 768,
  });
  const screenshot = async (name) => {
    const image = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(join(profile, name), Buffer.from(image.data, 'base64'));
  };
  const errors = [];
  const apiRequests = [];
  let failedRequestCount = 0;
  const exam = {
    id: 5, title: 'N5 - Đề luyện tập 02 (30 câu)', description: 'Đề luyện tập N5.',
    jlptLevel: 'N5', isPublished: true, totalTimeMinutes: 60,
    sessions: [
      { id: 8, name: 'Listening', sessionType: 'listening', sortOrder: 3, timeLimitMinutes: 15, questionCount: 6,
        parts: [{ id: 30, name: 'Listening part', instructions: 'Read the dialogue.', sortOrder: 1, questionCount: 6, audioMediaId: null }] },
      { id: 6, name: 'Language knowledge', sessionType: 'language_knowledge', sortOrder: 1, timeLimitMinutes: 25, questionCount: 16,
        parts: [
          { id: 13, name: 'Second part', instructions: 'Choose a word.', sortOrder: 2, questionCount: 8, audioMediaId: null },
          { id: 12, name: 'First part', instructions: 'Choose the correct reading.', sortOrder: 1, questionCount: 8, audioMediaId: null },
        ] },
      { id: 7, name: 'Reading', sessionType: 'reading', sortOrder: 2, timeLimitMinutes: 20, questionCount: 8, parts: [] },
    ],
  };
  listeners.set('Runtime.exceptionThrown', (event) => errors.push(event.exceptionDetails.text));
  listeners.set('Fetch.requestPaused', async ({ requestId, request }) => {
    try {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/api/v1/')) {
        if (url.origin === origin) await send('Fetch.continueRequest', { requestId });
        else await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
        return;
      }
      apiRequests.push(`${request.method} ${url.pathname}`);
      const corsHeaders = [
        { name: 'Access-Control-Allow-Origin', value: origin },
        { name: 'Access-Control-Allow-Credentials', value: 'true' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-XSRF-TOKEN' },
      ];
      if (request.method === 'OPTIONS') {
        await send('Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: corsHeaders });
        return;
      }
      let responseCode = 200;
      let body = url.pathname.endsWith('/auth/refresh-token')
        ? { data: { access_token: 'test-access', tokenType: 'Bearer', expiresIn: 600, user: { id: 1, name: 'Student', email: 'student@example.test' } } }
        : { data: { token: 'test-csrf', headerName: 'X-XSRF-TOKEN' } };
      if (/\/jlpt-exams\/(5|7|8)$/.test(url.pathname)) {
        const id = Number(url.pathname.split('/').at(-1));
        body = { data: { id, title: exam.title, description: exam.description, jlptLevel: exam.jlptLevel,
          isPublished: id !== 8, totalTimeMinutes: exam.totalTimeMinutes } };
      }
      if (url.pathname.endsWith('/jlpt-exams/5/detail')) body = { data: exam };
      if (url.pathname.endsWith('/jlpt-exams/6/detail')) body = { data: { ...exam, id: 6, sessions: [] } };
      if (url.pathname.endsWith('/jlpt-exams/7/detail')) body = { data: { ...exam, id: 7, sessions: [{ ...exam.sessions[0], id: 70, parts: [] }] } };
      if (url.pathname.endsWith('/jlpt-exams/404/detail')) { responseCode = 404; body = { data: null, message: 'Exam not found' }; }
      if (url.pathname.endsWith('/jlpt-exams/500/detail')) {
        failedRequestCount++;
        if (failedRequestCount === 1) { responseCode = 500; body = { data: null, message: 'Server error' }; }
        else body = { data: { ...exam, id: 500 } };
      }
      await send('Fetch.fulfillRequest', {
        requestId, responseCode,
        responseHeaders: [
          { name: 'Content-Type', value: 'application/json' },
          ...corsHeaders,
        ],
        body: Buffer.from(JSON.stringify(body)).toString('base64'),
      });
    } catch (error) {
      errors.push(error.message);
      await send('Fetch.failRequest', { requestId, errorReason: 'Failed' });
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await viewport(1440, 900);
  await send('Page.navigate', { url: `${origin}/student/jlpt-exams/7` });
  await waitFor('[...document.querySelectorAll("a")].find(link => link.getAttribute("href") === "/jlpt-exams/7/taking?mode=full")');
  assert.equal(await evaluate('[...document.querySelectorAll("a")].find(link => link.getAttribute("href") === "/jlpt-exams/7/taking?mode=full").textContent.trim()'), 'Start Full Exam');
  assert.equal(await evaluate('document.querySelector("section[aria-labelledby=sessions-title] button").disabled'), true);
  await evaluate('[...document.querySelectorAll("a")].find(link => link.getAttribute("href") === "/jlpt-exams/7/taking?mode=full").click()');
  await waitFor('location.pathname === "/jlpt-exams/7/taking" && document.querySelector("main")?.textContent.includes("No parts are available")');
  assert.equal(await evaluate('location.search'), '?mode=full');
  assert.ok(apiRequests.includes('GET /api/v1/jlpt-exams/7/detail'));

  await send('Page.navigate', { url: `${origin}/student/jlpt-exams/8` });
  await waitFor('document.querySelector("#full-exam-title")');
  assert.equal(await evaluate('document.querySelector("#full-exam-title").closest("section").querySelector("button").disabled'), true);
  assert.equal(await evaluate('[...document.querySelectorAll("a")].find(link => link.getAttribute("href") === "/jlpt-exams/8/taking?mode=full") ?? null'), null);

  await send('Page.navigate', { url: `${origin}/student/jlpt-exams/5` });
  await waitFor('[...document.querySelectorAll("a")].find(link => link.getAttribute("href") === "/jlpt-exams/5/taking?mode=full")');
  await evaluate('[...document.querySelectorAll("a")].find(link => link.getAttribute("href") === "/jlpt-exams/5/taking?mode=full").click()');
  await waitFor('location.pathname === "/jlpt-exams/5/taking" && document.querySelector("main")?.textContent.includes("30 questions")');
  await send('Page.navigate', { url: `${origin}/jlpt-exams/5/taking` });
  await waitFor('document.querySelector("main")?.textContent.includes("N5 - Đề luyện tập 02 (30 câu)")');
  assert.ok(apiRequests.includes('GET /api/v1/jlpt-exams/5/detail'));
  assert.equal(await evaluate('document.querySelectorAll("main").length'), 1);
  assert.equal(await evaluate('Math.round(document.querySelector("aside").getBoundingClientRect().width)'), 320);
  assert.deepEqual(await evaluate('[...document.querySelectorAll("#exam-navigation button")].map(button => button.querySelector("span")?.textContent)'), ['Language knowledge', 'Reading', 'Listening']);
  assert.deepEqual(await evaluate('[...document.querySelectorAll("main article h3")].map(heading => heading.textContent)'), ['First part', 'Second part']);
  assert.equal(await evaluate('document.querySelector("main").textContent.includes("60 minutes total")'), true);
  assert.equal(await evaluate('document.querySelector("main").textContent.includes("30 questions")'), true);
  assert.equal(await evaluate('document.querySelector("main").textContent.includes("Choose the correct reading.")'), true);
  assert.equal(await evaluate('document.querySelector("header a").getAttribute("href")'), '/student/jlpt-exams/5');
  assert.equal(await evaluate('document.querySelector("[role=timer], input[type=radio], button[type=submit]")'), null);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await screenshot('desktop.png');

  await evaluate('[...document.querySelectorAll("#exam-navigation button")].find(button => button.textContent.includes("Listening"))?.click()');
  await waitFor('document.querySelector("main article h3")?.textContent === "Listening part"');
  assert.equal(await evaluate('document.querySelector("main").textContent.includes("Audio is not available.")'), true);
  assert.equal(await evaluate('document.querySelector("main").textContent.includes("Read the dialogue.")'), true);
  await evaluate('[...document.querySelectorAll("#exam-navigation button")].find(button => button.textContent.includes("Reading"))?.click()');
  await waitFor('document.querySelector("main").textContent.includes("No parts are available")');

  await viewport(390, 844);
  await delay(200);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  assert.equal(await evaluate('getComputedStyle(document.querySelector("#exam-navigation")).display'), 'none');
  await evaluate('document.querySelector("header button[aria-controls=exam-navigation]").click()');
  await waitFor('getComputedStyle(document.querySelector("#exam-navigation")).display !== "none"');
  await screenshot('mobile-navigation.png');
  await evaluate('[...document.querySelectorAll("#exam-navigation button")].find(button => button.textContent.includes("Listening"))?.click()');
  await waitFor('getComputedStyle(document.querySelector("#exam-navigation")).display === "none"');

  await send('Page.navigate', { url: `${origin}/jlpt-exams/6/taking` });
  await waitFor('document.querySelector("main")?.textContent.includes("No sessions are available")');
  await send('Page.navigate', { url: `${origin}/jlpt-exams/7/taking` });
  await waitFor('document.querySelector("main")?.textContent.includes("No parts are available")');
  await send('Page.navigate', { url: `${origin}/jlpt-exams/404/taking` });
  await waitFor('document.querySelector("main")?.textContent.includes("Exam unavailable")');
  await send('Page.navigate', { url: `${origin}/jlpt-exams/500/taking` });
  await waitFor('document.querySelector("main")?.textContent.includes("Could not load exam structure")');
  await evaluate('[...document.querySelectorAll("main button")].find(button => button.textContent.includes("Retry"))?.click()');
  await waitFor('document.querySelector("main")?.textContent.includes("30 questions")');
  assert.equal(failedRequestCount, 2);

  await send('Page.navigate', { url: `${origin}/jlpt-exams/invalid/taking` });
  await waitFor('document.body.textContent.includes("This page could not be found")');
  assert.equal(apiRequests.some((path) => path.includes('/jlpt-exams/invalid/detail')), false);
  assert.deepEqual(errors, []);
  process.stdout.write(`JLPT structure preview browser checks passed; screenshots: ${profile}\n`);
} finally {
  socket?.close();
  browser.kill();
}
