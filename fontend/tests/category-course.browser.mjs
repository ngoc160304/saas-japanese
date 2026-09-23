import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Requires a local Next server. All backend requests are intercepted, never sent.
const origin = process.env.CATEGORY_TEST_ORIGIN ?? 'http://localhost:3001';
const profile = await mkdtemp(join(tmpdir(), 'studify-category-browser-'));
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
    if (result.exceptionDetails)
      throw new Error(
        result.exceptionDetails.exception?.description ?? result.exceptionDetails.text,
      );
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let i = 0; i < 200; i++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    throw new Error(`Timed out: ${expression}`);
  };
  const errors = [];
  const category = {
    id: 7,
    name: 'Kanji',
    slug: 'kanji',
    description: 'Học Kanji tiếng Nhật',
    mediaId: null,
    mediaUrl: null,
    courseCount: 1,
    lessonCount: 3,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };
  let creates = 0;
  let updates = 0;
  let deletes = 0;
  let failCreate = true;
  let failDelete = true;
  let removed = false;
  const courseRequests = [];
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
      let body = { data: {} };
      if (request.method === 'OPTIONS') status = 204;
      else if (url.pathname.endsWith('/csrf'))
        body = { data: { token: 'test', headerName: 'X-XSRF-TOKEN' } };
      else if (url.pathname.endsWith('/refresh-token'))
        body = {
          data: {
            access_token: 'test',
            tokenType: 'Bearer',
            expiresIn: 600,
            user: { id: 1, name: 'Admin', email: 'admin@example.test' },
          },
        };
      else if (url.pathname.includes('/course-categories')) {
        if (request.method === 'POST') {
          creates++;
          await delay(350);
          if (failCreate) {
            status = 400;
            body = { message: 'Tên danh mục đã tồn tại' };
          } else body = { data: { ...category, id: 8 } };
        } else if (request.method === 'PUT') {
          updates++;
          await delay(250);
          body = { data: category };
        } else if (request.method === 'DELETE') {
          deletes++;
          await delay(350);
          if (failDelete) {
            status = 400;
            body = { message: 'Không thể xóa danh mục đang có khóa học' };
          } else {
            removed = true;
            body = { data: 'Deleted' };
          }
        } else if (url.pathname.endsWith('/7')) body = { data: category };
        else
          body = {
            data: {
              content: removed ? [] : [category],
              pageable: { pageNumber: Number(url.searchParams.get('page') || 0) },
              totalPages: removed ? 1 : 2,
              totalElements: removed ? 1 : 2,
            },
          };
      } else if (url.pathname.endsWith('/courses')) {
        courseRequests.push(Object.fromEntries(url.searchParams));
        body = {
          data: {
            content: [
              {
                id: 10,
                title: 'Kanji N5',
                slug: 'kanji-n5',
                description: 'Khóa học Kanji',
                published: true,
                categoryName: 'Kanji',
                lessonCount: 3,
                price: 0,
                thumnailURL: null,
                createdAt: '2026-09-01T00:00:00Z',
              },
            ],
            pageable: { pageNumber: 0 },
            totalPages: 1,
            totalElements: 1,
          },
        };
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
          { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
        ],
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
  const fill = async (id, value) => {
    await evaluate(`document.getElementById(${JSON.stringify(id)}).focus()`);
    await send('Input.insertText', { text: value });
  };
  const submit = () => evaluate('document.querySelector("form").requestSubmit()');
  const screenshot = async (name, width, height) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });
    await delay(200);
    assert.equal(
      await evaluate('document.documentElement.scrollWidth <= innerWidth'),
      true,
      `${name}: horizontal overflow`,
    );
    const result = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
    });
    await writeFile(join(profile, name + '.png'), Buffer.from(result.data, 'base64'));
  };

  const clickText = (text) =>
    evaluate(
      `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(text)}).click()`,
    );
  const clickLabel = (label) =>
    evaluate(`document.querySelector('[aria-label="${label}"]').click()`);
  const escape = () =>
    send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
    });
  await navigate('/admin/categories-course?page=2&size=1&search=Kanji');
  await waitFor('document.querySelector("[aria-label=\\"Sửa Kanji\\"]")');
  await clickText('Tạo danh mục');
  await waitFor('document.getElementById("category-name")');
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 2, y: 2, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 2, y: 2, button: 'left', clickCount: 1 });
  await waitFor('!document.getElementById("category-name")');
  await clickText('Tạo danh mục');
  await waitFor('document.getElementById("category-name")');
  await fill('category-name', 'Temporary');
  await escape();
  await waitFor('!document.getElementById("category-name")');
  await clickText('Tạo danh mục');
  await waitFor('document.getElementById("category-name")');
  assert.equal(await evaluate('document.getElementById("category-name").value'), '');
  await clickText('Hủy');
  await clickText('Tạo danh mục');
  await waitFor('document.getElementById("category-name")');
  await clickLabel('Đóng');
  await waitFor('!document.getElementById("category-name")');
  await clickText('Tạo danh mục');
  await waitFor('document.getElementById("category-name")');
  await fill('category-name', 'New category');
  await submit();
  await submit();
  await waitFor('document.querySelector("form [role=alert]")');
  assert.equal(creates, 1);
  assert.equal(await evaluate('document.getElementById("category-name").value'), 'New category');
  assert.equal(
    await evaluate('document.querySelectorAll("[data-sonner-toast][data-type=error]").length'),
    1,
  );
  assert.equal(
    await evaluate('document.querySelector("[data-sonner-toaster]").dataset.yPosition'),
    'top',
  );
  assert.equal(
    await evaluate('document.querySelector("[data-sonner-toaster]").dataset.xPosition'),
    'right',
  );
  failCreate = false;
  await submit();
  await waitFor('!document.getElementById("category-name")');
  await clickLabel('Sửa Kanji');
  await waitFor('document.getElementById("category-name")');
  assert.equal(await evaluate('document.getElementById("category-name").value'), 'Kanji');
  await submit();
  await waitFor('!document.getElementById("category-name")');
  assert.equal(updates, 1);
  await clickLabel('Xóa Kanji');
  await waitFor('document.body.innerText.includes("Xóa danh mục?")');
  await escape();
  await waitFor('!document.body.innerText.includes("Xóa danh mục?")');
  await clickLabel('Xóa Kanji');
  await evaluate(
    `[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Xóa').click()`,
  );
  await escape();
  await waitFor('document.querySelector("[role=alert]")?.textContent.includes("đang có khóa học")');
  assert.equal(deletes, 1);
  assert.equal(await evaluate('document.body.innerText.includes("Xóa danh mục?")'), true);
  await clickText('Hủy');
  await evaluate('document.querySelector("a[href=\\"/admin/categories-course/7\\"]").click()');
  await waitFor(
    'document.body.innerText.includes("Khóa học trong danh mục") && document.body.innerText.includes("Kanji N5")',
  );
  assert.equal(courseRequests.at(-1).categoryId, '7');
  await screenshot('category-detail-desktop', 1440, 1000);
  await screenshot('category-detail-mobile', 390, 844);
  await navigate('/admin/categories-course/7?pricing=paid&status=draft&search=kanji&size=5');
  await waitFor('document.body.innerText.includes("Kanji N5")');
  assert.equal(courseRequests.at(-1).pricing, 'paid');
  assert.equal(courseRequests.at(-1).published, 'false');
  await navigate('/admin/categories-course?page=2&size=1&search=Kanji');
  await waitFor('document.querySelector("[aria-label=\\"Xóa Kanji\\"]")');
  failDelete = false;
  await clickLabel('Xóa Kanji');
  await clickText('Xóa');
  await waitFor('new URLSearchParams(location.search).get("page") === "1"');
  assert.equal(await evaluate('new URLSearchParams(location.search).get("search")'), 'Kanji');
  assert.equal(await evaluate('new URLSearchParams(location.search).get("size")'), '1');
  assert.deepEqual(errors, []);
  process.stdout.write(`Course category browser checks passed. Screenshots: ${profile}\n`);
} finally {
  socket?.close();
  browser.kill();
}
