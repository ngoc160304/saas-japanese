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
    durationMinutes: 10,
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
  const quizzes = new Map();
  const quizWrites = [];
  let nextQuizId = 20;
  let nextQuestionId = 100;
  let nextOptionId = 300;
  let quizReadFailure = null;
  let grammarFailure = false;
  let nextItemId = 100;
  const writes = [];
  const requests = [];
  // Generate a tiny playable provider fixture locally; never contact a media service.
  const previewVideo = await evaluate(`(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 90;
    const context = canvas.getContext('2d');
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];
    recorder.ondataavailable = event => chunks.push(event.data);
    const stopped = new Promise(resolve => recorder.onstop = resolve);
    recorder.start();
    for (let frame = 0; frame < 5; frame++) {
      context.fillStyle = frame % 2 ? '#bae6fd' : '#e0f2fe';
      context.fillRect(0, 0, 160, 90);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    recorder.stop(); await stopped; stream.getTracks().forEach(track => track.stop());
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(new Blob(chunks, { type: 'video/webm' }));
    });
  })()`);
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
      if (url.hostname === 'video.example.test') {
        return void (await send('Fetch.fulfillRequest', {
          requestId,
          responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'video/webm' }],
          body: previewVideo,
        }));
      }
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
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
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
      else if (/^\/api\/v1\/lessons\/\d+\/grammar$/.test(url.pathname)) {
        if (grammarFailure) {
          status = 500;
          body = { status, message: 'Không thể lưu ngữ pháp', fieldErrors: {} };
        } else {
          const lesson = lessons.find((item) => item.id === Number(url.pathname.split('/')[4]));
          lesson.grammar = JSON.parse(request.postData).grammar;
          body = { data: lesson };
        }
      } else if (/^\/api\/v1\/admin\/lessons\/\d+\/quiz/.test(url.pathname)) {
        const parts = url.pathname.split('/');
        const lessonId = Number(parts[5]),
          quizId = Number(parts[7]);
        const questionId = Number(parts[9]);
        let quiz = quizzes.get(lessonId);
        const payload = request.postData ? JSON.parse(request.postData) : null;
        if (request.method === 'GET') {
          if (quizReadFailure) {
            status = quizReadFailure;
            body = { status, message: 'Không thể tải Quiz', fieldErrors: {} };
          } else if (!quiz) status = 204;
          else body = { data: quiz };
        } else {
          quizWrites.push({
            lessonId,
            quizId,
            questionId,
            method: request.method,
            path: url.pathname,
            payload,
          });
          if (holdNext) {
            holdNext = false;
            await new Promise((resolve) => {
              releaseHeld = resolve;
            });
          }
          if (delayNext) {
            delayNext = false;
            await delay(1000);
          }
          if (failNext) {
            status = failNext;
            failNext = null;
            body = {
              status,
              message: 'Validation failed',
              fieldErrors: { questionText: 'Câu hỏi cần kiểm tra lại' },
            };
          } else if (!quizId && request.method === 'POST') {
            if (quiz) {
              status = 409;
              body = { status, message: 'This lesson already has an active quiz', fieldErrors: {} };
            } else {
              quiz = {
                id: nextQuizId++,
                lessonId,
                ...payload,
                isPublished: false,
                questions: [],
                createdAt: now,
                updatedAt: now,
              };
              quizzes.set(lessonId, quiz);
              status = 201;
              body = { data: quiz };
            }
          } else if (!quiz || quiz.id !== quizId) status = 404;
          else if (parts[8] === 'publication') {
            if (
              payload.isPublished &&
              (!quiz.questions.length || quiz.questions.some((q) => !q.authoringSupported))
            ) {
              status = 409;
              body = {
                status,
                message:
                  'Publishing requires valid metadata and at least one question; unpublish first',
                fieldErrors: {},
              };
            } else {
              quiz.isPublished = payload.isPublished;
              body = { data: quiz };
            }
          } else if (parts[8] === 'questions') {
            if (parts[9] === 'order') {
              if (
                payload.questionIds.length !== quiz.questions.length ||
                new Set(payload.questionIds).size !== quiz.questions.length ||
                payload.questionIds.some((id) => !quiz.questions.some((q) => q.id === id))
              ) {
                status = 400;
                body = {
                  status,
                  message:
                    'Include every active question ID exactly once, without foreign or deleted IDs',
                  fieldErrors: {},
                };
              } else {
                quiz.questions = payload.questionIds.map((id, sortOrder) => ({
                  ...quiz.questions.find((q) => q.id === id),
                  sortOrder,
                }));
                body = { data: quiz };
              }
            } else if (request.method === 'DELETE') {
              if (!quiz.questions.some((q) => q.id === questionId)) status = 404;
              else if (quiz.isPublished && quiz.questions.length === 1) {
                status = 409;
                body = {
                  status,
                  message:
                    'Publishing requires valid metadata and at least one question; unpublish first',
                  fieldErrors: {},
                };
              } else {
                quiz.questions = quiz.questions.filter((q) => q.id !== questionId);
                status = 204;
              }
            } else if (questionId && !quiz.questions.some((q) => q.id === questionId)) status = 404;
            else {
              const old = quiz.questions.find((q) => q.id === questionId);
              const question = {
                id: old?.id ?? nextQuestionId++,
                questionText: payload.questionText,
                questionType: payload.questionType,
                authoringSupported: true,
                sortOrder: old?.sortOrder ?? quiz.questions.length,
                createdAt: now,
                updatedAt: now,
                options: payload.options.map((o, sortOrder) => ({
                  ...o,
                  id: o.id ?? nextOptionId++,
                  sortOrder,
                })),
              };
              if (old) quiz.questions = quiz.questions.map((q) => (q.id === old.id ? question : q));
              else {
                quiz.questions.push(question);
                status = 201;
              }
              body = { data: quiz };
            }
          } else if (request.method === 'DELETE') {
            quizzes.delete(lessonId);
            status = 204;
          } else {
            Object.assign(quiz, payload);
            body = { data: quiz };
          }
        }
      } else {
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
      // Navigation/AbortSignal may cancel a request before CDP delivers its fixture.
      if (error.message.includes('Invalid InterceptionId')) return;
      errors.push(error.message);
      try {
        await send('Fetch.failRequest', { requestId, errorReason: 'Failed' });
      } catch (failure) {
        if (!failure.message.includes('Invalid InterceptionId')) errors.push(failure.message);
      }
    }
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
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
  const alert = 'document.querySelector("[role=alertdialog]")';
  const quizTab = () => evaluate('document.querySelector("#lesson-content-tab-quiz").click()');
  const clickLabel = (label) =>
    evaluate(`document.querySelector('button[aria-label=${JSON.stringify(label)}]').click()`);
  const saveQuestion = async (text) => {
    await clickText('Thêm câu hỏi');
    await fill('#quiz-question-text', text);
    await fill('textarea[name="options.0.optionText"]', 'がっこう');
    await fill('textarea[name="options.1.optionText"]', 'がくせい');
    await evaluate('document.querySelector("input[type=radio]").click()');
    await clickText('Lưu câu hỏi', modal);
    await noModal();
  };
  await navigate('/admin/courses/1/lessons/1?tab=grammar');
  await waitFor('window.tinymce?.get("lesson-1-grammar")?.initialized');
  await edit('lesson-1-grammar', '<p>Unsaved grammar survives Quiz</p>');
  await quizTab();
  await waitFor('document.body.innerText.includes("Bài học chưa có Quiz.")');
  await clickText('Tạo Quiz');
  await clickText('Tạo Quiz nháp', modal);
  await waitFor('document.querySelector("#quiz-title-error")?.textContent.includes("Nhập")');
  await fill('#quiz-title', 'Draft Quiz');
  await fill('#quiz-description', 'Practice');
  delayNext = true;
  await clickText('Tạo Quiz nháp', modal);
  await clickText('Tạo Quiz nháp', modal).catch(() => {});
  await noModal();
  assert.equal(quizWrites.filter((w) => !w.quizId).length, 1);
  await clickText('Xuất bản Quiz');
  await clickText('Xuất bản Quiz', alert);
  await waitFor(
    'document.querySelector("[role=alertdialog]")?.textContent.includes("ít nhất một câu hỏi")',
  );
  await clickText('Hủy', alert);
  await noModal();
  await clickText('Thêm câu hỏi');
  await fill('#quiz-question-text', 'Question first');
  await fill('textarea[name="options.0.optionText"]', 'First');
  await fill('textarea[name="options.1.optionText"]', 'Second');
  await clickText('Lưu câu hỏi', modal);
  await waitFor('document.querySelector("[role=dialog]")?.textContent.includes("Chọn đúng một")');
  await evaluate('document.querySelector("input[type=radio]").click()');
  await clickText('Thêm lựa chọn', modal);
  await fill('textarea[name="options.2.optionText"]', 'Third');
  await clickLabel('Xóa lựa chọn 1');
  await clickText('Lưu câu hỏi', modal);
  await waitFor('document.querySelector("[role=dialog]")?.textContent.includes("Chọn đúng một")');
  await evaluate('document.querySelector("input[type=radio]").click()');
  await clickText('Hủy', modal);
  await waitFor('document.querySelector("[role=dialog]")?.textContent.includes("Bỏ các thay đổi")');
  assert.equal(
    await evaluate('document.querySelectorAll("[role=dialog], [role=alertdialog]").length'),
    1,
  );
  await clickText('Tiếp tục chỉnh sửa', modal);
  failNext = 400;
  await clickText('Lưu câu hỏi', modal);
  await waitFor(
    'document.querySelector("#quiz-question-error")?.textContent.includes("kiểm tra lại")',
  );
  assert.equal(
    await evaluate('document.querySelector("#quiz-question-text").value'),
    'Question first',
  );
  await clickText('Lưu câu hỏi', modal);
  await noModal();
  await saveQuestion('Question second');
  const quiz = quizzes.get(1);
  const firstId = quiz.questions[0].id,
    secondId = quiz.questions[1].id;
  await clickLabel('Sửa câu hỏi 1');
  await fill('textarea[name="options.0.optionText"]', 'Edited retained option');
  await evaluate('document.querySelectorAll("input[type=radio]")[1].click()');
  const retainedIds = quiz.questions[0].options.map((o) => o.id);
  await clickText('Lưu câu hỏi', modal);
  await noModal();
  assert.deepEqual(
    quiz.questions[0].options.map((o) => o.id),
    retainedIds,
  );
  assert.equal(quiz.questions[0].options[1].isCorrect, true);
  await clickLabel('Di chuyển câu hỏi 2 lên');
  await waitFor(
    `document.querySelector('article[aria-label="Câu hỏi 1"]')?.textContent.includes("Question second")`,
  );
  assert.deepEqual(
    quiz.questions.map((q) => q.id),
    [secondId, firstId],
  );
  // A stale full-list reorder is rejected and reconciled without dropping another editor's question.
  quiz.questions.push({
    ...quiz.questions[0],
    id: nextQuestionId++,
    questionText: 'Concurrent question',
    sortOrder: 2,
  });
  await clickLabel('Di chuyển câu hỏi 2 lên');
  await waitFor('document.body.innerText.includes("Danh sách câu hỏi đã thay đổi")');
  await waitFor('document.body.innerText.includes("Concurrent question")');
  await clickLabel('Xóa câu hỏi 3');
  await clickText('Xác nhận xóa', alert);
  await noModal();
  // Saved preview keeps dirty grammar and does not send grading/progress writes.
  await clickText('Xem trước bài học');
  await waitFor('document.querySelector("[role=alertdialog]")?.textContent.includes("chưa lưu")');
  grammarFailure = true;
  await clickText('Lưu và xem trước', alert);
  await waitFor(
    'document.querySelector("[role=alertdialog]")?.textContent.includes("Dịch vụ tạm thời gián đoạn")',
  );
  assert.equal(
    await evaluate('Boolean(document.querySelector("[data-testid=lesson-preview]"))'),
    false,
  );
  grammarFailure = false;
  await clickText('Xem bản đã lưu', alert);
  await waitFor('document.querySelector("[data-testid=lesson-preview]")');
  const previewText = await evaluate(
    'document.querySelector("[data-testid=lesson-preview]").innerText',
  );
  assert.ok(previewText.includes('Saved grammar') && !previewText.includes('Unsaved grammar'));
  assert.ok(previewText.includes('word13') && previewText.includes('Quiz bản nháp'));
  assert.ok(!previewText.includes('Đáp án đúng'));
  await waitFor('document.querySelector("[data-testid=lesson-preview] video")?.readyState >= 2');
  const playback = await send('Runtime.evaluate', {
    expression: 'document.querySelector("[data-testid=lesson-preview] video").play()',
    awaitPromise: true,
    userGesture: true,
  });
  assert.ok(!playback.exceptionDetails);
  await waitFor('document.querySelector("[data-testid=lesson-preview] video")?.currentTime > 0');
  if (process.env.LESSON_TEST_SCREENSHOT) {
    await delay(4500);
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(
      process.env.LESSON_TEST_SCREENSHOT.replace('.png', '-desktop.png'),
      Buffer.from(screenshot.data, 'base64'),
    );
  }
  assert.ok(
    await evaluate(
      'Boolean(document.querySelector("[data-testid=lesson-preview] video[controls]"))',
    ),
  );
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  assert.ok(
    await evaluate('document.querySelector("[role=dialog]").getBoundingClientRect().width <= 390'),
  );
  if (process.env.LESSON_TEST_SCREENSHOT) {
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(process.env.LESSON_TEST_SCREENSHOT, Buffer.from(screenshot.data, 'base64'));
  }
  await clickText('Quay lại chỉnh sửa', modal);
  await noModal();
  await evaluate('document.querySelector("#lesson-content-tab-grammar").click()');
  await waitFor('window.tinymce?.get("lesson-1-grammar")?.initialized');
  assert.ok(
    await evaluate(
      'window.tinymce.get("lesson-1-grammar").getContent().includes("Unsaved grammar survives Quiz")',
    ),
  );
  await quizTab();
  await clickText('Xuất bản Quiz');
  await clickText('Xuất bản Quiz', alert);
  await noModal();
  assert.equal(quiz.isPublished, true);
  assert.equal(lessons[0].isPublished, false);
  await clickLabel('Xóa câu hỏi 1');
  await clickText('Hủy', alert);
  await noModal();
  assert.equal(quiz.questions.length, 2);
  await clickLabel('Xóa câu hỏi 1');
  await clickText('Xác nhận xóa', alert);
  await noModal();
  await waitFor('document.body.innerText.includes("Câu hỏi (1)")');
  await clickLabel('Xóa câu hỏi 1');
  await clickText('Xác nhận xóa', alert);
  await waitFor(
    'document.querySelector("[role=alertdialog] [role=alert]")?.textContent.includes("hãy ẩn Quiz")',
  );
  await clickText('Hủy', alert);
  await noModal();
  await clickText('Ẩn Quiz');
  await clickText('Ẩn Quiz', alert);
  await noModal();
  // Refresh retains the server fixture, order and changes.
  await navigate('/admin/courses/1/lessons/1?tab=quiz');
  await waitFor('document.body.innerText.includes("Edited retained option")');
  await clickText('Sửa thông tin Quiz');
  await fill('#quiz-title', 'Updated Quiz');
  await clickText('Lưu thông tin Quiz', modal);
  await noModal();
  assert.equal(quiz.title, 'Updated Quiz');
  // Stale edit: server record disappears; input stays visible with an exit path.
  await clickLabel('Sửa câu hỏi 1');
  quiz.questions = [];
  await clickText('Lưu câu hỏi', modal);
  await waitFor(
    'document.querySelector("[role=dialog]")?.textContent.includes("không còn tồn tại")',
  );
  await clickText('Hủy', modal);
  await noModal();
  await clickText('Xóa Quiz');
  await clickText('Xác nhận xóa', alert);
  await noModal();
  await waitFor('document.body.innerText.includes("Bài học chưa có Quiz.")');
  // Duplicate-create conflict reconciles current Quiz, without discarding entered metadata.
  await clickText('Tạo Quiz');
  await fill('#quiz-title', 'Losing create');
  quizzes.set(1, { ...quiz, id: nextQuizId++, title: 'Other editor created', questions: [] });
  await clickText('Tạo Quiz nháp', modal);
  await waitFor('document.querySelector("[role=dialog]")?.textContent.includes("đã có Quiz")');
  assert.equal(await evaluate('document.querySelector("#quiz-title").value'), 'Losing create');
  await clickText('Hủy', modal);
  await clickText('Bỏ thay đổi', modal);
  await noModal();
  // Unsupported types are never edited or silently converted.
  quizzes.get(1).questions.push({
    id: 999,
    questionType: 'MULTIPLE_CHOICE',
    questionText: 'Legacy',
    authoringSupported: false,
    sortOrder: 0,
    options: [],
    createdAt: now,
    updatedAt: now,
  });
  await navigate('/admin/courses/1/lessons/1?tab=quiz');
  await waitFor('document.body.innerText.includes("hiện chỉ được xem")');
  assert.equal(
    await evaluate(`document.querySelector('button[aria-label="Sửa câu hỏi 1"]').disabled`),
    true,
  );
  // Late successful write after a Next navigation must not change the next lesson's dialog.
  await clickText('Sửa thông tin Quiz');
  await fill('#quiz-title', 'Late origin');
  holdNext = true;
  await clickText('Lưu thông tin Quiz', modal);
  for (let i = 0; i < 100 && !releaseHeld; i++) await delay(20);
  assert.ok(releaseHeld);
  await evaluate(`document.querySelector('a[href^="/admin/courses/1/lessons/2"]').click()`);
  await waitFor('document.querySelector("h1")?.textContent === "Lesson 2"');
  await quizTab();
  await waitFor('document.body.innerText.includes("Bài học chưa có Quiz.")');
  await clickText('Tạo Quiz');
  await fill('#quiz-title', 'New lesson draft');
  releaseHeld();
  await delay(600);
  assert.equal(await evaluate('document.querySelector("#quiz-title").value'), 'New lesson draft');
  assert.equal(quizzes.has(2), false);
  await clickText('Hủy', modal);
  await clickText('Bỏ thay đổi', modal);
  await noModal();
  // A failed read stays a retryable error, never the create-Quiz empty state.
  for (const status of [403, 404, 500]) {
    quizReadFailure = status;
    await navigate('/admin/courses/1/lessons/2?tab=quiz');
    await waitFor(
      'document.querySelector("#quiz-heading") && document.body.innerText.includes("Thử lại")',
    );
    assert.equal(
      await evaluate(
        '[...document.querySelectorAll("button")].some(b => b.textContent.trim() === "Tạo Quiz")',
      ),
      false,
    );
  }
  quizReadFailure = null;
  await clickText('Thử lại');
  await waitFor('document.body.innerText.includes("Bài học chưa có Quiz.")');
  // Wrong parent prevents all content/Quiz requests.
  lessons[1].courseId = 2;
  const beforeWrongParent = quizWrites.length;
  const requestCount = requests.length;
  await navigate('/admin/courses/1/lessons/2?tab=quiz');
  await waitFor('document.body.innerText.includes("Bài học không khả dụng")');
  assert.equal(quizWrites.length, beforeWrongParent);
  assert.ok(!requests.slice(requestCount).some((r) => r.includes('/admin/lessons/2/quiz')));
  lessons[1].courseId = 1;
  await navigate('/admin/courses/1/lessons/2?tab=quiz');
  await waitFor('document.body.innerText.includes("Bài học chưa có Quiz.")');
  await clickText('Tạo Quiz');
  await fill('#quiz-title', 'Old account pending');
  releaseHeld = null;
  holdNext = true;
  await clickText('Tạo Quiz nháp', modal);
  for (let i = 0; i < 100 && !releaseHeld; i++) await delay(20);
  assert.ok(releaseHeld);
  expireSession = true;
  await evaluate(`document.querySelector('a[href^="/admin/courses/1/lessons/3"]').click()`);
  await waitFor('document.querySelector("#login-email")');
  await fill('#login-email', 'second@example.test');
  await fill('#login-password', 'MockPassword123!');
  await clickText('Đăng nhập');
  await waitFor(
    'document.querySelector("#quiz-heading") && location.pathname.endsWith("/lessons/3")',
  );
  await quizTab();
  await waitFor('document.body.innerText.includes("Bài học chưa có Quiz.")');
  await clickText('Tạo Quiz');
  await fill('#quiz-title', 'Second account draft');
  releaseHeld();
  await delay(600);
  assert.equal(
    await evaluate('document.querySelector("#quiz-title").value'),
    'Second account draft',
  );
  assert.equal(await evaluate('document.body.innerText.includes("Đã lưu Quiz.")'), false);
  await clickText('Hủy', modal);
  await clickText('Bỏ thay đổi', modal);
  await noModal();
  // Save-before-preview awaits the write and reads the persisted result.
  await evaluate('document.querySelector("#lesson-content-tab-grammar").click()');
  await waitFor('window.tinymce?.get("lesson-3-grammar")?.initialized');
  await edit('lesson-3-grammar', '<p>Saved before preview</p>');
  await clickText('Xem trước bài học');
  await clickText('Lưu và xem trước', alert);
  await waitFor(
    'document.querySelector("[data-testid=lesson-preview]")?.textContent.includes("Saved before preview")',
  );
  assert.equal(lessons[2].grammar, '<p>Saved before preview</p>');
  await clickText('Quay lại chỉnh sửa', modal);
  await noModal();
  assert.equal(await evaluate('document.body.innerText.includes("Chưa lưu thay đổi")'), false);
  assert.ok(
    !requests.some(
      (r) => r.includes('/study/') || r.includes('/progress') || r.includes('/answer'),
    ),
  );
  assert.deepEqual(errors, []);
  process.stdout.write(
    'Phase 6 mocked browser: Quiz CRUD/validation/options/order/publication/preview, dirty grammar, failed preview save, retry/403/404/500, wrong parent, duplicate/stale/legacy records, rapid clicks, mobile, late navigation and account changes passed.\n',
  );
} finally {
  socket?.close();
  browser.kill();
}
