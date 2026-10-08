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
      const body = url.pathname.endsWith('/auth/refresh-token')
        ? { data: { access_token: 'test-access', tokenType: 'Bearer', expiresIn: 600, user: { id: 1, name: 'Student', email: 'student@example.test' } } }
        : { data: { token: 'test-csrf', headerName: 'X-XSRF-TOKEN' } };
      await send('Fetch.fulfillRequest', {
        requestId, responseCode: 200,
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
  await send('Page.navigate', { url: `${origin}/jlpt-exams/1/taking?exam_id=1&mode=full` });
  await waitFor('document.getElementById("question-1")');
  assert.equal(await evaluate('document.querySelectorAll("main").length'), 1);
  assert.equal(await evaluate('Math.round(document.querySelector("aside").getBoundingClientRect().width)'), 320);
  assert.equal(await evaluate('document.querySelectorAll("#exam-navigation button[aria-label^=Question]").length'), 21);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  const initialTime = await evaluate('document.querySelector("[role=timer]").textContent.trim()');
  await delay(1150);
  assert.notEqual(await evaluate('document.querySelector("[role=timer]").textContent.trim()'), initialTime);
  await screenshot('desktop.png');

  await evaluate('[...document.querySelectorAll("#exam-navigation button")].find(button => button.getAttribute("aria-label")?.startsWith("Question 8,"))?.click()');
  await waitFor('document.querySelector("#exam-navigation button[aria-current=true]")?.getAttribute("aria-label")?.startsWith("Question 8,")');
  await waitFor('document.querySelector("main").scrollTop > 0');
  await evaluate('document.querySelector("#question-8 input").click()');
  await waitFor('document.querySelector("#question-8 input").checked');
  assert.equal(await evaluate('document.querySelector("#exam-navigation button[aria-current=true]").getAttribute("aria-label").includes("answered")'), true);
  await evaluate('document.querySelector("#question-8 button[aria-pressed=true]").click()');
  await waitFor('document.querySelector("#question-8 button[aria-pressed=false]")');
  await evaluate('document.querySelector("#question-8 button[aria-pressed=false]").click()');
  await waitFor('document.querySelector("#question-8 button[aria-pressed=true]")');

  await viewport(390, 844);
  await delay(200);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  assert.equal(await evaluate('getComputedStyle(document.querySelector("#exam-navigation")).display'), 'none');
  await evaluate('document.querySelector("header button[aria-controls=exam-navigation]").click()');
  await waitFor('getComputedStyle(document.querySelector("#exam-navigation")).display !== "none"');
  await screenshot('mobile-navigation.png');
  await evaluate('[...document.querySelectorAll("#exam-navigation button")].find(button => button.getAttribute("aria-label")?.startsWith("Question 21,"))?.click()');
  await waitFor('getComputedStyle(document.querySelector("#exam-navigation")).display === "none"');
  await evaluate('document.querySelector("header button[aria-controls=exam-navigation]").click()');
  await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.trim() === "Submit Section").click()');
  await waitFor('document.querySelector("[role=alertdialog]")?.textContent.includes("4 answered and 17 unanswered")');
  await evaluate('[...document.querySelectorAll("[role=alertdialog] button")].find(button => button.textContent.trim() === "Keep practicing").click()');
  await waitFor('!document.querySelector("[role=alertdialog]")');
  await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.trim() === "Submit Section").click()');
  await waitFor('document.querySelector("[role=alertdialog]")');
  await evaluate('[...document.querySelectorAll("[role=alertdialog] button")].find(button => button.textContent.trim() === "Submit section").click()');
  await waitFor('document.querySelector("aside button:disabled")?.textContent.includes("Section Submitted")');
  const stoppedTime = await evaluate('document.querySelector("[role=timer]").textContent.trim()');
  await delay(1150);
  assert.equal(await evaluate('document.querySelector("[role=timer]").textContent.trim()'), stoppedTime);
  await evaluate('[...document.querySelectorAll("header button")].find(button => button.textContent.trim() === "Exit").click()');
  await waitFor('document.querySelector("[role=alertdialog]")?.textContent.includes("Exit exam?")');
  await evaluate('[...document.querySelectorAll("[role=alertdialog] button")].find(button => button.textContent.trim() === "Exit exam").click()');
  await waitFor('location.pathname === "/student/jlpt-exams/1"');
  assert.equal(apiRequests.every((path) => path.includes('/auth/')), true);
  assert.deepEqual(errors, []);
  process.stdout.write(`JLPT workspace browser checks passed; screenshots: ${profile}\n`);
} finally {
  socket?.close();
  browser.kill();
}
