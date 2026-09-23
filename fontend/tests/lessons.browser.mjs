import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// All API requests are intercepted; no production services or credentials are used.
const origin = process.env.LESSON_TEST_ORIGIN ?? 'http://localhost:3001';
const profile = await mkdtemp(join(tmpdir(), 'studify-lessons-'));
const browser = spawn(process.env.AUTH_TEST_BROWSER ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
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
  assert.ok(port, 'Chrome did not start');
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
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
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let attempt = 0; attempt < 300; attempt++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    throw new Error(`Timed out: ${expression}`);
  };
  const errors = [];
  let lessons = [];
  const creates = [];
  let deletes = 0;
  let failCreate = true;
  let failDelete = true;
  const course = { id: 7, title: 'Kanji N5', description: 'Course notes', thumnailURL: null, published: true, price: 0 };
  listeners.set('Runtime.exceptionThrown', (event) => errors.push(event.exceptionDetails.text));
  listeners.set('Fetch.requestPaused', async ({ requestId, request }) => {
    try {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/api/v1/')) {
        if (url.origin === origin) await send('Fetch.continueRequest', { requestId });
        else await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
        return;
      }
      let status = 200;
      let body = { data: {} };
      if (request.method === 'OPTIONS') status = 204;
      else if (url.pathname.endsWith('/csrf')) body = { data: { token: 'test', headerName: 'X-XSRF-TOKEN' } };
      else if (url.pathname.endsWith('/refresh-token')) body = { data: {
        access_token: 'test', tokenType: 'Bearer', expiresIn: 600,
        user: { id: 1, name: 'Tester', email: 'test@example.test' },
      } };
      else if (url.pathname === '/api/v1/courses/7') body = { data: course };
      else if (url.pathname === '/api/v1/lessons' && request.method === 'POST') {
        const payload = JSON.parse(request.postData); creates.push(payload);
        await delay(400);
        if (failCreate) { status = 400; body = { message: 'Validation failed', fieldErrors: { title: 'Tên bài học không hợp lệ' } }; }
        else { const lesson = { ...payload, id: 12, slug: 'new-lesson', isDeleted: false }; lessons.push(lesson); status = 201; body = { data: lesson }; }
      } else if (url.pathname === '/api/v1/lessons/12' && request.method === 'DELETE') {
        deletes++; await delay(400);
        if (failDelete) { status = 500; body = { message: 'Internal server error' }; }
        else lessons = [];
      } else if (url.pathname === '/api/v1/lessons' && request.method === 'GET') {
        assert.equal(url.searchParams.get('courseId'), '7');
        assert.equal(url.searchParams.get('page'), '0');
        body = { data: { content: lessons, number: 0, size: 10, totalElements: lessons.length,
          totalPages: lessons.length ? 1 : 0, pageable: { offset: 0, pageNumber: 0 } } };
      } else throw new Error(`Unexpected API request: ${request.method} ${url.pathname}`);
      await send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Access-Control-Allow-Origin', value: origin },
        { name: 'Access-Control-Allow-Credentials', value: 'true' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-XSRF-TOKEN' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, DELETE, OPTIONS' },
      ], body: Buffer.from(status === 204 ? '' : JSON.stringify(body)).toString('base64') });
    } catch (error) {
      errors.push(error.message);
      await send('Fetch.failRequest', { requestId, errorReason: 'Failed' });
    }
  });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await send('Page.navigate', { url: `${origin}/admin/courses/7` });
  await waitFor('document.querySelector("table") && document.body.textContent.includes("Chưa có bài học phù hợp")');
  await evaluate('window.lessonTestDocument = "preserved"');
  const checkWidth = async (width) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
    await delay(100);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, `Overflow at ${width}px`);
  };
  await checkWidth(390); await checkWidth(1440);
  await evaluate(`document.querySelector('a[href="/admin/courses/7/lessons/create"]').click()`);
  await waitFor('document.getElementById("lesson-title")');
  await checkWidth(390); await checkWidth(1440);
  await evaluate('document.querySelector("form").requestSubmit()');
  await waitFor('document.getElementById("lesson-title-error")');
  assert.equal(creates.length, 0);
  await evaluate('document.getElementById("lesson-title").focus()');
  await send('Input.insertText', { text: 'New lesson' });
  await evaluate('document.getElementById("lesson-grammar").focus()');
  await send('Input.insertText', { text: 'Overview notes' });
  await evaluate('document.getElementById("lesson-published").click(); document.querySelector("form").requestSubmit()');
  await waitFor('document.body.textContent.includes("Tên bài học không hợp lệ")');
  assert.equal(await evaluate('document.getElementById("lesson-title").value'), 'New lesson');
  assert.deepEqual(creates[0], { courseId: 7, title: 'New lesson', grammar: 'Overview notes', durationMinutes: 45, isPublished: true });
  failCreate = false;
  await evaluate('document.querySelector("form").requestSubmit()');
  await waitFor('location.pathname === "/admin/courses/7" && document.querySelector("table")?.textContent.includes("New lesson")');
  assert.equal(creates.length, 2);
  assert.equal(await evaluate('window.lessonTestDocument'), 'preserved');
  await evaluate(`document.querySelector('button[aria-label="Xóa New lesson"]').click()`);
  await waitFor('document.querySelector("[role=alertdialog]")');
  await evaluate('document.querySelector("[data-slot=alert-dialog-cancel]").click()');
  assert.equal(deletes, 0);
  await waitFor('!document.querySelector("[role=alertdialog]")');
  await evaluate(`document.querySelector('button[aria-label="Xóa New lesson"]').click()`);
  await waitFor('document.querySelector("[data-slot=alert-dialog-action]")');
  await evaluate('document.querySelector("[data-slot=alert-dialog-action]").click()');
  await waitFor('document.querySelector("[role=alertdialog] [role=alert]")');
  assert.equal(deletes, 1);
  failDelete = false;
  await evaluate('document.querySelector("[data-slot=alert-dialog-action]").click()');
  await waitFor('!document.querySelector("[role=alertdialog]") && document.querySelector("table")?.textContent.includes("Chưa có bài học phù hợp")');
  assert.equal(deletes, 2);
  assert.equal(await evaluate('window.lessonTestDocument'), 'preserved');
  assert.deepEqual(errors, []);
  process.stdout.write('PASS: course-scoped creation, validation, failure/retry, delete confirmation/cancel/retry, cache refresh, client navigation and mobile/desktop layout.\n');
} finally {
  socket?.close(); browser.kill();
}
