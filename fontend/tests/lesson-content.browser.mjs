import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Run with a local Next server on port 3001. Every backend request is mocked.
const origin = process.env.LESSON_TEST_ORIGIN ?? 'http://localhost:3001';
const profile = await mkdtemp(join(tmpdir(), 'studify-lesson-content-'));
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
    throw new Error(`Timed out: ${expression}`);
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
  const lesson = {
    id: 21,
    courseId: 7,
    title: 'Lesson One',
    slug: 'lesson-one',
    grammar: 'Saved grammar note',
    durationMinutes: 45,
    isPublished: true,
    isDeleted: false,
    videoMediaId: null,
    videoUrl: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
  const vocabulary = [
    {
      id: 31,
      lessonId: 21,
      word: '学校',
      reading: 'がっこう',
      meaningVi: 'Trường học',
      exampleSentenceJp: '学校へ行きます。',
      exampleSentenceVi: '',
      partOfSpeech: 'noun',
    },
  ];
  const kanji = [
    {
      id: 41,
      lessonId: 21,
      kanji: '学',
      onyomi: 'ガク',
      kunyomi: 'まな.ぶ',
      meaningVi: 'Học',
      strokeCount: 8,
      exampleWords: '学校',
    },
  ];
  const errors = [];
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
      let body;
      const headers = [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Access-Control-Allow-Origin', value: origin },
        { name: 'Access-Control-Allow-Credentials', value: 'true' },
        {
          name: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization, X-XSRF-TOKEN',
        },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
      ];
      if (request.method === 'OPTIONS') status = 204;
      else if (url.pathname.endsWith('/auth/csrf'))
        body = { data: { token: 'browser-csrf', headerName: 'X-XSRF-TOKEN' } };
      else if (url.pathname.endsWith('/auth/refresh-token'))
        body = {
          data: {
            access_token: 'browser-access',
            tokenType: 'Bearer',
            expiresIn: 600,
            user: { id: 1, name: 'Admin', email: 'admin@example.test' },
          },
        };
      else if (url.pathname.endsWith('/courses/7'))
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
      else if (url.pathname.endsWith('/lessons/21')) {
        if (request.method === 'PUT') Object.assign(lesson, JSON.parse(request.postData));
        body = { data: lesson };
      } else if (url.pathname.endsWith('/lessons'))
        body = {
          data: {
            content: [lesson, { ...lesson, id: 22, title: 'Lesson Two' }],
            totalPages: 1,
            totalElements: 2,
          },
        };
      else if (url.pathname.endsWith('/vocabularies')) {
        if (request.method === 'POST') {
          const item = { ...JSON.parse(request.postData), id: 32 };
          vocabulary.push(item);
          body = { data: item };
          status = 201;
        } else
          body = { data: { content: vocabulary, totalPages: 1, totalElements: vocabulary.length } };
      } else if (url.pathname.endsWith('/kanjis'))
        body = { data: { content: kanji, totalPages: 1, totalElements: kanji.length } };
      else if (url.pathname.endsWith('/vocabularies/31')) {
        if (request.method === 'DELETE') {
          vocabulary.length = 0;
          status = 204;
        } else if (request.method === 'PUT')
          Object.assign(vocabulary[0], JSON.parse(request.postData));
        body = { data: vocabulary[0] };
      } else status = 404;
      if (status >= 400) body = { status, message: 'Not found' };
      await send('Fetch.fulfillRequest', {
        requestId,
        responseCode: status,
        responseHeaders: headers,
        body: Buffer.from(status === 204 ? '' : JSON.stringify(body)).toString('base64'),
      });
    } catch (error) {
      errors.push(error.message);
      await send('Fetch.failRequest', { requestId, errorReason: 'Failed' });
    }
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await send('Page.navigate', { url: `${origin}/admin/courses/7/lessons/21` });
  await waitFor(
    'document.body.innerText.includes("Lesson One") && document.body.innerText.includes("Saved grammar note")',
  );
  assert.equal(await evaluate('document.querySelectorAll("[role=tab]").length'), 4);
  assert.equal(await evaluate('document.body.innerText.includes("Japanese Course")'), true);
  await clickText('Set Draft');
  await waitFor('document.body.innerText.includes("Draft") && document.body.innerText.includes("Publish")');
  await clickText('Edit Lesson');
  await waitFor('document.querySelector("[role=dialog]")?.innerText.includes("Edit Lesson")');
  assert.equal(await evaluate('document.getElementById("edit-lesson-published").value'), 'false');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await waitFor('!document.querySelector("[role=dialog]")');
  await evaluate('document.getElementById("lesson-content-tab-grammar").focus()');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight' });
  await waitFor(
    'document.getElementById("lesson-content-tab-vocabulary").getAttribute("aria-selected") === "true"',
  );
  assert.equal(await evaluate('document.activeElement.id'), 'lesson-content-tab-vocabulary');
  await waitFor('document.body.innerText.includes("学校")');
  await clickText('Add Vocabulary');
  await waitFor('document.querySelector("[role=dialog]")?.innerText.includes("Add Vocabulary")');
  assert.equal(
    await evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)'),
    true,
  );
  await fill('vocab-word', '先生');
  await fill('vocab-reading', 'せんせい');
  await fill('vocab-meaning', 'Giáo viên');
  await evaluate('document.querySelector("[role=dialog] form").requestSubmit()');
  await waitFor(
    '!document.querySelector("[role=dialog]") && document.body.innerText.includes("先生")',
  );
  await clickLabel('Delete 学校');
  await waitFor('document.querySelector("[role=alertdialog]")?.innerText.includes("学校")');
  await clickText('Delete');
  await waitFor('!document.body.innerText.includes("学校")');
  await clickTab('kanji');
  await waitFor('document.body.innerText.includes("ガク")');
  await clickTab('quiz');
  await waitFor('document.body.innerText.includes("DEMO · Question 1")');
  await clickText('Add Question');
  await waitFor('document.querySelector("[role=dialog]")?.innerText.includes("Form preview")');
  assert.equal(
    await evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)'),
    true,
  );
  assert.equal(
    await evaluate(
      '[...document.querySelectorAll("[role=dialog] button")].some((button) => button.textContent.includes("Save") && button.disabled)',
    ),
    true,
  );
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await waitFor('!document.querySelector("[role=dialog]")');
  await clickText('Resources');
  await waitFor(
    'document.querySelector("[role=dialog]")?.innerText.includes("No resource records available")',
  );
  await clickText('Add Resource');
  await waitFor('document.querySelector("[role=dialog]")?.innerText.includes("Add Lesson Resource")');
  assert.equal(await evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)'), true);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await waitFor('!document.querySelector("[role=dialog]")');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await delay(300);
  assert.equal(
    await evaluate('document.documentElement.scrollWidth <= innerWidth'),
    true,
    'mobile horizontal overflow',
  );
  await clickLabel('Open curriculum');
  await waitFor('document.querySelector("[role=dialog]")?.innerText.includes("Lesson Two")');
  assert.equal(
    await evaluate('document.querySelector("[role=dialog]").contains(document.activeElement)'),
    true,
  );
  await fill('curriculum-search-mobile', 'Lesson Two');
  await waitFor(`document.querySelectorAll('[role=dialog] a[href$="/lessons/21"]').length === 0`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await waitFor('!document.querySelector("[role=dialog]")');
  const mobile = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  });
  await writeFile(join(profile, 'lesson-mobile.png'), Buffer.from(mobile.data, 'base64'));
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await delay(300);
  assert.equal(
    await evaluate('document.documentElement.scrollWidth <= innerWidth'),
    true,
    'desktop horizontal overflow',
  );
  const desktop = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  });
  await writeFile(join(profile, 'lesson-desktop.png'), Buffer.from(desktop.data, 'base64'));
  assert.deepEqual(errors, []);
  process.stdout.write(
    `Lesson content browser check passed: route, tabs, real lists, preview dialog, resource drawer, mobile tree, responsive overflow.\nScreenshots: ${profile}\n`,
  );
} finally {
  socket?.close();
  browser.kill();
}
