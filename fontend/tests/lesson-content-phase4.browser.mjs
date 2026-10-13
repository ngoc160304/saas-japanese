import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Requires a local Next server. All API requests are mocked in Chrome; no backend is contacted.
const origin = process.env.LESSON_TEST_ORIGIN ?? 'http://localhost:3001';
const profile = await mkdtemp(join(tmpdir(), 'studify-lesson-browser-'));
const browser = spawn(
  process.env.LESSON_TEST_BROWSER ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
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
    if (result.exceptionDetails)
      throw new Error(
        result.exceptionDetails.exception?.description ?? result.exceptionDetails.text,
      );
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let i = 0; i < 300; i++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    const page = await evaluate(
      '({ url: location.href, body: document.body.innerText.slice(0, 1000), editors: window.tinymce?.get()?.map(item => ({ id: item.id, initialized: item.initialized })) })',
    );
    throw new Error(
      `Timed out: ${expression}; page=${JSON.stringify(page)}; errors=${JSON.stringify(errors)}`,
    );
  };
  const errors = [];
  const now = '2026-10-13T00:00:00Z';
  const lessons = [1, 2, 3].map((id) => ({
    id,
    courseId: 1,
    title: `Lesson ${id}`,
    slug: `lesson-${id}`,
    grammar: 'Saved grammar',
    isPublished: false,
    isDeleted: false,
    videoMediaId: 3,
    videoUrl: 'https://video.example.test/lesson.mp4',
    createdAt: now,
    updatedAt: now,
  }));
  const course = {
    id: 1,
    title: 'Course',
    slug: 'course',
    published: false,
    lessonCount: 3,
    price: 0,
    createdAt: now,
  };
  const collections = {
    vocabularies: Array.from({ length: 13 }, (_, i) => ({
      id: i + 1,
      lessonId: 1,
      word: `word${i + 1}`,
      reading: 'よみ',
      meaningVi: 'nghĩa',
      partOfSpeech: 'Danh từ',
      exampleSentenceJp: null,
      exampleSentenceVi: null,
    })),
    kanjis: Array.from({ length: 13 }, (_, i) => ({
      id: i + 21,
      lessonId: 1,
      kanji: `字${i + 1}`,
      meaningVi: 'chữ',
      onyomi: null,
      kunyomi: null,
      strokeCount: null,
      exampleWords: null,
    })),
  };
  let nextItemId = 100;
  const writes = [];
  const requests = [];
  let failNext = null;
  let delayNext = false;
  let expireSession = false;
  let holdNext = false;
  let releaseHeld;
  let accountId = 1;
  listeners.set('Runtime.exceptionThrown', ({ exceptionDetails }) =>
    errors.push(exceptionDetails.text),
  );
  listeners.set('Page.javascriptDialogOpening', async () => {
    await send('Page.handleJavaScriptDialog', { accept: true });
  });
  listeners.set('Fetch.requestPaused', async ({ requestId, request }) => {
    try {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/api/v1/')) {
        return void (await send(
          url.origin === origin ? 'Fetch.continueRequest' : 'Fetch.failRequest',
          { requestId, ...(url.origin !== origin ? { errorReason: 'BlockedByClient' } : {}) },
        ));
      }
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
      let status = 200;
      let body;
      requests.push(`${request.method} ${url.pathname}${url.search}`);
      if (request.method === 'OPTIONS') status = 204;
      else if (url.pathname.endsWith('/auth/csrf'))
        body = { data: { token: 'mock-csrf', headerName: 'X-XSRF-TOKEN' } };
      else if (url.pathname.endsWith('/auth/refresh-token')) {
        if (expireSession) status = 401;
        else
          body = {
            data: {
              access_token: 'mock-token',
              tokenType: 'Bearer',
              expiresIn: 600,
              user: { id: accountId, email: 'admin@example.test', name: 'Admin' },
            },
          };
      } else if (url.pathname.endsWith('/auth/login')) {
        accountId = 2;
        expireSession = false;
        body = {
          data: {
            access_token: 'mock-second-token',
            tokenType: 'Bearer',
            expiresIn: 600,
            user: { id: accountId, email: 'second@example.test', name: 'Second admin' },
          },
        };
      } else if (expireSession && request.method === 'GET') status = 401;
      else if (url.pathname === '/api/v1/courses/1') body = { data: course };
      else if (url.pathname === '/api/v1/lessons')
        body = { data: { content: lessons, totalPages: 1, totalElements: 3 } };
      else if (/^\/api\/v1\/lessons\/\d+$/.test(url.pathname))
        body = { data: lessons.find((item) => item.id === Number(url.pathname.split('/').at(-1))) };
      else {
        const match = url.pathname.match(/^\/api\/v1\/(vocabularies|kanjis)(?:\/(\d+))?$/);
        if (!match) {
          status = 404;
        } else {
          const domain = match[1];
          const id = Number(match[2]);
          const collection = collections[domain];
          if (request.method === 'GET') {
            if (id) {
              const item = collection.find((item) => item.id === id);
              if (!item) status = 404;
              else body = { data: item };
            } else {
              const items = collection.filter(
                (item) => item.lessonId === Number(url.searchParams.get('lessonId')),
              );
              const page = Number(url.searchParams.get('page'));
              body = {
                data: {
                  content: items.slice(page * 12, page * 12 + 12),
                  totalElements: items.length,
                  totalPages: Math.ceil(items.length / 12),
                },
              };
            }
          } else {
            const payload = request.postData ? JSON.parse(request.postData) : undefined;
            writes.push({ domain, method: request.method, id, payload });
            if (holdNext) {
              holdNext = false;
              await new Promise((resolve) => {
                releaseHeld = resolve;
              });
            }
            if (delayNext) {
              delayNext = false;
              await delay(1200);
            }
            if (failNext) {
              status = failNext;
              failNext = null;
              body = {
                status,
                message: 'Không thể lưu dữ liệu',
                fieldErrors: status === 400 ? { word: 'Từ vựng bị từ chối' } : {},
              };
            } else if (request.method === 'DELETE') {
              const index = collection.findIndex((item) => item.id === id);
              if (index < 0) status = 404;
              else {
                collection.splice(index, 1);
                status = 204;
              }
            } else if (request.method === 'POST') {
              const item = { id: nextItemId++, ...payload };
              collection.push(item);
              body = { data: item };
              status = 201;
            } else {
              const item = collection.find((item) => item.id === id);
              if (!item) status = 404;
              else {
                Object.assign(item, payload);
                body = { data: item };
              }
            }
          }
        }
      }
      if (status >= 400 && !body)
        body = { status, message: 'Nội dung không còn tồn tại', fieldErrors: {} };
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
  const navigate = async (path) => {
    await send('Page.navigate', { url: origin + path });
    await waitFor('document.readyState === "complete"');
  };
  const clickText = (text, within = 'document') =>
    evaluate(`(() => {
    const root = ${within};
    const button = [...root.querySelectorAll('button')].find(item => item.textContent.trim() === ${JSON.stringify(text)});
    if (!button) throw new Error('Missing button: ' + ${JSON.stringify(text)});
    button.click();
  })()`);
  const edit = (id, html) =>
    evaluate(`(() => {
    const editor = window.tinymce?.get(${JSON.stringify(id)});
    if (!editor) throw new Error('Editor unavailable');
    editor.setContent(${JSON.stringify(html)});
    editor.setDirty(true);
    editor.fire('input');
    editor.fire('change');
  })()`);

  const fill = (selector, value) =>
    evaluate(`(() => {
    const input=document.querySelector(${JSON.stringify(selector)});
    if (!input) throw new Error('Missing input: '+${JSON.stringify(selector)});
    const proto=input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto,'value').set.call(input,${JSON.stringify(value)});
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  const modal = 'document.querySelector("[role=dialog]")';
  const noModal = () =>
    waitFor(
      '!document.querySelector("[role=dialog]") && !document.querySelector("[role=alertdialog]")',
    );
  await navigate('/admin/courses/1/lessons/1?tab=grammar');
  await waitFor('window.tinymce?.get("lesson-1-grammar")?.initialized');
  await edit('lesson-1-grammar', '<p>Keep my grammar draft</p>');
  await evaluate('document.querySelector("#lesson-content-tab-vocabulary").click()');
  await waitFor('document.body.innerText.includes("word13")');
  assert.ok(requests.some((r) => r.includes('/vocabularies?lessonId=1&page=1')));
  await clickText('Add Vocabulary');
  await clickText('Lưu từ vựng', modal);
  await waitFor('document.querySelector("#vocabulary-word-error")');
  assert.equal(writes.length, 0);
  await fill('#vocabulary-word', '  コーヒー / coffee!  ');
  await fill('#vocabulary-reading', ' コーヒー ');
  await fill('#vocabulary-meaningVi', 'Cà phê');
  await fill('#vocabulary-partOfSpeech', 'Tự do');
  await fill('#vocabulary-exampleSentenceJp', '一行\n二行');
  await clickText('Hủy', modal);
  await waitFor('document.querySelector("[role=dialog]").textContent.includes("Bỏ các thay đổi")');
  assert.equal(
    await evaluate('document.querySelectorAll("[role=dialog], [role=alertdialog]").length'),
    1,
  );
  await clickText('Tiếp tục chỉnh sửa', modal);
  failNext = 400;
  await clickText('Lưu từ vựng', modal);
  await waitFor(
    'document.querySelector("#vocabulary-word-error")?.textContent.includes("bị từ chối")',
  );
  assert.equal(
    await evaluate('document.querySelector("#vocabulary-word").value'),
    '  コーヒー / coffee!  ',
  );
  delayNext = true;
  await evaluate(
    'document.querySelector("[role=dialog] form").requestSubmit(); document.querySelector("[role=dialog] form").requestSubmit()',
  );
  await noModal();
  assert.equal(writes.length, 2, 'failed request + one retry, no rapid duplicate');
  assert.equal(writes[1].payload.lessonId, 1);
  assert.equal(writes[1].payload.word, 'コーヒー / coffee!');
  const created = collections.vocabularies.at(-1);
  await waitFor('document.body.innerText.includes("コーヒー / coffee!")');
  await evaluate(`document.querySelector('button[aria-label="Edit コーヒー / coffee!"]').click()`);
  await waitFor('document.querySelector("#vocabulary-word")?.value === "コーヒー / coffee!"');
  await fill('#vocabulary-exampleSentenceJp', '');
  await fill('#vocabulary-partOfSpeech', 'Danh từ riêng');
  await clickText('Lưu từ vựng', modal);
  await noModal();
  assert.equal(created.exampleSentenceJp, '');
  assert.equal(created.partOfSpeech, 'Danh từ riêng');
  await fill('input[aria-label="Search vocabulary"]', 'word1');
  await clickText('Add Vocabulary');
  await fill('#vocabulary-word', '非表示');
  await fill('#vocabulary-reading', 'ひひょうじ');
  await fill('#vocabulary-meaningVi', 'Ẩn bởi bộ lọc');
  await clickText('Lưu từ vựng', modal);
  await noModal();
  await waitFor('document.body.innerText.includes("không khớp bộ lọc")');
  assert.equal(
    await evaluate(`document.querySelector('input[aria-label="Search vocabulary"]').value`),
    'word1',
  );
  assert.equal(
    await evaluate(
      'document.querySelector("#lesson-content-tab-vocabulary").textContent.includes("15")',
    ),
    true,
  );
  await clickText('Reset');
  await evaluate(
    `document.querySelector('button[aria-label="Delete コーヒー / coffee!"]').click()`,
  );
  await clickText('Hủy', 'document.querySelector("[role=alertdialog]")');
  await noModal();
  assert.ok(collections.vocabularies.includes(created));
  await evaluate(
    `document.querySelector('button[aria-label="Delete コーヒー / coffee!"]').click()`,
  );
  failNext = 500;
  await clickText('Xác nhận xóa', 'document.querySelector("[role=alertdialog]")');
  await waitFor('document.querySelector("[role=alertdialog] [role=alert]")');
  assert.ok(collections.vocabularies.includes(created));
  await clickText('Xác nhận xóa', 'document.querySelector("[role=alertdialog]")');
  await noModal();
  assert.ok(!collections.vocabularies.includes(created));
  // A record reassigned externally must never be moved back by a stale dialog.
  await evaluate(`document.querySelector('button[aria-label="Edit word1"]').click()`);
  await fill('#vocabulary-meaningVi', 'local edit');
  collections.vocabularies[0].lessonId = 2;
  const beforeStale = writes.length;
  await clickText('Lưu từ vựng', modal);
  await waitFor(
    'document.querySelector("[role=dialog]").textContent.includes("chuyển khỏi bài học")',
  );
  assert.equal(writes.length, beforeStale);
  await clickText('Hủy', modal);
  await clickText('Bỏ thay đổi', modal);
  await noModal();
  // Already deleted while the confirmation is open: accurate feedback and no second DELETE.
  await evaluate(`document.querySelector('button[aria-label="Delete word2"]').click()`);
  collections.vocabularies.splice(
    collections.vocabularies.findIndex((item) => item.word === 'word2'),
    1,
  );
  await clickText('Xác nhận xóa', 'document.querySelector("[role=alertdialog]")');
  await waitFor(
    'document.querySelector("[role=alertdialog]").textContent.includes("không còn thuộc bài học")',
  );
  await clickText('Đóng', 'document.querySelector("[role=alertdialog]")');
  await noModal();
  await evaluate('document.querySelector("#lesson-content-tab-kanji").click()');
  await waitFor('document.body.innerText.includes("字13")');
  assert.ok(requests.some((r) => r.includes('/kanjis?lessonId=1&page=1')));
  await clickText('Thêm Kanji');
  await fill('#kanji-kanji', '𠮷');
  await fill('#kanji-meaningVi', 'May mắn');
  await fill('#kanji-strokeCount', '0');
  await clickText('Lưu Kanji', modal);
  await waitFor(
    'document.querySelector("#kanji-strokeCount-error")?.textContent.includes("lớn hơn 0")',
  );
  await fill('#kanji-strokeCount', '1.5');
  await clickText('Lưu Kanji', modal);
  await waitFor(
    'document.querySelector("#kanji-strokeCount-error")?.textContent.includes("số nguyên")',
  );
  await fill('#kanji-strokeCount', '');
  await fill('#kanji-onyomi', 'キチ、キツ');
  await fill('#kanji-exampleWords', '吉日: ngày tốt');
  await clickText('Lưu Kanji', modal);
  await noModal();
  const createdKanji = collections.kanjis.at(-1);
  assert.equal(createdKanji.strokeCount, null);
  assert.equal(createdKanji.onyomi, 'キチ、キツ');
  await waitFor(`document.querySelector('button[aria-label="Sửa Kanji 𠮷"]')`);
  await evaluate(`document.querySelector('button[aria-label="Sửa Kanji 𠮷"]').click()`);
  assert.equal(
    await evaluate('document.querySelector("#kanji-exampleWords").value'),
    '吉日: ngày tốt',
  );
  await fill('#kanji-strokeCount', '6');
  await clickText('Lưu Kanji', modal);
  await noModal();
  assert.equal(createdKanji.strokeCount, 6);
  await evaluate('document.querySelector("#lesson-content-tab-grammar").click()');
  await waitFor('window.tinymce?.get("lesson-1-grammar")?.initialized');
  assert.ok(
    await evaluate(
      'window.tinymce.get("lesson-1-grammar").getContent().includes("Keep my grammar draft")',
    ),
  );
  assert.equal(lessons[0].grammar, 'Saved grammar');
  assert.equal(lessons[0].videoMediaId, 3);
  assert.equal(lessons[0].isPublished, false);
  await evaluate('document.querySelector("#lesson-content-tab-kanji").click()');
  await waitFor('location.search.includes("tab=kanji")');
  await send('Page.reload');
  await delay(500);
  await waitFor(`document.querySelector('button[aria-label="Xóa Kanji 𠮷"]')`);
  await evaluate(`document.querySelector('button[aria-label="Xóa Kanji 𠮷"]').click()`);
  await clickText('Xác nhận xóa', 'document.querySelector("[role=alertdialog]")');
  await noModal();
  assert.ok(!collections.kanjis.includes(createdKanji));
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await clickText('Thêm Kanji');
  assert.ok(
    await evaluate(
      'document.querySelector("[role=dialog]").getBoundingClientRect().width <= innerWidth',
    ),
  );
  assert.ok(
    await evaluate(
      'document.querySelector("[role=dialog]").getBoundingClientRect().height <= innerHeight',
    ),
  );
  await fill('#kanji-kanji', '月');
  if (process.env.LESSON_TEST_SCREENSHOT) {
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(process.env.LESSON_TEST_SCREENSHOT, Buffer.from(screenshot.data, 'base64'));
  }
  await fill('#kanji-meaningVi', 'Trăng');
  delayNext = true;
  await clickText('Lưu Kanji', modal);
  await delay(150);
  await evaluate(`document.querySelector('a[href^="/admin/courses/1/lessons/2"]').click()`);
  await waitFor('document.querySelector("h1")?.textContent === "Lesson 2"');
  await evaluate('document.querySelector("#lesson-content-tab-vocabulary").click()');
  await delay(1500);
  assert.equal(collections.kanjis.at(-1).lessonId, 1);
  assert.equal(await evaluate('Boolean(document.querySelector("[role=dialog]"))'), false);
  // A delayed response from the first account must not close the second account's form.
  await clickText('Add Vocabulary');
  await fill('#vocabulary-word', 'Old account pending');
  await fill('#vocabulary-reading', 'よみ');
  await fill('#vocabulary-meaningVi', 'Nghĩa');
  holdNext = true;
  await clickText('Lưu từ vựng', modal);
  for (let i = 0; i < 100 && !releaseHeld; i++) await delay(20);
  assert.ok(releaseHeld);
  expireSession = true;
  await evaluate(`document.querySelector('a[href^="/admin/courses/1/lessons/3"]').click()`);
  await waitFor('document.querySelector("#login-email")');
  await fill('#login-email', 'second@example.test');
  await fill('#login-password', 'MockPassword123!');
  await clickText('Đăng nhập');
  await waitFor(
    'document.querySelector("#kanji-heading") && location.pathname.endsWith("/lessons/3")',
  );
  await evaluate('document.querySelector("#lesson-content-tab-kanji").click()');
  await clickText('Thêm Kanji');
  await fill('#kanji-kanji', '山');
  await fill('#kanji-meaningVi', 'Draft of second account');
  releaseHeld();
  await delay(600);
  assert.equal(
    await evaluate('document.querySelector("#kanji-meaningVi")?.value'),
    'Draft of second account',
  );
  assert.equal(await evaluate('document.body.innerText.includes("Đã lưu nội dung.")'), false);
  await clickText('Hủy', modal);
  await clickText('Bỏ thay đổi', modal);
  await noModal();
  assert.ok(!requests.some((r) => r.includes('/study/')));
  assert.deepEqual(errors, []);
  process.stdout.write(
    'Phase 4 mocked browser: CRUD, validation, retry, rapid submission, all pages, filters/counts, stale/reassigned/deleted records, dirty dialog, draft/video/publication preservation, refresh, mobile, late navigation and account-change responses passed.\n',
  );
} finally {
  socket?.close();
  browser.kill();
}
