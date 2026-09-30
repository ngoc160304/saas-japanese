import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Run with a local Next server on port 3001. Every backend request is mocked.
const origin = process.env.LESSON_TEST_ORIGIN ?? 'http://localhost:3001';
const profile = await mkdtemp(join(tmpdir(), 'studify-lesson-workspace-'));
const browserPath =
  process.env.AUTH_TEST_BROWSER ??
  [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].find(existsSync);
assert.ok(browserPath, 'Set AUTH_TEST_BROWSER to an installed Chromium browser');
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
    for (let i = 0; i < 200; i++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    const failure = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(join(profile, 'failure.png'), Buffer.from(failure.data, 'base64'));
    throw new Error(`Timed out: ${expression}. Screenshot: ${join(profile, 'failure.png')}`);
  };
  const clickText = (text) =>
    evaluate(
      `[...document.querySelectorAll('button')].find((node) => node.textContent.trim() === ${JSON.stringify(text)})?.click()`,
    );
  const clickTab = (tab) =>
    evaluate(`document.getElementById(${JSON.stringify(`lesson-content-tab-${tab}`)})?.click()`);
  const clickLabel = (label) =>
    evaluate(`document.querySelector('[aria-label=${JSON.stringify(label)}]')?.click()`);
  const fill = async (id, value) => {
    await evaluate(`document.getElementById(${JSON.stringify(id)}).focus()`);
    await send('Input.insertText', { text: value });
  };
  const errors = [];
  const requests = [];
  let authenticated = true;
  const lesson = {
    id: 21,
    courseId: 7,
    title: 'Lesson One',
    slug: 'lesson-one',
    grammar: '',
    durationMinutes: 45,
    isPublished: true,
    isDeleted: false,
    videoMediaId: null,
    videoUrl: null,
    createdAt: null,
    updatedAt: null,
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
      requests.push(`${request.method} ${url.pathname}`);
      let status = 200;
      let body;
      if (request.method === 'OPTIONS') status = 204;
      else if (url.pathname.endsWith('/auth/csrf'))
        body = { data: { token: 'test-csrf', headerName: 'X-XSRF-TOKEN' } };
      else if (url.pathname.endsWith('/auth/refresh-token')) {
        status = authenticated ? 200 : 401;
        body = authenticated
          ? {
              data: {
                access_token: 'test-access',
                tokenType: 'Bearer',
                expiresIn: 600,
                user: { id: 1, name: 'Admin', email: 'admin@example.test' },
              },
            }
          : { status: 401, message: 'Unauthenticated' };
      } else if (url.pathname.endsWith('/courses/7'))
        body = {
          data: {
            id: 7,
            title: 'Japanese Course',
            slug: 'japanese-course',
            description: '',
            published: true,
            categoryName: 'N3',
            lessonCount: 2,
            price: 0,
            thumnailURL: null,
            createdAt: null,
          },
        };
      else if (url.pathname.endsWith('/lessons/21')) body = { data: lesson };
      else if (url.pathname.endsWith('/lessons'))
        body = {
          data: {
            content: [lesson, { ...lesson, id: 22, title: 'Lesson Two' }],
            totalPages: 1,
            totalElements: 2,
            number: 0,
            size: 12,
            numberOfElements: 2,
            empty: false,
            first: true,
            last: true,
            pageable: { offset: 0, pageNumber: 0, pageSize: 12, paged: true, unpaged: false },
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
      errors.push(error.message);
      await send('Fetch.failRequest', { requestId, errorReason: 'Failed' });
    }
  });
  const key = (name) => send('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code: name });
  const viewport = async (width, height) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    await delay(150);
  };
  const screenshot = async (name) => {
    const result = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(join(profile, name), Buffer.from(result.data, 'base64'));
  };
  const workspaceReady = () => waitFor('document.getElementById("grammar-heading")');
  const noOverflow = async () => {
    assert.equal(
      await evaluate('document.documentElement.scrollWidth <= innerWidth'),
      true,
      'Horizontal page overflow',
    );
    assert.equal(
      await evaluate('document.documentElement.scrollHeight <= innerHeight'),
      true,
      'Workspace must own scrolling',
    );
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await viewport(1440, 900);
  await send('Page.navigate', { url: `${origin}/admin/courses/7/lessons/21` });
  await workspaceReady();
  await noOverflow();
  assert.equal(await evaluate('document.querySelectorAll("#sidebar").length'), 0);
  assert.equal(
    await evaluate('document.querySelector("aside").getBoundingClientRect().width'),
    320,
  );
  assert.equal(await evaluate('document.querySelectorAll("main").length'), 1);
  assert.equal(await evaluate('document.querySelectorAll("[role=tab]:disabled").length'), 2);
  assert.equal(
    await evaluate(
      'document.querySelector("header").getBoundingClientRect().bottom <= document.querySelector("aside").getBoundingClientRect().top',
    ),
    true,
  );
  await screenshot('workspace-desktop.png');
  await evaluate('document.querySelector("main").scrollTop = 500');
  assert.equal(
    await evaluate(
      'document.querySelector("main").scrollTop > 0 && document.querySelector("aside").getBoundingClientRect().top > 0',
    ),
    true,
  );
  await evaluate('document.querySelector("main").scrollTop = 0');

  // Sidebar and tab bar drive the same mounted panels; Vocabulary search survives switching.
  await evaluate(
    'document.querySelector("aside button[aria-controls=lesson-content-panel-vocabulary]").click()',
  );
  await waitFor(
    'document.getElementById("lesson-content-tab-vocabulary").getAttribute("aria-selected") === "true"',
  );
  await evaluate('document.querySelector("input[aria-label=\\"Search vocabulary\\"]").focus()');
  await send('Input.insertText', { text: '会社員' });
  await waitFor(
    'document.querySelectorAll("#lesson-content-panel-vocabulary tbody tr").length === 1',
  );
  assert.equal(
    await evaluate(
      'document.querySelector("#lesson-content-panel-vocabulary tbody").innerText.includes("会社員")',
    ),
    true,
  );
  await clickTab('grammar');
  assert.equal(
    await evaluate(
      'document.querySelector("aside button[aria-controls=lesson-content-panel-grammar]").getAttribute("aria-current")',
    ),
    'true',
  );
  await evaluate('document.getElementById("lesson-content-tab-grammar").focus()');
  await key('ArrowRight');
  assert.equal(await evaluate('document.activeElement.id'), 'lesson-content-tab-vocabulary');
  assert.equal(
    await evaluate('document.querySelector("input[aria-label=\\"Search vocabulary\\"]").value'),
    '会社員',
  );
  await key('ArrowRight');
  assert.equal(
    await evaluate('document.activeElement.id'),
    'lesson-content-tab-grammar',
    'Skip unavailable tabs',
  );
  await clickText('Collapse All');
  assert.equal(
    await evaluate('document.getElementById("curriculum-content-desktop").hidden'),
    true,
  );
  await clickText('Expand All');
  await fill('curriculum-search-desktop', 'no matching lesson');
  await waitFor('document.querySelector("aside").innerText.includes("No matching lessons")');
  await clickLabel('Clear lesson search');

  // Existing editor stays interactive, with no simulated save.
  await clickText('Add Grammar Point');
  await waitFor(
    'document.querySelector("[role=dialog]")?.innerText.includes("Grammar Pattern Structure")',
  );
  await waitFor('document.querySelector(".tox-edit-area iframe")');
  await waitFor('document.querySelector("[role=dialog]").contains(document.activeElement)');
  assert.equal(
    await evaluate(
      '[...document.querySelectorAll("[role=dialog] button")].find((button) => button.textContent.includes("Save Grammar Point")).disabled',
    ),
    true,
  );
  await evaluate('document.querySelector(".tox-edit-area iframe").contentDocument.body.focus()');
  await send('Input.insertText', { text: 'Workspace editor check' });
  assert.equal(
    await evaluate(
      'document.querySelector(".tox-edit-area iframe").contentDocument.body.innerText.includes("Workspace editor check")',
    ),
    true,
  );
  await screenshot('grammar-editor-desktop.png');
  await clickText('Cancel');
  await waitFor('!document.querySelector("[role=dialog]")');
  await evaluate('document.querySelector("button[title=\\"Edit Grammar\\"]").click()');
  await waitFor(
    'document.querySelector("[role=dialog]")?.innerText.includes("Edit Grammar Point")',
  );
  assert.equal(
    await evaluate('document.querySelector("[role=dialog] input").value.includes("わけがない")'),
    true,
  );
  await key('Escape');
  await waitFor('!document.querySelector("[role=dialog]")');
  assert.equal(
    requests.some((request) => /\/(lessons|vocabularies|kanjis)/.test(request)),
    false,
    'Content preview adds no API calls',
  );

  await viewport(390, 844);
  await noOverflow();
  await screenshot('workspace-mobile.png');
  await clickLabel('Open curriculum');
  await waitFor('document.querySelector("[role=dialog]")?.textContent.includes("Curriculum Tree")');
  await waitFor('document.querySelector("[role=dialog]").contains(document.activeElement)');
  for (let i = 0; i < 12; i++) {
    await key('Tab');
    await delay(50);
    assert.equal(
      await evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)'),
      true,
      `Drawer traps focus: ${await evaluate('document.activeElement.outerHTML')}`,
    );
  }
  await screenshot('curriculum-mobile.png');
  await fill('curriculum-search-mobile', 'no matching lesson');
  await waitFor(
    'document.querySelector("[role=dialog]").innerText.includes("No matching lessons")',
  );
  await evaluate(
    'document.querySelector("[role=dialog] button[aria-label=\\"Clear lesson search\\"]").click()',
  );
  await key('Escape');
  await waitFor('!document.querySelector("[role=dialog]")');
  assert.equal(
    await evaluate('document.activeElement.getAttribute("aria-label")'),
    'Open curriculum',
  );
  await clickLabel('Open curriculum');
  await waitFor('document.querySelector("[role=dialog]")');
  await evaluate(
    'document.querySelector("[role=dialog] button[aria-controls=lesson-content-panel-vocabulary]").click()',
  );
  await waitFor('!document.querySelector("[role=dialog]")');
  assert.equal(
    await evaluate(
      'document.getElementById("lesson-content-tab-vocabulary").getAttribute("aria-selected")',
    ),
    'true',
  );
  await noOverflow();
  await clickLabel('Open curriculum');
  await waitFor('document.querySelector("[role=dialog]")');
  await clickLabel('Close curriculum');
  await waitFor('!document.querySelector("[role=dialog]")');
  await clickLabel('Open curriculum');
  await waitFor('document.querySelector("[role=dialog]")');
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: 375,
    y: 500,
    button: 'left',
    clickCount: 1,
  });
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: 375,
    y: 500,
    button: 'left',
    clickCount: 1,
  });
  await waitFor('!document.querySelector("[role=dialog]")');
  await clickTab('grammar');
  await clickText('Add Grammar Point');
  await waitFor('document.querySelector(".tox-edit-area iframe")');
  assert.equal(
    await evaluate(
      'document.querySelector("[role=dialog]").getBoundingClientRect().right <= innerWidth',
    ),
    true,
  );
  await screenshot('grammar-editor-mobile.png');
  await clickText('Cancel');
  await waitFor('!document.querySelector("[role=dialog]")');
  await viewport(768, 900);
  await clickLabel('Open curriculum');
  await waitFor('document.querySelector("[role=dialog]")');
  await viewport(1440, 900);
  await waitFor('!document.querySelector("[role=dialog]")');
  await noOverflow();

  // Route transitions restore the unchanged admin shell, including create/edit.
  await evaluate(
    '[...document.querySelectorAll("a")].find((node) => node.textContent.includes("Edit Lesson")).click()',
  );
  await waitFor(
    'location.pathname.endsWith("/edit") && document.querySelector("#sidebar") && document.querySelector("form")',
  );
  assert.equal(
    await evaluate('document.querySelector("aside[aria-label=\\"Lesson curriculum\\"]") === null'),
    true,
  );
  await screenshot('lesson-edit-layout.png');
  await evaluate('history.back()');
  await workspaceReady();
  assert.equal(await evaluate('document.querySelector("#sidebar") === null'), true);
  await evaluate('document.querySelector("aside a[href$=\\"/lessons/create\\"]").click()');
  await waitFor(
    'location.pathname.endsWith("/create") && document.querySelector("#sidebar") && document.querySelector("form")',
  );
  await evaluate('history.back()');
  await workspaceReady();
  await evaluate(
    '[...document.querySelectorAll("header a")].find((node) => node.textContent.includes("Outline")).click()',
  );
  await waitFor(
    'location.pathname === "/admin/courses/7" && document.querySelector("#sidebar") && document.querySelector("a[href$=\\"/lessons/22\\"]")',
  );
  await evaluate('document.querySelector("a[href$=\\"/lessons/22\\"]").click()');
  await workspaceReady();
  assert.equal(
    await evaluate('document.querySelector("h1").innerText.startsWith("Lesson 22:")'),
    true,
  );
  assert.equal(await evaluate('document.querySelector("#sidebar") === null'), true);
  assert.equal(
    await evaluate(
      'document.getElementById("lesson-content-tab-grammar").getAttribute("aria-selected")',
    ),
    'true',
  );
  await send('Page.navigate', { url: `${origin}/admin/courses/7/lessons/invalid` });
  await waitFor('document.body.innerText.includes("404")');
  assert.deepEqual(errors, []);
  authenticated = false;
  await send('Page.navigate', { url: `${origin}/admin/courses/7/lessons/21` });
  await waitFor('location.pathname === "/login"');
  assert.equal(await evaluate('document.querySelector("#grammar-heading") === null'), true);
  process.stdout.write(
    `Workspace browser checks passed: desktop/mobile/tablet, scrolling, drawer focus/Escape/backdrop, shared tabs, Vocabulary search, grammar editor, admin create/edit layouts, lesson navigation, route validation and AuthGuard.\nScreenshots: ${profile}\n`,
  );
} finally {
  socket?.close();
  browser.kill();
}
