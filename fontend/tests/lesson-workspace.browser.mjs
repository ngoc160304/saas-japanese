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
  let failVocabularyOnce = true;
  let failKanjiOnce = true;
  let failQuizOnce = true;
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
      requests.push(`${request.method} ${url.pathname}${url.search}`);
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
      else if (url.pathname.endsWith('/study/lessons/21/vocabularies')) {
        await delay(250);
        if (failVocabularyOnce) {
          failVocabularyOnce = false;
          status = 503;
          body = { statusCode: status, message: 'Service unavailable', data: null };
        } else {
          body = {
            data: [
              {
                id: 31,
                lessonId: 21,
                word: '学生',
                reading: 'がくせい',
                meaningVi: 'học sinh, sinh viên',
                exampleSentenceJp: 'わたしは学生です。',
                exampleSentenceVi: 'Tôi là sinh viên.',
                partOfSpeech: 'Danh từ',
              },
              {
                id: 32,
                lessonId: 21,
                word: '本',
                reading: 'ほん',
                meaningVi: 'sách',
                exampleSentenceJp: null,
                exampleSentenceVi: null,
                partOfSpeech: null,
              },
            ],
            error: null,
            message: 'CALL API SUCCESS !',
            statusCode: 200,
          };
        }
      } else if (url.pathname.endsWith('/study/lessons/22/vocabularies'))
        body = { data: [], error: null, message: 'CALL API SUCCESS !', statusCode: 200 };
      else if (url.pathname.endsWith('/study/lessons/21/kanjis')) {
        await delay(250);
        if (failKanjiOnce) {
          failKanjiOnce = false;
          status = 503;
          body = { statusCode: status, message: 'Service unavailable', data: null };
        } else {
          body = {
            data: [
              {
                id: 41,
                lessonId: 21,
                kanji: '学',
                meaningVi: 'học',
                onyomi: 'ガク',
                kunyomi: 'まなぶ',
                strokeCount: 8,
                exampleWords: '学生（がくせい）: học sinh, 学校（がっこう）: trường học',
              },
              {
                id: 42,
                lessonId: 21,
                kanji: '文',
                meaningVi: 'văn',
                onyomi: null,
                kunyomi: null,
                strokeCount: null,
                exampleWords: null,
              },
            ],
            error: null,
            message: 'CALL API SUCCESS !',
            statusCode: 200,
          };
        }
      } else if (url.pathname.endsWith('/study/lessons/22/kanjis'))
        body = { data: [], error: null, message: 'CALL API SUCCESS !', statusCode: 200 };
      else if (url.pathname.endsWith('/study/lessons/21/quiz')) {
        await delay(250);
        if (failQuizOnce) {
          failQuizOnce = false;
          status = 503;
          body = { status, message: 'Service unavailable' };
        } else {
          body = {
            data: {
              id: 2,
              title: 'Quiz Bài 2',
              description: 'Kiểm tra kiến thức về công việc và nghề nghiệp.',
              questions: [
                {
                  id: 62,
                  questionText: 'Chọn cách đọc của 「会社」',
                  questionType: 'MULTIPLE_CHOICE',
                  sortOrder: 2,
                  options: [
                    { id: 26, optionText: 'かいしゃ', sortOrder: 2 },
                    { id: 25, optionText: 'かしゃ', sortOrder: 1 },
                  ],
                },
                {
                  id: 61,
                  questionText: '「会社」 có nghĩa là gì?',
                  questionType: 'SINGLE_CHOICE',
                  sortOrder: 1,
                  options: [
                    { id: 23, optionText: 'Ngân hàng.', sortOrder: 3 },
                    { id: 21, optionText: 'Trường học.', sortOrder: 1 },
                    { id: 22, optionText: 'Công ty.', sortOrder: 2 },
                  ],
                },
              ],
            },
            error: null,
            message: 'CALL API SUCCESS !',
            statusCode: 200,
          };
        }
      } else if (url.pathname.endsWith('/study/lessons/22/quiz')) {
        status = 404;
        body = { status, message: 'Không tìm thấy quiz của lesson' };
      } else if (url.pathname.endsWith('/study/lessons/23/quiz'))
        body = {
          data: { id: 3, title: 'Quiz trống', description: '', questions: [] },
          error: null,
          message: 'CALL API SUCCESS !',
          statusCode: 200,
        };
      else if (url.pathname.endsWith('/study/lessons/24/quiz')) {
        status = 403;
        body = { status, message: 'Forbidden' };
      } else if (url.pathname.endsWith('/study/lessons/25/quiz')) {
        status = 404;
        body = { status, message: 'Lesson không tồn tại' };
      } else if (url.pathname.endsWith('/lessons/21')) body = { data: lesson };
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
  assert.equal(await evaluate('document.querySelectorAll("[role=tab]:disabled").length'), 0);
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
  assert.equal(
    requests.some((request) => request.includes('/vocabularies')),
    false,
  );
  await evaluate(
    'document.querySelector("aside button[aria-controls=lesson-content-panel-vocabulary]").click()',
  );
  await waitFor(
    'document.getElementById("lesson-content-tab-vocabulary").getAttribute("aria-selected") === "true"',
  );
  await waitFor('document.querySelector("#lesson-content-panel-vocabulary [role=status]")');
  await waitFor('document.querySelector("#lesson-content-panel-vocabulary [role=alert]")');
  assert.equal(
    requests.filter((request) => request === 'GET /api/v1/study/lessons/21/vocabularies').length,
    1,
  );
  await clickText('Thử lại');
  await waitFor('document.querySelector("#lesson-content-panel-vocabulary [role=status]")');
  await waitFor(
    'document.querySelector("#lesson-content-panel-vocabulary tbody")?.innerText.includes("学生")',
  );
  assert.equal(
    await evaluate(
      'document.querySelector("#lesson-content-tab-vocabulary").innerText.includes("2")',
    ),
    true,
  );
  assert.equal(
    await evaluate(
      'document.querySelector("#lesson-content-panel-vocabulary tbody").innerText.includes("がくせい") && document.querySelector("#lesson-content-panel-vocabulary tbody").innerText.includes("học sinh, sinh viên") && document.querySelector("#lesson-content-panel-vocabulary tbody").innerText.includes("Danh từ") && document.querySelector("#lesson-content-panel-vocabulary tbody").innerText.includes("わたしは学生です。") && document.querySelector("#lesson-content-panel-vocabulary tbody").innerText.includes("Tôi là sinh viên.")',
    ),
    true,
  );
  assert.equal(
    await evaluate(
      '!document.querySelector("#lesson-content-panel-vocabulary tbody").innerText.includes("null")',
    ),
    true,
  );
  assert.deepEqual(
    await evaluate(
      '[...document.querySelector("#vocabulary-part-of-speech").options].map((option) => option.value)',
    ),
    ['', 'Danh từ'],
  );
  await screenshot('vocabulary-desktop.png');
  await evaluate(
    'document.querySelector("#vocabulary-part-of-speech").value = "Danh từ"; document.querySelector("#vocabulary-part-of-speech").dispatchEvent(new Event("change", { bubbles: true }))',
  );
  await waitFor(
    'document.querySelectorAll("#lesson-content-panel-vocabulary tbody tr").length === 1 && document.querySelector("#lesson-content-tab-vocabulary").innerText.includes("1")',
  );
  await evaluate('document.querySelector("input[aria-label=\\"Search vocabulary\\"]").focus()');
  await send('Input.insertText', { text: 'sách' });
  await waitFor(
    'document.querySelector("#lesson-content-panel-vocabulary tbody")?.innerText.includes("Không tìm thấy từ vựng phù hợp.")',
  );
  await clickText('Reset');
  await waitFor(
    'document.querySelector("input[aria-label=\\"Search vocabulary\\"]").value === "" && document.querySelector("#vocabulary-part-of-speech").value === "" && document.querySelectorAll("#lesson-content-panel-vocabulary tbody tr").length === 2 && document.querySelector("#lesson-content-tab-vocabulary").innerText.includes("2")',
  );
  await evaluate('document.querySelector("input[aria-label=\\"Search vocabulary\\"]").focus()');
  await send('Input.insertText', { text: 'sinh viên' });
  await waitFor(
    'document.querySelectorAll("#lesson-content-panel-vocabulary tbody tr").length === 1',
  );
  assert.equal(
    await evaluate(
      'document.querySelector("#lesson-content-panel-vocabulary tbody").innerText.includes("学生")',
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
    'sinh viên',
  );
  assert.equal(
    requests.filter((request) => request === 'GET /api/v1/study/lessons/21/vocabularies').length,
    2,
    'Returning to Vocabulary within staleTime must reuse the cached list',
  );
  assert.equal(
    requests.some((request) => request.includes('/kanjis')),
    false,
  );
  await key('ArrowRight');
  assert.equal(await evaluate('document.activeElement.id'), 'lesson-content-tab-kanji');
  await waitFor('document.querySelector("#lesson-content-panel-kanji [role=status]")');
  await waitFor('document.querySelector("#lesson-content-panel-kanji [role=alert]")');
  assert.equal(
    requests.filter((request) => request === 'GET /api/v1/study/lessons/21/kanjis').length,
    1,
  );
  await clickText('Thử lại');
  await waitFor('document.querySelector("#lesson-content-panel-kanji [role=status]")');
  await waitFor('document.querySelectorAll("#lesson-content-panel-kanji article").length === 2');
  assert.equal(
    await evaluate(
      'document.querySelector("#lesson-content-panel-kanji").innerText.includes("学") && document.querySelector("#lesson-content-panel-kanji").innerText.includes("học") && document.querySelector("#lesson-content-panel-kanji").innerText.includes("ガク") && document.querySelector("#lesson-content-panel-kanji").innerText.includes("まなぶ") && document.querySelector("#lesson-content-panel-kanji").innerText.includes("8 strokes") && document.querySelector("#lesson-content-panel-kanji").innerText.includes("学生（がくせい）: học sinh, 学校（がっこう）: trường học")',
    ),
    true,
  );
  assert.equal(
    await evaluate(
      'document.querySelector("#lesson-content-panel-kanji").innerText.includes("null")',
    ),
    false,
  );
  assert.equal(
    await evaluate('document.querySelector("#lesson-content-tab-kanji").innerText.includes("2")'),
    true,
  );
  assert.equal(
    await evaluate(
      'document.querySelector("#lesson-content-panel-kanji").innerText.includes("Hiển thị 2 / 2 Kanji")',
    ),
    true,
  );
  await screenshot('kanji-desktop.png');
  await fill('kanji-character-filter', ' 学 ');
  await waitFor(
    'document.querySelectorAll("#lesson-content-panel-kanji article").length === 1 && document.querySelector("#lesson-content-panel-kanji").innerText.includes("Hiển thị 1 / 2 Kanji")',
  );
  await fill('kanji-meaning-filter', ' HỌC ');
  await waitFor('document.querySelectorAll("#lesson-content-panel-kanji article").length === 1');
  await evaluate('document.getElementById("kanji-meaning-filter").select()');
  await send('Input.insertText', { text: 'văn' });
  await waitFor(
    'document.querySelector("#lesson-content-panel-kanji").innerText.includes("Không tìm thấy Kanji phù hợp.") && document.querySelector("#lesson-content-panel-kanji").innerText.includes("Hiển thị 0 / 2 Kanji")',
  );
  await clickText('Xóa bộ lọc');
  await waitFor(
    'document.querySelectorAll("#lesson-content-panel-kanji article").length === 2 && document.getElementById("kanji-character-filter").value === "" && document.getElementById("kanji-meaning-filter").value === ""',
  );
  await fill('kanji-meaning-filter', ' VĂN ');
  await waitFor(
    'document.querySelectorAll("#lesson-content-panel-kanji article").length === 1 && document.querySelector("#lesson-content-panel-kanji article").innerText.includes("文")',
  );
  await clickText('Xóa bộ lọc');
  await waitFor('document.querySelectorAll("#lesson-content-panel-kanji article").length === 2');
  assert.equal(
    requests.filter((request) => request === 'GET /api/v1/study/lessons/21/kanjis').length,
    2,
    'Client-side Kanji filters must not trigger additional requests or query params',
  );
  assert.equal(
    requests.some((request) => request.includes('/quiz')),
    false,
    'Quiz loads only when its tab opens',
  );
  await evaluate('document.getElementById("lesson-content-tab-kanji").focus()');
  await key('ArrowRight');
  assert.equal(await evaluate('document.activeElement.id'), 'lesson-content-tab-quiz');
  await waitFor('document.querySelector("#lesson-content-panel-quiz [role=status]")');
  await waitFor('document.querySelector("#lesson-content-panel-quiz [role=alert]")');
  assert.equal(
    requests.filter((request) => request === 'GET /api/v1/study/lessons/21/quiz').length,
    1,
  );
  await clickText('Thử lại');
  await waitFor('document.querySelector("#lesson-content-panel-quiz [role=status]")');
  await waitFor('document.querySelectorAll("#lesson-content-panel-quiz article").length === 2');
  assert.equal(
    await evaluate(
      'document.querySelector("#lesson-content-panel-quiz").innerText.includes("Quiz Bài 2") && document.querySelector("#lesson-content-panel-quiz").innerText.includes("Kiểm tra kiến thức về công việc và nghề nghiệp.") && document.querySelector("#lesson-content-panel-quiz").innerText.includes("Quiz Questions (2)")',
    ),
    true,
  );
  assert.deepEqual(
    await evaluate(
      '[...document.querySelectorAll("#lesson-content-panel-quiz article")].map((card) => ({ heading: card.querySelector("h4").innerText, question: card.querySelector("p").innerText, type: card.querySelector("span.font-mono").innerText, options: [...card.querySelectorAll("li")].map((option) => ({ label: option.firstElementChild.textContent.trim(), text: option.lastElementChild.lastChild.textContent.trim() })) }))',
    ),
    [
      {
        heading: 'Question 1',
        question: '「会社」 có nghĩa là gì?',
        type: 'SINGLE_CHOICE',
        options: [
          { label: 'A', text: 'Trường học.' },
          { label: 'B', text: 'Công ty.' },
          { label: 'C', text: 'Ngân hàng.' },
        ],
      },
      {
        heading: 'Question 2',
        question: 'Chọn cách đọc của 「会社」',
        type: 'MULTIPLE_CHOICE',
        options: [
          { label: 'A', text: 'かしゃ' },
          { label: 'B', text: 'かいしゃ' },
        ],
      },
    ],
  );
  assert.equal(
    await evaluate('document.querySelector("#lesson-content-tab-quiz").innerText.includes("2")'),
    true,
  );
  assert.equal(
    await evaluate('document.querySelector("#lesson-content-panel-quiz").innerText.includes("✓")'),
    false,
    'The response does not identify correct answers',
  );
  await screenshot('quiz-desktop.png');
  await evaluate('document.getElementById("lesson-content-tab-quiz").focus()');
  await key('ArrowRight');
  assert.equal(await evaluate('document.activeElement.id'), 'lesson-content-tab-grammar');
  await evaluate(
    'document.querySelector("aside button[aria-controls=lesson-content-panel-quiz]").click()',
  );
  await waitFor(
    'document.getElementById("lesson-content-tab-quiz").getAttribute("aria-selected") === "true"',
  );
  assert.equal(
    requests.filter((request) => request === 'GET /api/v1/study/lessons/21/quiz').length,
    2,
    'Returning to Quiz within staleTime must reuse its cached result',
  );
  await evaluate(
    'document.querySelector("aside button[aria-controls=lesson-content-panel-kanji]").click()',
  );
  await waitFor(
    'document.getElementById("lesson-content-tab-kanji").getAttribute("aria-selected") === "true"',
  );
  assert.equal(
    requests.filter((request) => request === 'GET /api/v1/study/lessons/21/kanjis').length,
    2,
    'Returning to Kanji within staleTime must reuse the cached list',
  );
  await clickTab('grammar');
  await clickTab('vocabulary');
  await evaluate('document.querySelector("input[aria-label=\\"Search vocabulary\\"]").focus()');
  await send('Input.insertText', { text: 'not found' });
  await waitFor(
    'document.querySelector("#lesson-content-panel-vocabulary tbody")?.innerText.includes("Không tìm thấy từ vựng phù hợp.") && document.querySelector("#lesson-content-tab-vocabulary").innerText.includes("0")',
  );
  for (const term of ['学生', 'がくせい', 'học sinh', '  HỌC SINH  ']) {
    await evaluate('document.querySelector("input[aria-label=\\"Search vocabulary\\"]").select()');
    await send('Input.insertText', { text: term });
    await waitFor(
      'document.querySelectorAll("#lesson-content-panel-vocabulary tbody tr").length === 1 && document.querySelector("#lesson-content-panel-vocabulary tbody")?.innerText.includes("学生")',
    );
    assert.equal(
      await evaluate(
        'document.querySelector("#lesson-content-panel-vocabulary tbody").innerText.includes("本")',
      ),
      false,
    );
  }
  await clickTab('grammar');
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
  await waitFor(
    'document.querySelector(".tox-edit-area iframe").contentDocument.body.isContentEditable',
  );
  await evaluate(
    'document.querySelector(".tox-edit-area iframe").contentWindow.focus(); document.querySelector(".tox-edit-area iframe").contentDocument.body.focus()',
  );
  await send('Input.insertText', { text: 'Workspace editor check' });
  await waitFor(
    'document.querySelector(".tox-edit-area iframe").contentDocument.body.innerText.includes("Workspace editor check")',
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
    requests.filter((request) => request === 'GET /api/v1/study/lessons/21/vocabularies').length,
    2,
  );

  await viewport(390, 844);
  await noOverflow();
  await screenshot('workspace-mobile.png');
  await clickTab('vocabulary');
  await screenshot('vocabulary-mobile.png');
  await clickTab('kanji');
  await waitFor(
    'document.getElementById("lesson-content-tab-kanji").getBoundingClientRect().right <= window.innerWidth',
  );
  await screenshot('kanji-mobile.png');
  await clickTab('quiz');
  await waitFor(
    'document.getElementById("lesson-content-tab-quiz").getAttribute("aria-selected") === "true" && document.getElementById("lesson-content-tab-quiz").getBoundingClientRect().right <= window.innerWidth',
  );
  await delay(200);
  await screenshot('quiz-mobile.png');
  await noOverflow();
  await clickTab('grammar');
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
  await clickLabel('Open curriculum');
  await waitFor('document.querySelector("[role=dialog]")');
  await evaluate(
    'document.querySelector("[role=dialog] button[aria-controls=lesson-content-panel-kanji]").click()',
  );
  await waitFor('!document.querySelector("[role=dialog]")');
  assert.equal(
    await evaluate(
      'document.getElementById("lesson-content-tab-kanji").getAttribute("aria-selected")',
    ),
    'true',
  );
  await clickLabel('Open curriculum');
  await waitFor('document.querySelector("[role=dialog]")');
  await evaluate(
    'document.querySelector("[role=dialog] button[aria-controls=lesson-content-panel-quiz]").click()',
  );
  await waitFor('!document.querySelector("[role=dialog]")');
  assert.equal(
    await evaluate(
      'document.getElementById("lesson-content-tab-quiz").getAttribute("aria-selected")',
    ),
    'true',
  );
  assert.equal(
    requests.filter((request) => request === 'GET /api/v1/study/lessons/21/quiz').length,
    2,
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
  await clickTab('vocabulary');
  await waitFor(
    'document.querySelector("#lesson-content-panel-vocabulary tbody")?.innerText.includes("Bài học chưa có từ vựng.")',
  );
  assert.equal(
    requests.filter((request) => request === 'GET /api/v1/study/lessons/22/vocabularies').length,
    1,
  );
  assert.equal(await evaluate('document.body.innerText.includes("学生")'), false);
  await clickTab('kanji');
  await waitFor(
    'document.querySelector("#lesson-content-panel-kanji")?.innerText.includes("Bài học chưa có Kanji.")',
  );
  assert.equal(
    requests.filter((request) => request === 'GET /api/v1/study/lessons/22/kanjis').length,
    1,
  );
  assert.equal(await evaluate('document.body.innerText.includes("ガク")'), false);
  await clickTab('quiz');
  await waitFor(
    'document.querySelector("#lesson-content-panel-quiz")?.innerText.includes("Bài học chưa có Quiz.")',
  );
  assert.equal(
    requests.filter((request) => request === 'GET /api/v1/study/lessons/22/quiz').length,
    1,
  );
  assert.equal(await evaluate('document.body.innerText.includes("Quiz Bài 2")'), false);
  await send('Page.navigate', { url: `${origin}/admin/courses/7/lessons/23` });
  await workspaceReady();
  await clickTab('quiz');
  await waitFor(
    'document.querySelector("#lesson-content-panel-quiz")?.innerText.includes("Quiz chưa có câu hỏi.")',
  );
  assert.equal(
    requests.filter((request) => request === 'GET /api/v1/study/lessons/23/quiz').length,
    1,
  );
  assert.equal(
    await evaluate(
      'document.querySelector("#lesson-content-panel-quiz").innerText.includes("Quiz trống")',
    ),
    true,
  );
  await send('Page.navigate', { url: `${origin}/admin/courses/7/lessons/24` });
  await workspaceReady();
  await clickTab('quiz');
  await waitFor('document.querySelector("#lesson-content-panel-quiz [role=alert]")');
  assert.equal(
    await evaluate(
      'document.querySelector("#lesson-content-panel-quiz").innerText.includes("Bài học chưa có Quiz.")',
    ),
    false,
  );
  assert.equal(
    await evaluate(
      'document.querySelector("#lesson-content-panel-quiz [role=alert]").innerText.includes("quyền truy cập")',
    ),
    true,
  );
  await send('Page.navigate', { url: `${origin}/admin/courses/7/lessons/25` });
  await workspaceReady();
  await clickTab('quiz');
  await waitFor('document.querySelector("#lesson-content-panel-quiz [role=alert]")');
  assert.equal(
    await evaluate(
      'document.querySelector("#lesson-content-panel-quiz").innerText.includes("Bài học chưa có Quiz.")',
    ),
    false,
  );
  await send('Page.navigate', { url: `${origin}/admin/courses/7/lessons/invalid` });
  await waitFor('document.body.innerText.includes("404")');
  assert.deepEqual(errors, []);
  authenticated = false;
  await send('Page.navigate', { url: `${origin}/admin/courses/7/lessons/21` });
  await waitFor('location.pathname === "/login"');
  assert.equal(await evaluate('document.querySelector("#grammar-heading") === null'), true);
  process.stdout.write(
    `Workspace browser checks passed: desktop/mobile/tablet, scrolling, drawer focus/Escape/backdrop, shared tabs, Vocabulary, Kanji and Quiz API states, grammar editor, admin create/edit layouts, lesson navigation, route validation and AuthGuard.\nScreenshots: ${profile}\n`,
  );
} finally {
  socket?.close();
  browser.kill();
}
