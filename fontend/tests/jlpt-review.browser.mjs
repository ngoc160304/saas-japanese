import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Run against a local Next server; authentication responses are intercepted.
const origin = process.env.JLPT_TEST_ORIGIN ?? 'http://localhost:3138';
const browserPath = process.env.AUTH_TEST_BROWSER ?? [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
assert.ok(browserPath, 'Set AUTH_TEST_BROWSER to an installed Chromium browser');
const profile = await mkdtemp(join(tmpdir(), 'studify-jlpt-review-'));
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
  const apiRequests = [];
  const errors = [];
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
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
    throw new Error(`Timed out: ${expression}; ${await evaluate('document.body.innerText.slice(0, 500)')}`);
  };
  const screenshot = async (name) => {
    const result = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(join(profile, name), Buffer.from(result.data, 'base64'));
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
      const body = url.pathname.endsWith('/auth/refresh-token')
        ? { data: { access_token: 'test-access', tokenType: 'Bearer', expiresIn: 600, user: { id: 73, name: 'Student', email: 'student@example.test' } } }
        : { data: { token: 'test-csrf', headerName: 'X-XSRF-TOKEN' } };
      await send('Fetch.fulfillRequest', { requestId, responseCode: request.method === 'OPTIONS' ? 204 : 200, responseHeaders: headers, body: Buffer.from(JSON.stringify(body)).toString('base64') });
    } catch (error) { errors.push(error.message); await send('Fetch.failRequest', { requestId, errorReason: 'Failed' }); }
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${origin}/student/jlpt_exam_review/901` });
  await waitFor('document.querySelector("#review-question-heading")?.textContent.includes("川")');
  assert.equal(await evaluate('document.querySelector("header").textContent.includes("Attempt #901 Review")'), true);
  assert.equal(await evaluate('document.querySelector("header a").getAttribute("href")'), '/student/jlpt-exams/5');
  assert.deepEqual(await evaluate('[...document.querySelectorAll("header [aria-pressed]")].map(button => button.textContent.trim())'), ['All (6)', 'Incorrect (2)', 'Correct (2)']);
  assert.equal(await evaluate(`document.querySelector('section[aria-label="Reading passage"]') === null`), true);
  assert.equal(await evaluate(`document.querySelector('button[aria-label="Question 1, correct"]').getAttribute('aria-current')`), 'true');
  assert.equal(await evaluate(`document.querySelectorAll('ol[aria-label="Answer options"] li span').length > 0`), true);
  assert.equal(await evaluate('[...document.querySelectorAll("ol li")].filter(item => item.textContent.includes("Your answer · Correct")).length'), 1);
  assert.equal(await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.includes("Previous Question")).disabled'), true);
  await screenshot('desktop.png');

  await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.includes("Next Question")).focus()');
  assert.equal(await evaluate('document.activeElement.textContent.includes("Next Question") && !document.activeElement.disabled'), true);
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await send('Input.dispatchKeyEvent', { type: 'char', text: '\r', unmodifiedText: '\r', key: 'Enter', windowsVirtualKeyCode: 13 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await waitFor(`document.querySelector('button[aria-label="Question 2, incorrect"]')?.getAttribute('aria-current') === 'true'`);
  assert.equal(await evaluate('[...document.querySelectorAll("ol li")].filter(item => item.textContent.includes("Your answer")).length'), 1);
  assert.equal(await evaluate('[...document.querySelectorAll("ol li")].filter(item => item.textContent.includes("Correct answer")).length'), 1);

  await evaluate('[...document.querySelectorAll("header [aria-pressed]")].find(button => button.textContent.includes("Incorrect")).click()');
  assert.deepEqual(await evaluate('[...document.querySelectorAll("nav[aria-label=Questions] button")].map(button => button.getAttribute("aria-label"))'), ['Question 2, incorrect', 'Question 5, incorrect']);
  await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.includes("Next Question")).click()');
  await waitFor(`document.querySelector('button[aria-label="Question 5, incorrect"]')?.getAttribute('aria-current') === 'true'`);
  assert.equal(await evaluate(`document.querySelector('section[aria-label="Reading passage"]') !== null`), true);
  assert.equal(await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.includes("Next Question")).disabled'), true);

  await evaluate('[...document.querySelectorAll("header [aria-pressed]")].find(button => button.textContent.includes("Correct")).click()');
  assert.deepEqual(await evaluate('[...document.querySelectorAll("nav[aria-label=Questions] button")].map(button => button.getAttribute("aria-label"))'), ['Question 1, correct', 'Question 3, correct']);
  await evaluate(`document.querySelector('button[aria-label="Question 3, correct"]').click()`);
  assert.equal(await evaluate(`document.querySelector('section[aria-label="Reading passage"]') !== null`), true);

  await evaluate('[...document.querySelectorAll("header [aria-pressed]")].find(button => button.textContent.includes("All")).click()');
  await evaluate(`document.querySelector('button[aria-label="Question 4, unanswered"]').click()`);
  assert.equal(await evaluate('document.querySelector("section[aria-labelledby=review-question-heading]").textContent.includes("Unanswered")'), true);
  assert.equal(await evaluate('[...document.querySelectorAll("ol li")].filter(item => item.textContent.includes("Your answer")).length'), 0);
  assert.equal(await evaluate('[...document.querySelectorAll("ol li")].filter(item => item.textContent.includes("Correct answer")).length'), 1);
  await evaluate(`document.querySelector('button[aria-label="Question 6, unanswered"]').click()`);
  await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.includes("Previous Question")).click()');
  await waitFor(`document.querySelector('button[aria-label="Question 5, incorrect"]')?.getAttribute('aria-current') === 'true'`);

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  assert.equal(await evaluate('document.querySelector("nav[aria-label=Questions]") !== null'), true);
  await screenshot('mobile.png');
  await evaluate('window.scrollTo(0, document.scrollingElement.scrollHeight)');
  await screenshot('mobile-bottom.png');
  await evaluate(`document.querySelector('button[aria-label="Question 4, unanswered"]').click()`);
  await waitFor('(() => { const panel = document.querySelector("#review-question-panel").getBoundingClientRect(); const header = document.querySelector("#review-top-bar").getBoundingClientRect(); return panel.top >= header.bottom - 2 && panel.top < header.bottom + 80; })()');
  assert.equal(await evaluate(`document.querySelector('button[aria-label="Question 4, unanswered"]').getAttribute('aria-current')`), 'true');
  await send('Page.navigate', { url: `${origin}/student/jlpt_exam_review/902` });
  await waitFor('document.querySelector("header")?.textContent.includes("Attempt #902 Review")');
  await send('Page.navigate', { url: `${origin}/student/jlpt_exam_review/invalid` });
  await waitFor('document.body.textContent.includes("404")');
  await send('Page.navigate', { url: `${origin}/student/jlpt_exam_review/0` });
  await waitFor('document.body.textContent.includes("404")');
  await send('Page.navigate', { url: `${origin}/student/jlpt_exam_review/9007199254740992` });
  await waitFor('document.body.textContent.includes("404")');
  assert.equal(apiRequests.some((request) => request.includes('/jlpt-exams/attempts/')), false);
  assert.deepEqual(errors, []);
  process.stdout.write(`JLPT review browser checks passed; screenshots: ${profile}\n`);
} finally {
  socket?.close();
  browser.kill();
}
