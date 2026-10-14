import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Opt-in: launched by AdminLessonWorkspaceBrowserTest against disposable H2.
// API interception only routes real HTTP requests to port 18080; no success responses are mocked.
const origin = process.env.LESSON_TEST_ORIGIN ?? 'http://localhost:3000';
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
  const lessonId = Number(process.env.LESSON_FIXTURE_ID);
  const otherId = Number(process.env.LESSON_FIXTURE_OTHER);
  const courseId = Number(process.env.LESSON_FIXTURE_COURSE);
  const path = `/admin/courses/${courseId}/lessons/${lessonId}`;
  let token;
  let failGrammarSave = false;
  let sessionChecked = false;
  const requests = [];
  listeners.set('Fetch.requestPaused', async ({ requestId, request }) => {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/v1/')) {
        if (failGrammarSave && request.method === 'PATCH' && url.pathname.endsWith('/grammar')) {
          failGrammarSave = false;
          await send('Fetch.failRequest', { requestId, errorReason: 'ConnectionReset' });
          return;
        }
        token = request.headers.Authorization?.replace(/^Bearer /, '') ?? token;
        requests.push({ method: request.method, path: url.pathname, query: url.search });
        url.port = '18080';
        await send('Fetch.continueRequest', { requestId, url: url.href });
      } else await send('Fetch.continueRequest', { requestId });
    } catch (error) {
      // AbortSignal cancellation can invalidate a paused CDP request before continuation.
      if (!error.message.includes('Invalid InterceptionId.')) errors.push(error.message);
    }
  });
  listeners.set('Runtime.exceptionThrown', ({ exceptionDetails }) =>
    errors.push(exceptionDetails.text),
  );
  listeners.set('Network.responseReceived', ({ response }) => {
    if (response.url.includes('/auth/refresh-token')) sessionChecked = true;
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  const navigate = async (target) => {
    await send('Page.navigate', { url: origin + target });
    await waitFor('document.readyState === "complete"');
  };
  const api = async (method, endpoint, body) =>
    evaluate(`(async () => {
    const response = await fetch('http://localhost:18080/api/v1' + ${JSON.stringify(endpoint)}, {
      method: ${JSON.stringify(method)},
      headers: { Authorization: 'Bearer ' + ${JSON.stringify(token)}, 'Content-Type': 'application/json' },
      body: ${body === undefined ? 'undefined' : JSON.stringify(JSON.stringify(body))}
    });
    return { status: response.status, body: await response.json().catch(() => null) };
  })()`);
  await navigate('/login');
  await waitFor('document.querySelector("#login-email")');
  for (let i = 0; i < 300 && !sessionChecked; i++) await delay(100);
  assert.ok(sessionChecked, 'Session bootstrap completed');
  await waitFor(
    'Object.keys(document.querySelector("#login-email")).some(key => key.startsWith("__reactProps"))',
  );
  await evaluate('document.querySelector("#login-email").closest("form").requestSubmit()');
  await waitFor('document.querySelector("#login-email-error")');
  await evaluate('document.querySelector("#login-email").focus()');
  await send('Input.insertText', { text: process.env.LESSON_FIXTURE_EMAIL });
  await delay(100);
  await evaluate('document.querySelector("#login-password").focus()');
  await send('Input.insertText', { text: process.env.LESSON_FIXTURE_PASSWORD });
  await delay(100);
  assert.equal(await evaluate('document.querySelector("#login-email").value.length > 0 && document.querySelector("#login-password").value.length > 0'), true, 'Credentials entered');
  await evaluate('document.querySelector("#login-password").blur()');
  await evaluate('document.querySelector("#login-email").closest("form").requestSubmit()');
  await waitFor('location.pathname !== "/login"');
  await navigate(path);
  await waitFor(`window.tinymce?.get('lesson-${lessonId}-grammar')?.initialized`);
  await edit(`lesson-${lessonId}-grammar`, '<h2>Persisted browser grammar</h2>');
  failGrammarSave = true;
  await clickText('Lưu ngữ pháp');
  await waitFor('document.querySelector("main [role=alert]")');
  assert.equal(
    await evaluate(
      `window.tinymce.get('lesson-${lessonId}-grammar').getContent().includes('Persisted browser grammar')`,
    ),
    true,
  );
  assert.ok(
    (await api('GET', `/lessons/${lessonId}`)).body.data.grammar.includes('Original grammar'),
  );
  await clickText('Lưu ngữ pháp');
  await waitFor('document.body.innerText.includes("Đã lưu ngữ pháp")');
  await send('Page.reload');
  await waitFor(
    `window.tinymce?.get('lesson-${lessonId}-grammar')?.initialized && window.tinymce.get('lesson-${lessonId}-grammar').getContent().includes('Persisted browser grammar')`,
  );

  // Metadata save must preserve grammar and null duration through a full reload.
  await navigate(path + '/edit');
  await waitFor('document.querySelector("#lesson-title")');
  assert.equal(await evaluate('Boolean(document.querySelector("#lesson-grammar"))'), false);
  await fill('#lesson-title', 'Renamed browser lesson');
  await fill('#lesson-duration', '');
  await clickText('Lưu thay đổi');
  await waitFor(`location.pathname === '/admin/courses/${courseId}'`);
  await navigate(path);
  await waitFor(
    `window.tinymce?.get('lesson-${lessonId}-grammar')?.initialized && window.tinymce.get('lesson-${lessonId}-grammar').getContent().includes('Persisted browser grammar')`,
  );
  await clickText('Xuất bản');
  await clickText('Xuất bản', 'document.querySelector("[role=alertdialog]")');
  await noModal();
  await waitFor('document.body.innerText.includes("Ẩn bài học")');

  await evaluate('document.querySelector("#lesson-content-tab-vocabulary").click()');
  await waitFor('document.body.innerText.includes("Add Vocabulary")');
  await clickText('Add Vocabulary');
  await clickText('Lưu từ vựng', modal);
  await waitFor('document.querySelector("#vocabulary-word-error")');
  await fill('#vocabulary-word', 'BrowserWord');
  await fill('#vocabulary-reading', 'reading');
  await fill('#vocabulary-meaningVi', 'Browser meaning');
  await evaluate(
    'document.querySelector("[role=dialog] form").requestSubmit(); document.querySelector("[role=dialog] form").requestSubmit()',
  );
  await noModal();
  await waitFor('document.body.innerText.includes("BrowserWord")');
  assert.equal(
    requests.filter((r) => r.method === 'POST' && r.path === '/api/v1/vocabularies').length,
    1,
  );
  await evaluate('document.querySelector("button[aria-label=\\"Edit BrowserWord\\"]").click()');
  await fill('#vocabulary-meaningVi', 'Updated browser meaning');
  await clickText('Lưu từ vựng', modal);
  await noModal();
  assert.ok(requests.some((r) => r.method === 'PUT' && r.query === `?lessonId=${lessonId}`));
  await send('Page.reload');
  await waitFor('document.body.innerText.includes("Updated browser meaning")');
  const studentVocabulary = await api('GET', `/study/lessons/${lessonId}/vocabularies`);
  assert.equal(studentVocabulary.status, 200);
  assert.equal(studentVocabulary.body.data[0].meaningVi, 'Updated browser meaning');
  const vocabId = studentVocabulary.body.data[0].id;
  assert.equal((await api('DELETE', `/vocabularies/${vocabId}?lessonId=${otherId}`)).status, 404);
  await evaluate('document.querySelector("button[aria-label=\\"Delete BrowserWord\\"]").click()');
  await clickText('Xác nhận xóa', 'document.querySelector("[role=alertdialog]")');
  await noModal();
  await waitFor('!document.querySelector("button[aria-label=\\"Delete BrowserWord\\"]")');
  assert.equal((await api('GET', `/study/lessons/${lessonId}/vocabularies`)).body.data.length, 0);

  await evaluate('document.querySelector("#lesson-content-tab-kanji").click()');
  await waitFor('document.body.innerText.includes("Thêm Kanji")');
  await clickText('Thêm Kanji');
  await fill('#kanji-kanji', '山');
  await fill('#kanji-meaningVi', 'Browser mountain');
  await fill('#kanji-strokeCount', '');
  await clickText('Lưu Kanji', modal);
  await noModal();
  await waitFor('document.querySelector("button[aria-label=\\"Sửa Kanji 山\\"]")');
  await evaluate('document.querySelector("button[aria-label=\\"Sửa Kanji 山\\"]").click()');
  await fill('#kanji-strokeCount', '3');
  await clickText('Lưu Kanji', modal);
  await noModal();
  await send('Page.reload');
  await waitFor('document.querySelector("button[aria-label=\\"Sửa Kanji 山\\"]")');
  const studentKanji = await api('GET', `/study/lessons/${lessonId}/kanjis`);
  assert.equal(studentKanji.body.data[0].strokeCount, 3);
  assert.equal(
    (await api('DELETE', `/kanjis/${studentKanji.body.data[0].id}?lessonId=${otherId}`)).status,
    404,
  );
  await evaluate('document.querySelector("button[aria-label=\\"Xóa Kanji 山\\"]").click()');
  await clickText('Xác nhận xóa', 'document.querySelector("[role=alertdialog]")');
  await noModal();
  assert.equal((await api('GET', `/study/lessons/${lessonId}/kanjis`)).body.data.length, 0);

  // Use the same real API to verify quiz ordering, publication, student projection and deletion.
  const quizPath = `/admin/lessons/${lessonId}/quiz`;
  assert.equal((await api('GET', quizPath)).status, 204);
  const quiz = await api('POST', quizPath, { title: 'Browser quiz', description: '' });
  assert.equal(quiz.status, 201);
  const quizId = quiz.body.data.id;
  const questions = [];
  for (const questionText of ['First', 'Second']) {
    const response = await api('POST', `${quizPath}/${quizId}/questions`, {
      questionText,
      questionType: 'SINGLE_CHOICE',
      options: [
        { optionText: 'Yes', isCorrect: true },
        { optionText: 'No', isCorrect: false },
      ],
    });
    assert.equal(response.status, 201);
    questions.push(response.body.data.questions.at(-1).id);
  }
  assert.equal(
    (
      await api('PUT', `${quizPath}/${quizId}/questions/order`, {
        questionIds: [...questions].reverse(),
      })
    ).status,
    200,
  );
  assert.equal(
    (await api('PATCH', `${quizPath}/${quizId}/publication`, { isPublished: true })).status,
    200,
  );
  const studentQuiz = await api('GET', `/study/lessons/${lessonId}/quiz`);
  assert.equal(studentQuiz.status, 200);
  assert.equal(studentQuiz.body.data.questions[0].questionText, 'Second');
  assert.equal('isCorrect' in studentQuiz.body.data.questions[0].options[0], false);
  await evaluate('document.querySelector("#lesson-content-tab-quiz").click()');
  await waitFor('document.body.innerText.includes("Browser quiz")');
  await clickText('Xem trước bài học');
  await waitFor(
    'document.querySelector("[role=dialog]")?.textContent.includes("Persisted browser grammar")',
  );
  await clickText('Quay lại chỉnh sửa', modal);
  await noModal();
  assert.equal((await api('DELETE', `/admin/lessons/${otherId}/quiz/${quizId}`)).status, 404);
  assert.equal((await api('DELETE', `${quizPath}/${quizId}`)).status, 204);
  assert.equal((await api('GET', quizPath)).status, 204);
  assert.equal((await api('GET', `/lessons/${lessonId}`)).body.data.durationMinutes, null);

  // Browser history must not erase a draft or put it in another lesson.
  await evaluate('document.querySelector("#lesson-content-tab-grammar").click()');
  await waitFor(`window.tinymce?.get('lesson-${lessonId}-grammar')?.initialized`);
  await evaluate(`document.querySelector('aside a[href^="/admin/courses/${courseId}/lessons/${otherId}"]').click()`);
  await waitFor(`window.tinymce?.get('lesson-${otherId}-grammar')?.initialized`);
  await evaluate(`document.querySelector('aside a[href^="/admin/courses/${courseId}/lessons/${lessonId}"]').click()`);
  await waitFor(`window.tinymce?.get('lesson-${lessonId}-grammar')?.initialized`);
  await edit(`lesson-${lessonId}-grammar`, '<p>Retain across history</p>');
  await evaluate('history.back()');
  await waitFor(`window.tinymce?.get('lesson-${otherId}-grammar')?.initialized`);
  assert.equal(await evaluate(`window.tinymce.get('lesson-${otherId}-grammar').getContent().includes('Other grammar')`), true);
  await evaluate('history.forward()');
  await waitFor(
    `window.tinymce?.get('lesson-${lessonId}-grammar')?.initialized && window.tinymce.get('lesson-${lessonId}-grammar').getContent().includes('Retain across history')`,
  );
  assert.deepEqual(errors, []);
  process.stdout.write(
    'Real browser + H2 passed: login/CSRF, grammar reload, metadata preservation, publication, vocabulary CRUD/ownership, quiz ordering/student projection/preview/deletion, history draft.\n',
  );
} finally {
  socket?.close();
  browser.kill();
}
