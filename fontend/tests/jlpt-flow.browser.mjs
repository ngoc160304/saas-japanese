import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const origin = process.env.JLPT_TEST_ORIGIN ?? 'http://localhost:3138';
const browserPath = process.env.AUTH_TEST_BROWSER ?? [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
assert.ok(browserPath, 'Set AUTH_TEST_BROWSER to an installed Chromium browser');
const profile = await mkdtemp(join(tmpdir(), 'jlpt-flow-'));
const browser = spawn(browserPath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
let socket;
try {
  let port;
  for (let index = 0; index < 100; index++) {
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
    catch { await delay(100); }
  }
  assert.ok(port, 'Browser did not start');
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  const errors = [];
  const starts = [];
  const saves = [];
  const submissions = [];
  const selected = new Map();
  const completed = new Set();
  let fullExamStarts = 0;
  let failSaveOnce = true;
  let failSubmitOnce = true;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let index = 0; index < 200; index++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    throw new Error(`Timed out: ${expression}; body=${await evaluate('document.body.innerText.slice(0, 800)')}; errors=${errors}`);
  };
  const navigate = (path) => send('Page.navigate', { url: `${origin}${path}` });
  const question = (id, order, label) => ({
    questionId: id, questionOrder: order, questionText: label,
    answers: [{ answerId: id * 10, answerText: 'First' }, { answerId: id * 10 + 1, answerText: 'Second' }],
  });
  const questions = [question(30, 1, 'First question'), ...Array.from({ length: 15 }, (_, index) => question(31 + index, index + 2, `Question ${index + 2}`))];
  const secondPart = Array.from({ length: 8 }, (_, index) => question(50 + index, index + 1, `Part two ${index + 1}`));
  const listening = Array.from({ length: 6 }, (_, index) => question(70 + index, index + 1, `Listening ${index + 1}`));
  const sessions = [
    { attemptSessionId: 1001, sessionId: 11, sessionTitle: 'Language knowledge', sessionOrder: 1, parts: [
      { attemptPartId: 101, partId: 21, partName: 'Part one', partOrder: 1, questions },
      { attemptPartId: 102, partId: 22, partName: 'Part two', partOrder: 2, questions: secondPart },
    ] },
    { attemptSessionId: 1002, sessionId: 12, sessionTitle: 'Listening', sessionOrder: 2, parts: [
      { attemptPartId: 103, partId: 23, partName: 'Listening part', partOrder: 1, questions: listening },
    ] },
  ];
  const exam = (id) => ({
    id, title: `N5 Exam ${id}`, description: 'Practice', jlptLevel: 'N5', isPublished: true,
    totalTimeMinutes: id === 6 ? 1 : 60,
    sessions: sessions.map((session) => ({
      id: session.sessionId, name: session.sessionTitle, sessionType: session.sessionId === 12 ? 'listening' : 'language_knowledge',
      sortOrder: session.sessionOrder, timeLimitMinutes: 30, questionCount: session.parts.flatMap((part) => part.questions).length,
      parts: session.parts.map((part) => ({ id: part.partId, name: part.partName, instructions: 'Choose one answer.', sortOrder: part.partOrder, questionCount: part.questions.length, audioMediaId: null })),
    })),
  });
  const attempt = (id, attemptId = id === 6 ? 906 : 905) => ({ attemptId, examId: id, examTitle: `N5 Exam ${id}`, mode: 'full', startedAt: id === 6 ? new Date(Date.now() - 65_000).toISOString() : new Date().toISOString(), sessions });
  const result = (attemptId) => ({
    attemptId, examId: attemptId === 906 ? 6 : 5, examTitle: `N5 Exam ${attemptId === 906 ? 6 : 5}`,
    jlptLevel: 'N5', status: 'COMPLETED', mode: 'full', totalScore: 1, maxScore: 30,
    overallPassScore: 80, correctCount: 1, totalQuestions: 30, isPassed: false,
    startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), durationSeconds: 526,
    scoringSections: [{ name: 'Language Knowledge + Reading', score: 1, maxScore: 24, minimumPassScore: 38, correctCount: 1, totalQuestions: 24, isPassed: false }],
    sessions: sessions.map((session) => ({
      attemptSessionId: session.attemptSessionId, sessionId: session.sessionId, sessionName: session.sessionTitle,
      sessionType: session.sessionId === 12 ? 'listening' : 'language_knowledge', status: 'COMPLETED',
      score: session.sessionId === 11 ? 1 : 0, maxScore: session.sessionId === 11 ? 24 : 6,
      correctCount: session.sessionId === 11 ? 1 : 0, totalQuestions: session.parts.flatMap((part) => part.questions).length,
      startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), durationSeconds: 526,
      parts: session.parts.map((part) => ({ attemptPartId: part.attemptPartId, partId: part.partId, partName: part.partName,
        score: part.partId === 21 ? 1 : 0, maxScore: part.questions.length, correctCount: part.partId === 21 ? 1 : 0, totalQuestions: part.questions.length })),
    })),
  });
  const review = (attemptId) => ({
    attemptId, examId: attemptId === 906 ? 6 : 5, examTitle: `N5 Exam ${attemptId === 906 ? 6 : 5}`, jlptLevel: 'N5', status: 'COMPLETED',
    sessions: sessions.map((session) => ({
      attemptSessionId: session.attemptSessionId, sessionId: session.sessionId, sessionName: session.sessionTitle,
      sessionType: session.sessionId === 12 ? 'listening' : 'language_knowledge', sessionOrder: session.sessionOrder,
      parts: session.parts.map((part) => ({
        attemptPartId: part.attemptPartId, partId: part.partId, partName: part.partName, partOrder: part.partOrder,
        questions: part.questions.map((item) => ({ ...item, passageText: null, selectedAnswerId: selected.get(`${attemptId}:${item.questionId}`) ?? null,
          correctAnswerId: item.answers[0].answerId, isCorrect: selected.get(`${attemptId}:${item.questionId}`) === item.answers[0].answerId,
          explanation: 'The first answer is correct.' })),
      })),
    })),
  });
  async function intercept({ requestId, request }) {
    try {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/api/v1/')) {
        if (url.origin === origin) await send('Fetch.continueRequest', { requestId });
        else await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
        return;
      }
      const headers = [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Access-Control-Allow-Origin', value: origin },
        { name: 'Access-Control-Allow-Credentials', value: 'true' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, OPTIONS' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-XSRF-TOKEN' },
      ];
      if (request.method === 'OPTIONS') { await send('Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: headers }); return; }
      let responseCode = 200;
      let body = url.pathname.endsWith('/auth/refresh-token')
        ? { data: { access_token: 'test-access', tokenType: 'Bearer', expiresIn: 600, user: { id: 73, name: 'Student', email: 'student@example.test' } } }
        : { data: { token: 'test-csrf', headerName: 'X-XSRF-TOKEN' } };
      const examId = Number(url.pathname.match(/\/jlpt-exams\/(\d+)/)?.[1]);
      const attemptId = Number(url.pathname.match(/\/attempts\/(\d+)/)?.[1]);
      if (url.pathname.endsWith('/detail')) body = { data: exam(examId) };
      if (/\/jlpt-exams\/\d+$/.test(url.pathname)) body = { data: exam(examId) };
      if (request.method === 'POST' && url.pathname.endsWith('/attempts')) {
        starts.push({ examId, payload: JSON.parse(request.postData) });
        body = { data: attempt(examId, examId === 6 ? 906 : ++fullExamStarts === 1 ? 905 : 907) };
      }
      if (request.method === 'PUT' && url.pathname.endsWith('/answers')) {
        const payload = JSON.parse(request.postData);
        const attemptSessionId = Number(url.pathname.match(/\/sessions\/(\d+)/)?.[1]);
        saves.push({ attemptId, attemptSessionId, ...payload });
        if (payload.questionId === 30 && payload.answerId === 300) await delay(400);
        if (attemptId === 905 && payload.questionId === 70 && failSaveOnce) {
          failSaveOnce = false;
          responseCode = 500;
          body = { message: 'Temporary failure' };
        } else {
          selected.set(`${attemptId}:${payload.questionId}`, payload.answerId);
          body = { data: { attemptAnswerId: payload.questionId, attemptId, attemptSessionId, ...payload, answeredAt: new Date().toISOString() } };
        }
      }
      if (request.method === 'POST' && url.pathname.endsWith('/submit')) {
        submissions.push(attemptId);
        if (attemptId === 906 && failSubmitOnce) {
          failSubmitOnce = false;
          responseCode = 500;
          body = { message: 'Temporary failure' };
        } else {
          completed.add(attemptId);
          body = { data: { attemptId, status: 'COMPLETED', totalScore: 1, maxScore: 30, correctCount: 1, totalQuestions: 30, startedAt: attempt(attemptId === 906 ? 6 : 5).startedAt, finishedAt: new Date().toISOString(), durationSeconds: 30 } };
        }
      }
      if (url.pathname.endsWith('/result')) {
        if (!completed.has(attemptId)) { responseCode = 400; body = { message: 'JLPT attempt is not completed' }; }
        else body = { data: result(attemptId) };
      }
      if (url.pathname.endsWith('/review')) {
        if (!completed.has(attemptId)) { responseCode = 400; body = { message: 'JLPT attempt is not completed' }; }
        else body = { data: review(attemptId) };
      }
      if (url.pathname.endsWith('/attempts/history')) {
        const page = Number(url.searchParams.get('page') ?? 0);
        const content = page < 2 ? [page === 0 ? 905 : 904].map((id) => ({
          attemptId: id, examId: id === 906 ? 6 : 5, examTitle: `N5 Exam ${id === 906 ? 6 : 5}`,
          jlptLevel: 'N5', mode: 'full', status: 'COMPLETED', totalScore: 1, maxScore: 30,
          correctCount: 1, totalQuestions: 30, isPassed: false,
          startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), durationSeconds: 526,
        })) : [];
        body = { data: { content, empty: content.length === 0, first: page === 0, last: page >= 1, number: page,
          numberOfElements: content.length, size: 10, totalElements: 2, totalPages: 2 } };
      }
      await send('Fetch.fulfillRequest', { requestId, responseCode, responseHeaders: headers, body: Buffer.from(JSON.stringify(body)).toString('base64') });
    } catch (error) { errors.push(error.message); await send('Fetch.failRequest', { requestId, errorReason: 'Failed' }); }
  }
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

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await navigate('/jlpt-exams/5/taking?mode=full');
  await waitFor('[...document.querySelectorAll("button")].some(button => button.textContent.includes("Begin attempt"))');
  assert.equal(starts.length, 0);
  await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.includes("Begin attempt")).click()');
  await waitFor('document.querySelector("header")?.textContent.includes("Attempt #905")');
  assert.equal(starts.length, 1);
  await evaluate('document.querySelector("input[value=\'300\']").click(); document.querySelector("input[value=\'301\']").click()');
  await waitFor('document.querySelector("#question-30")?.textContent.includes("Answer saved")');
  assert.deepEqual(saves.filter((save) => save.questionId === 30).map((save) => save.answerId), [300, 301]);
  assert.equal(selected.get('905:30'), 301);
  await send('Page.reload');
  await waitFor('document.querySelector("input[value=\'301\']")?.checked');
  assert.equal(starts.length, 1);
  await evaluate('document.querySelector("input[value=\'300\']").click()');
  await waitFor('document.querySelector("#question-30")?.textContent.includes("Answer saved")');
  for (const [number, questionId] of [[16, 45], [24, 57], [30, 75]]) {
    await evaluate(`document.querySelector('#exam-navigation button[aria-label^="Question ${number},"]').click()`);
    await waitFor(`document.querySelector('#question-${questionId}') !== null`);
    await delay(800);
    const position = await evaluate(`(() => { const pane = document.querySelector('#exam-questions'); const card = document.querySelector('#question-${questionId}'); return { outer: document.scrollingElement.scrollHeight, viewport: innerHeight, top: pane.scrollTop, max: pane.scrollHeight - pane.clientHeight, visible: card.getBoundingClientRect().bottom > pane.getBoundingClientRect().top && card.getBoundingClientRect().top < pane.getBoundingClientRect().bottom }; })()`);
    assert.equal(position.outer, position.viewport);
    assert.equal(position.visible, true);
    assert.ok(position.top >= 0 && position.top <= position.max);
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  for (const [number, questionId] of [[16, 45], [24, 57], [30, 75]]) {
    await evaluate('document.querySelector("header button[aria-controls=exam-navigation]").click()');
    await waitFor('getComputedStyle(document.querySelector("#exam-navigation")).display !== "none"');
    await evaluate(`document.querySelector('#exam-navigation button[aria-label^="Question ${number},"]').click()`);
    await waitFor(`document.querySelector('#question-${questionId}') !== null`);
    await delay(800);
    const position = await evaluate(`(() => { const pane = document.querySelector('#exam-questions'); const card = document.querySelector('#question-${questionId}'); return { outer: document.scrollingElement.scrollHeight, viewport: innerHeight, top: pane.scrollTop, max: pane.scrollHeight - pane.clientHeight, visible: card.getBoundingClientRect().bottom > pane.getBoundingClientRect().top && card.getBoundingClientRect().top < pane.getBoundingClientRect().bottom }; })()`);
    assert.equal(position.outer, position.viewport);
    assert.equal(position.visible, true);
    assert.ok(position.top >= 0 && position.top <= position.max);
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await evaluate('[...document.querySelectorAll("#exam-navigation section > button")].find(button => button.textContent.includes("Listening")).click()');
  await waitFor('document.querySelector("main")?.textContent.includes("Listening 1")');
  await evaluate('document.querySelector("input[value=\'700\']").click()');
  await waitFor('document.querySelector("#question-70")?.textContent.includes("Answer was not saved")');
  await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.includes("Submit Exam")).click()');
  await waitFor('document.body.textContent.includes("28 unanswered")');
  await evaluate('document.querySelector("[role=alertdialog] button:last-child").click()');
  await waitFor('document.body.textContent.includes("1 selected answer could not be saved")');
  assert.deepEqual(submissions, []);
  await evaluate('[...document.querySelectorAll("#question-70 button")].find(button => button.textContent === "Retry").click()');
  await waitFor('document.querySelector("#question-70")?.textContent.includes("Answer saved")');
  await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.includes("Retry submission")).click()');
  await waitFor('location.pathname === "/student/jlpt_exam_review/905"');
  await waitFor('document.querySelector("#review-question-heading")?.textContent.includes("First question")');
  assert.deepEqual(submissions, [905]);
  assert.equal(await evaluate('document.querySelector("#result-title") === null'), true);
  assert.equal(await evaluate(`document.querySelector('button[aria-label="Question 1, correct"]') !== null`), true);
  await evaluate(`document.querySelector('button[aria-label="Question 2, unanswered"]').click()`);
  assert.equal(await evaluate('document.querySelector("#review-question-panel").textContent.includes("Unanswered")'), true);
  assert.equal(await evaluate('document.querySelector("header a").getAttribute("href")'), '/student/jlpt-exams/5');
  assert.equal(await evaluate('[...document.querySelectorAll("a")].some(link => link.textContent.includes("View Result") && link.getAttribute("href") === "/student/jlpt_exam_result/905")'), true);
  await send('Page.reload');
  await waitFor('document.querySelector("#review-question-heading")?.textContent.includes("First question")');
  assert.deepEqual(submissions, [905]);
  assert.equal(starts.length, 1);
  await evaluate('[...document.querySelectorAll("a")].find(link => link.textContent.includes("View Result")).click()');
  await waitFor('location.pathname === "/student/jlpt_exam_result/905"');
  await waitFor('document.querySelector("#result-title")?.textContent.includes("N5 Exam 5")');
  assert.equal(await evaluate('document.body.textContent.includes("1 / 30")'), true);
  assert.equal(await evaluate('document.body.textContent.includes("8 phút 46 giây")'), true);
  assert.equal(await evaluate('document.body.textContent.includes("Language Knowledge + Reading")'), true);
  assert.equal(await evaluate('document.body.textContent.includes("Part two")'), true);
  assert.equal(await evaluate('document.querySelectorAll("section[aria-labelledby=\'session-breakdown-title\'] article").length >= 2'), true);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await send('Page.reload');
  await waitFor('document.querySelector("#result-title")?.textContent.includes("N5 Exam 5")');
  assert.equal(starts.length, 1);
  await evaluate('[...document.querySelectorAll("a")].find(link => link.textContent.includes("Xem đáp án và giải thích")).click()');
  await waitFor('location.pathname === "/student/jlpt_exam_review/905"');
  await waitFor('document.querySelector("#review-question-heading")?.textContent.includes("First question")');
  assert.equal(await evaluate(`document.querySelector('button[aria-label="Question 1, correct"]') !== null`), true);
  await evaluate('[...document.querySelectorAll("a")].find(link => link.textContent.includes("View Result")).click()');
  await waitFor('location.pathname === "/student/jlpt_exam_result/905"');
  await evaluate('[...document.querySelectorAll("a")].find(link => link.textContent.includes("Lịch sử làm bài")).click()');
  await waitFor('location.pathname === "/student/jlpt_exam_history"');
  await waitFor('document.body.textContent.includes("Lượt #905")');
  assert.equal(await evaluate('[...document.querySelectorAll("a")].some(link => link.getAttribute("href") === "/student/jlpt_exam_result/905")'), true);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await evaluate('document.querySelector("nav[aria-label=\'Trang lịch sử\'] a[href*=\'page=2\']").click()');
  await waitFor('location.search.includes("page=2") && document.body.textContent.includes("Lượt #904")');
  assert.equal(await evaluate('document.querySelector("nav[aria-label=\'Trang lịch sử\'] a[href*=\'page=1\']") !== null'), true);
  await navigate('/student/jlpt_exam_result/905');
  await waitFor('document.querySelector("#result-title")?.textContent.includes("N5 Exam 5")');
  await evaluate('[...document.querySelectorAll("a")].find(link => link.textContent.includes("Làm lại đề")).click()');
  await waitFor('location.pathname === "/student/jlpt-exams/5"');
  assert.equal(starts.length, 1);
  await waitFor('document.body.textContent.includes("Start Full Exam")');
  await evaluate('[...document.querySelectorAll("a")].find(link => link.textContent.includes("Start Full Exam")).click()');
  await waitFor('location.pathname === "/jlpt-exams/5/taking"');
  await waitFor('[...document.querySelectorAll("button")].some(button => button.textContent.includes("Begin attempt"))');
  assert.equal(starts.length, 1);
  await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.includes("Begin attempt")).click()');
  await waitFor('document.querySelector("header")?.textContent.includes("Attempt #907")');
  assert.deepEqual(starts.map((start) => start.examId), [5, 5]);
  await navigate('/student/jlpt_exam_review/905');
  await waitFor('document.querySelector("#review-question-heading")?.textContent.includes("First question")');
  await navigate('/student/jlpt_exam_review/999');
  await waitFor('document.body.textContent.includes("Review unavailable")');
  await navigate('/jlpt-exams/6/taking?mode=full');
  await waitFor('[...document.querySelectorAll("button")].some(button => button.textContent.includes("Begin attempt"))');
  await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.includes("Begin attempt")).click()');
  await waitFor('document.body.textContent.includes("Submission was not confirmed")');
  assert.equal(await evaluate('location.pathname.endsWith("/taking")'), true);
  await evaluate('[...document.querySelectorAll("button")].find(button => button.textContent.includes("Retry submission")).click()');
  await waitFor('location.pathname === "/student/jlpt_exam_review/906"');
  await waitFor('document.querySelector("#review-question-heading")?.textContent.includes("First question")');
  assert.deepEqual(submissions, [905, 906, 906]);
  assert.deepEqual(errors, []);
  process.stdout.write('JLPT full flow browser checks passed\n');
} finally {
  socket?.close();
  browser.kill();
}
