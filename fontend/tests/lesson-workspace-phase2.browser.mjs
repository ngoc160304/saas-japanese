import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Requires a local Next server. All API requests are mocked in Chrome; no backend is contacted.
const origin = process.env.LESSON_TEST_ORIGIN ?? 'http://localhost:3001';
const profile = await mkdtemp(join(tmpdir(), 'studify-lesson-browser-'));
const browser = spawn(process.env.LESSON_TEST_BROWSER ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
let socket;
try {
  let port;
  for (let i = 0; i < 100; i++) {
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
    for (let i = 0; i < 300; i++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    const page = await evaluate('({ url: location.href, body: document.body.innerText.slice(0, 1000), editors: window.tinymce?.get()?.map(item => ({ id: item.id, initialized: item.initialized, content: item.getContent() })) })');
    throw new Error(`Timed out: ${expression}; page=${JSON.stringify(page)}; errors=${JSON.stringify(errors)}`);
  };
  const now = '2026-10-11T00:00:00Z';
  const lessons = [
    { id: 1, courseId: 1, title: 'Lesson One', slug: 'lesson-one', grammar: 'Initial grammar', durationMinutes: 20, isPublished: false, isDeleted: false, videoMediaId: null, videoUrl: null, createdAt: now, updatedAt: now },
    { id: 2, courseId: 1, title: 'Lesson Two', slug: 'lesson-two', grammar: null, durationMinutes: null, isPublished: true, isDeleted: false, videoMediaId: null, videoUrl: null, createdAt: now, updatedAt: now },
  ];
  const course = { id: 1, title: 'Mock Course', slug: 'mock-course', description: null, published: false, categoryName: null, lessonCount: 2, price: 0, thumnailURL: null, createdAt: now };
  let grammarWrites = 0;
  let publicationWrites = 0;
  let delayNextGrammar = false;
  let failNextGrammar = false;
  let videoUploads = 0;
  let videoAttachments = 0;
  let videoDetaches = 0;
  let failNextVideoUpload = false;
  let failNextVideoAttach = false;
  let failNextVideoDetach = false;
  const errors = [];
  const navigationDialogs = [];
  listeners.set('Runtime.exceptionThrown', ({ exceptionDetails }) => errors.push(exceptionDetails.text));
  listeners.set('Page.javascriptDialogOpening', async (event) => {
    navigationDialogs.push(event.message);
    await send('Page.handleJavaScriptDialog', { accept: true });
  });
  listeners.set('Fetch.requestPaused', async ({ requestId, request }) => {
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
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-XSRF-TOKEN' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PATCH, DELETE, OPTIONS' },
      ];
      let status = 200;
      let body;
      if (request.method === 'OPTIONS') status = 204;
      else if (url.pathname.endsWith('/auth/csrf')) {
        body = { data: { token: 'mock-csrf', headerName: 'X-XSRF-TOKEN' } };
      } else if (url.pathname.endsWith('/auth/refresh-token')) {
        body = { data: { access_token: 'mock-admin-token', tokenType: 'Bearer', expiresIn: 600, user: { id: 1, email: 'admin@example.test', name: 'Admin' } } };
      } else if (url.pathname === '/api/v1/courses/1') body = { data: course };
      else if (url.pathname === '/api/v1/upload/videos' && request.method === 'POST') {
        videoUploads++;
        if (failNextVideoUpload) { failNextVideoUpload = false; status = 500; }
        else body = { data: { id: 100 + videoUploads, originalName: 'lesson.mp4', publicId: `mock-${videoUploads}`, secureUrl: `https://video.example.test/${videoUploads}.mp4` } };
      } else if (url.pathname === '/api/v1/lessons' && request.method === 'GET') {
        body = { data: { content: lessons, totalPages: 1, totalElements: lessons.length } };
      } else if (['/api/v1/vocabularies', '/api/v1/kanjis'].includes(url.pathname) && request.method === 'GET') {
        body = { data: { content: [], totalPages: 1, totalElements: 0 } };
      } else if (/^\/api\/v1\/admin\/lessons\/\d+\/quiz$/.test(url.pathname) && request.method === 'GET') {
        status = 204;
      } else {
        const match = url.pathname.match(/^\/api\/v1\/lessons\/(\d+)(?:\/(grammar|publication|video))?$/);
        const lesson = match && lessons.find((item) => item.id === Number(match[1]));
        if (!lesson) status = 404;
        else if (request.method === 'GET') body = { data: lesson };
        else if (request.method === 'PATCH' && match[2] === 'grammar') {
          grammarWrites++;
          const payload = JSON.parse(request.postData);
          assert.deepEqual(Object.keys(payload), ['grammar']);
          if (delayNextGrammar) { delayNextGrammar = false; await delay(500); }
          if (failNextGrammar) { failNextGrammar = false; status = 500; }
          else { lesson.grammar = payload.grammar || null; body = { data: { ...lesson } }; }
        } else if (request.method === 'PATCH' && match[2] === 'publication') {
          publicationWrites++;
          const payload = JSON.parse(request.postData);
          assert.deepEqual(Object.keys(payload), ['isPublished']);
          lesson.isPublished = payload.isPublished;
          body = { data: { ...lesson } };
        } else if (request.method === 'PATCH' && match[2] === 'video') {
          videoAttachments++;
          const payload = JSON.parse(request.postData);
          assert.deepEqual(Object.keys(payload), ['videoMediaId']);
          if (failNextVideoAttach) { failNextVideoAttach = false; status = 500; }
          else {
            lesson.videoMediaId = payload.videoMediaId;
            lesson.videoUrl = `https://video.example.test/${payload.videoMediaId - 100}.mp4`;
            body = { data: { ...lesson } };
          }
        } else if (request.method === 'DELETE' && match[2] === 'video') {
          videoDetaches++;
          if (failNextVideoDetach) { failNextVideoDetach = false; status = 500; }
          else {
            lesson.videoMediaId = null;
            lesson.videoUrl = null;
            body = { data: { ...lesson } };
          }
        } else status = 404;
      }
      if (status >= 400) body = { status, message: status === 500 ? 'Lưu thất bại' : 'Không tìm thấy', fieldErrors: {} };
      await send('Fetch.fulfillRequest', {
        requestId, responseCode: status, responseHeaders: headers,
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
  const clickText = (text, within = 'document') => evaluate(`(() => {
    const root = ${within};
    const button = [...root.querySelectorAll('button')].find(item => item.textContent.trim() === ${JSON.stringify(text)});
    if (!button) throw new Error('Missing button: ' + ${JSON.stringify(text)});
    button.click();
  })()`);
  const edit = (id, html) => evaluate(`(() => {
    const editor = window.tinymce?.get(${JSON.stringify(id)});
    if (!editor) throw new Error('Editor unavailable');
    editor.setContent(${JSON.stringify(html)});
    editor.setDirty(true);
    editor.fire('input');
    editor.fire('change');
  })()`);

  const screenshot = async (name) => {
    const directory = join(process.cwd(), 'test-artifacts');
    await mkdir(directory, { recursive: true });
    const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(join(directory, name), Buffer.from(image.data, 'base64'));
  };

  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate('/admin/courses/1/lessons/1?tab=grammar');
  await waitFor('document.querySelector("#lesson-content-tab-grammar") && window.tinymce?.get("lesson-1-grammar")?.initialized');
  await screenshot('lesson-grammar-desktop-before-interaction.png');
  await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 900, deviceScaleFactor: 1, mobile: false });
  await screenshot('lesson-grammar-tablet.png');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await screenshot('lesson-grammar-mobile.png');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Lesson One');
  assert.equal(await evaluate('document.body.innerText.includes("Chưa có video")'), true);
  assert.equal(await evaluate('document.body.innerText.includes("Ngữ pháp: Đã lưu")'), true);
  await clickText('Add Grammar Point');
  await waitFor('window.tinymce.get("lesson-1-grammar").getBody().innerText.includes("Nhập mẫu ngữ pháp")');
  assert.equal(await evaluate('window.tinymce.get("lesson-1-grammar").getBody().innerText.includes("Initial grammar")'), true);
  assert.equal(await evaluate('Boolean(document.querySelector("[role=dialog], [role=alertdialog]"))'), false);
  assert.equal(grammarWrites, 0);
  assert.equal(await evaluate('window.tinymce.get("lesson-1-grammar").hasFocus()'), true);
  await clickText('Hủy thay đổi');
  await waitFor('!window.tinymce.get("lesson-1-grammar").getBody().innerText.includes("Nhập mẫu ngữ pháp")');
  assert.equal(grammarWrites, 0);
  const handle = await evaluate(`(() => {
    const element = document.querySelector('.tox-statusbar__resize-handle');
    if (!element) return null;
    element.scrollIntoView({ block: 'center' });
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  assert.ok(handle, 'TinyMCE resize handle is visible');
  const initialHeight = await evaluate('document.querySelector(".tox-tinymce").getBoundingClientRect().height');
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: handle.x, y: handle.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: handle.x, y: handle.y + 10, button: 'left', buttons: 1 });
  await delay(100);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: handle.x, y: handle.y + 220, button: 'left', buttons: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: handle.x, y: handle.y + 220, button: 'left', clickCount: 1 });
  const grownHeight = await evaluate('document.querySelector(".tox-tinymce").getBoundingClientRect().height');
  assert.ok(grownHeight > initialHeight + 100, `Resize height: ${initialHeight} -> ${grownHeight}; handle ${JSON.stringify(handle)}`);
  await evaluate('document.querySelector(".tox-statusbar__resize-handle").scrollIntoView({ block: "center" })');
  await screenshot('lesson-grammar-after-resize.png');
  await edit('lesson-1-grammar', '<h2>Draft heading</h2><p>Draft body</p>');
  const dragResize = async (delta) => {
    const point = await evaluate(`(() => { const element=document.querySelector('.tox-statusbar__resize-handle'); element.scrollIntoView({block:'center'}); const rect=element.getBoundingClientRect(); return {x:rect.left+rect.width/2,y:rect.top+rect.height/2}; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y + Math.sign(delta) * 10, button: 'left', buttons: 1 });
    await delay(100);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y + delta, button: 'left', buttons: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y + delta, button: 'left', clickCount: 1 });
  };
  await dragResize(-100);
  assert.ok(await evaluate('document.querySelector(".tox-tinymce").getBoundingClientRect().height') < grownHeight);
  await dragResize(380);
  assert.ok(await evaluate('document.querySelector(".tox-tinymce").getBoundingClientRect().height') > initialHeight + 300);
  assert.equal(await evaluate('window.tinymce.get("lesson-1-grammar").getContent().includes("<h2>Draft heading</h2>")'), true);
  await waitFor('document.body.innerText.includes("Chưa lưu thay đổi")');
  await evaluate('document.querySelector("#lesson-content-tab-vocabulary").click()');
  await waitFor('location.search.includes("tab=vocabulary")');
  await evaluate('document.querySelector("#lesson-content-tab-grammar").click()');
  await waitFor('window.tinymce?.get("lesson-1-grammar")?.initialized && window.tinymce.get("lesson-1-grammar").getContent().includes("Draft heading")');
  await evaluate(`document.querySelector('header a[href="/admin/courses/1"]').click()`);
  await waitFor('document.querySelector("[role=alertdialog]")?.textContent.includes("Bỏ thay đổi và rời đi")');
  await clickText('Ở lại', 'document.querySelector("[role=alertdialog]")');
  assert.equal(await evaluate('location.pathname'), '/admin/courses/1/lessons/1');

  delayNextGrammar = true;
  await clickText('Lưu ngữ pháp');
  for (let i = 0; i < 30 && grammarWrites < 1; i++) await delay(20);
  assert.equal(grammarWrites, 1);
  await edit('lesson-1-grammar', '<h2>Newer heading</h2><p>Newer body</p>');
  await waitFor('document.body.innerText.includes("Chưa lưu thay đổi") && !document.body.innerText.includes("Đang lưu…")');
  assert.equal(await evaluate('window.tinymce.get("lesson-1-grammar").getContent().includes("Newer heading")'), true);
  await clickText('Lưu ngữ pháp');
  await waitFor('document.body.innerText.includes("Đã lưu")');
  assert.equal(grammarWrites, 2);
  assert.equal(lessons[0].grammar.includes('Newer heading'), true);

  await clickText('Xuất bản');
  await waitFor('document.querySelector("[role=alertdialog]")?.textContent.includes("Xuất bản bài học?")');
  await clickText('Xuất bản', 'document.querySelector("[role=alertdialog]")');
  await waitFor('document.body.innerText.includes("Ẩn bài học")');
  assert.equal(publicationWrites, 1);
  await edit('lesson-1-grammar', '<p>Unpublished draft</p>');
  await waitFor('document.body.innerText.includes("Chưa lưu thay đổi")');
  await clickText('Ẩn bài học');
  await clickText('Ẩn bài học', 'document.querySelector("[role=alertdialog]")');
  await waitFor('document.body.innerText.includes("Xuất bản")');
  assert.equal(publicationWrites, 2);
  assert.equal(await evaluate('window.tinymce.get("lesson-1-grammar").getContent().includes("Unpublished draft")'), true);
  await clickText('Xuất bản');
  await waitFor('document.querySelector("[role=alertdialog]")?.textContent.includes("Lưu ngữ pháp trước khi xuất bản")');
  assert.equal(publicationWrites, 2);
  await clickText('Ở lại', 'document.querySelector("[role=alertdialog]")');

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate(`document.querySelector('button[aria-label="Open curriculum"]').click()`);
  await waitFor(`document.querySelector('[role=dialog] a[href^="/admin/courses/1/lessons/2"]')`);
  await evaluate(`document.querySelector('[role=dialog] a[href^="/admin/courses/1/lessons/2"]').click()`);
  await waitFor('document.querySelector("[role=alertdialog]")?.textContent.includes("Bỏ thay đổi và rời đi")');
  await clickText('Bỏ thay đổi và rời đi', 'document.querySelector("[role=alertdialog]")');
  await waitFor('location.pathname.endsWith("/lessons/2") && document.querySelector("h1")?.textContent === "Lesson Two"');
  assert.equal(await evaluate('document.body.innerText.includes("Unpublished draft")'), false);
  await waitFor('window.tinymce?.get("lesson-2-grammar")?.initialized');
  assert.equal(await evaluate('document.body.innerText.includes("Chưa có nội dung ngữ pháp")'), true);
  await edit('lesson-2-grammar', '<h2>New block</h2><p>Examples</p>');
  await waitFor('document.body.innerText.includes("Chưa lưu thay đổi")');
  failNextGrammar = true;
  await clickText('Lưu ngữ pháp');
  await waitFor('document.body.innerText.includes("Dịch vụ tạm thời gián đoạn")');
  assert.equal(await evaluate('window.tinymce.get("lesson-2-grammar").getContent().includes("New block")'), true);
  await clickText('Lưu ngữ pháp');
  await waitFor('document.body.innerText.includes("Đã lưu")');
  assert.equal(lessons[1].grammar.includes('New block'), true);
  await edit('lesson-2-grammar', '');
  await waitFor('document.body.innerText.includes("Chưa lưu thay đổi")');
  await clickText('Lưu ngữ pháp');
  await waitFor('document.body.innerText.includes("Đã lưu")');
  assert.equal(lessons[1].grammar, null);
  await clickText('Add Grammar Point');
  await waitFor('window.tinymce.get("lesson-2-grammar").getBody().innerText.includes("Nhập mẫu ngữ pháp")');
  assert.equal(await evaluate('Boolean(document.querySelector("[role=dialog], [role=alertdialog]"))'), false);
  await edit('lesson-2-grammar', '<h2>〜わけがない</h2><p><strong>例：</strong>行けるわけがない。</p>');
  await waitFor('window.tinymce.get("lesson-2-grammar").getContent().includes("行けるわけがない")');
  await clickText('Lưu ngữ pháp');
  await waitFor('document.body.innerText.includes("Đã lưu")');
  await delay(200);
  await send('Page.reload');
  await waitFor('window.tinymce?.get("lesson-2-grammar")?.initialized && window.tinymce.get("lesson-2-grammar").getContent().includes("行けるわけがない")');
  assert.equal(await evaluate('window.tinymce.get("lesson-2-grammar").getContent().includes("<strong>例：</strong>")'), true);
  await screenshot('lesson-grammar-after-save.png');
  await clickText('Xem trước bài học');
  await waitFor('document.querySelector("[data-testid=lesson-preview]")?.textContent.includes("行けるわけがない")');
  assert.equal(await evaluate('Boolean(document.querySelector("[data-testid=lesson-preview] strong"))'), true);
  await screenshot('lesson-grammar-preview.png');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
  await waitFor('!document.querySelector("[data-testid=lesson-preview]")');
  await evaluate('document.querySelector("#lesson-content-tab-vocabulary").click()');
  await waitFor('location.search.includes("tab=vocabulary")');
  await send('Page.reload');
  await waitFor('document.querySelector("#lesson-content-tab-vocabulary")?.getAttribute("aria-selected") === "true"');
  await evaluate('document.querySelector("#lesson-content-tab-grammar").click()');
  await waitFor('location.search.includes("tab=grammar")');
  await evaluate('history.back()');
  await waitFor('document.querySelector("#lesson-content-tab-vocabulary")?.getAttribute("aria-selected") === "true"');
  await evaluate('history.forward()');
  await waitFor('document.querySelector("#lesson-content-tab-grammar")?.getAttribute("aria-selected") === "true"');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  assert.deepEqual(navigationDialogs, []);
  await waitFor('window.tinymce?.get("lesson-2-grammar")?.initialized');
  await edit('lesson-2-grammar', '<p>Unsaved reload</p>');
  await evaluate('window.tinymce.get("lesson-2-grammar").focus()');
  await send('Input.insertText', { text: '!' });
  await waitFor('document.body.innerText.includes("Chưa lưu thay đổi")');
  await send('Page.reload');
  await delay(500);
  for (let i = 0; i < 50 && navigationDialogs.length === 0; i++) await delay(100);
  assert.equal(navigationDialogs.length, 1);
  await waitFor('window.tinymce?.get("lesson-2-grammar")?.initialized');
  assert.equal(await evaluate('window.tinymce.get("lesson-2-grammar").getContent().includes("Unsaved reload")'), false);
  const chooseVideo = () => evaluate(`(() => {
    const file = new File([new Uint8Array([0,0,0,12,102,116,121,112,105,115,111,109])], 'lesson.mp4', { type: 'video/mp4' });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    const input = document.querySelector('#lesson-video-file');
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await evaluate(`(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['invalid'], 'notes.txt', { type: 'text/plain' }));
    const input = document.querySelector('#lesson-video-file');
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await waitFor('document.body.innerText.includes("Chỉ hỗ trợ video MP4")');
  assert.equal(videoUploads, 0);
  await edit('lesson-2-grammar', '<p>Video must not erase this draft</p>');
  await waitFor('document.body.innerText.includes("Chưa lưu thay đổi")');
  await chooseVideo();
  await waitFor('document.body.innerText.includes("lesson.mp4")');
  failNextVideoUpload = true;
  await clickText('Tải lên và gắn video');
  await waitFor('document.body.innerText.includes("Dịch vụ tạm thời gián đoạn")');
  assert.equal(lessons[1].videoMediaId, null);
  failNextVideoAttach = true;
  await clickText('Tải lên và gắn video');
  await waitFor('[...document.querySelectorAll("button")].some(item => item.textContent.trim() === "Gắn video vào bài học" && !item.disabled)');
  assert.equal(videoUploads, 2);
  assert.equal(lessons[1].videoMediaId, null);
  await clickText('Gắn video vào bài học');
  await waitFor('document.querySelector("video source")?.getAttribute("src")?.includes("/2.mp4")');
  await waitFor('document.body.innerText.includes("Không thể phát video hiện tại")');
  await clickText('Tải lại video');
  await waitFor('document.querySelector("video[controls]")');
  assert.equal(videoUploads, 2);
  assert.equal(videoAttachments, 2);
  assert.equal(lessons[1].videoMediaId, 102);
  assert.equal(await evaluate('window.tinymce.get("lesson-2-grammar").getContent().includes("Video must not erase this draft")'), true);
  await chooseVideo();
  failNextVideoAttach = true;
  await clickText('Tải lên và gắn video');
  await waitFor('[...document.querySelectorAll("button")].some(item => item.textContent.trim() === "Gắn video vào bài học" && !item.disabled)');
  assert.equal(lessons[1].videoMediaId, 102);
  assert.equal(await evaluate('document.querySelector("video source")?.getAttribute("src")?.includes("/2.mp4")'), true);
  await clickText('Gắn video vào bài học');
  await waitFor('document.querySelector("video source")?.getAttribute("src")?.includes("/3.mp4")');
  assert.equal(lessons[1].videoMediaId, 103);
  assert.equal(videoUploads, 3);
  failNextVideoDetach = true;
  await clickText('Gỡ video');
  await waitFor('document.querySelector("[role=alertdialog]")?.textContent.includes("Tệp trên dịch vụ lưu trữ sẽ không bị xóa")');
  await clickText('Gỡ video', 'document.querySelector("[role=alertdialog]")');
  await waitFor('document.body.innerText.includes("Dịch vụ tạm thời gián đoạn")');
  assert.equal(lessons[1].videoMediaId, 103);
  await clickText('Gỡ video');
  await clickText('Gỡ video', 'document.querySelector("[role=alertdialog]")');
  await waitFor('document.body.innerText.includes("Chưa có video")');
  assert.equal(lessons[1].videoMediaId, null);
  assert.equal(videoDetaches, 2);
  assert.equal(await evaluate('window.tinymce.get("lesson-2-grammar").getContent().includes("Video must not erase this draft")'), true);
  await evaluate('document.querySelector("#lesson-content-tab-kanji").click()');
  await waitFor('document.querySelector("#lesson-content-tab-kanji")?.getAttribute("aria-selected") === "true"');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await evaluate('document.querySelector("#lesson-content-tab-quiz").click()');
  await waitFor('document.querySelector("#lesson-content-tab-quiz")?.getAttribute("aria-selected") === "true"');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await evaluate('document.querySelector("#lesson-content-tab-grammar").focus()');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await waitFor('document.querySelector("#lesson-content-tab-vocabulary")?.getAttribute("aria-selected") === "true"');
  await evaluate('document.querySelector("#lesson-content-tab-grammar").click()');
  await waitFor('document.querySelector("#lesson-content-tab-grammar")?.getAttribute("aria-selected") === "true"');
  await waitFor('window.tinymce?.get("lesson-2-grammar")?.initialized');
  assert.equal(await evaluate('window.tinymce.get("lesson-2-grammar").getContent().includes("Video must not erase this draft")'), true);
  assert.deepEqual(errors, []);
  process.stdout.write('Mocked browser lesson workspace passed: phase-2 draft/navigation flows and phase-3 upload/attachment retry, replacement/detachment failure recovery, playback error/reload, draft preservation.\n');
} finally {
  socket?.close();
  browser.kill();
}
