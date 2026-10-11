import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Requires a local Next server. All backend requests are intercepted, never sent.
const origin = process.env.ADMIN_UI_TEST_ORIGIN ?? 'http://localhost:3001';
const profile = await mkdtemp(join(tmpdir(), 'studify-admin-ui-'));
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
  const requests = [];
  const course = { id: 10, title: 'Kanji N5', slug: 'kanji-n5', description: 'Khóa học Kanji', published: true,
    categoryName: 'Kanji', lessonCount: 3, price: 250000, thumnailURL: '/favicon.ico', createdAt: '2026-09-01T00:00:00Z' };
  const category = { id: 7, name: 'Kanji', slug: 'kanji', description: 'Học Kanji', mediaId: 1,
    mediaUrl: null, courseCount: 1, lessonCount: 3 };
  const page = (items, url, total = 21) => ({ content: items, number: Number(url.searchParams.get('page') || 0),
    size: 10, numberOfElements: items.length, totalElements: total, totalPages: Math.ceil(total / 10),
    pageable: { pageNumber: Number(url.searchParams.get('page') || 0), offset: Number(url.searchParams.get('page') || 0) * 10 } });
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
      else {
        requests.push({ path: url.pathname, method: request.method, params: Object.fromEntries(url.searchParams) });
        if (url.pathname.endsWith('/csrf')) body = { data: { token: 'test', headerName: 'X-XSRF-TOKEN' } };
        else if (url.pathname.endsWith('/refresh-token')) body = { data: { access_token: 'test', tokenType: 'Bearer', expiresIn: 600,
          user: { id: 1, name: 'Tester', email: 'admin@example.test' } } };
        else if (url.pathname.endsWith('/course-categories')) body = { data: page([category], url, 1) };
        else if (url.pathname.endsWith('/courses/10')) body = { data: course };
        else if (url.pathname.endsWith('/courses')) body = { data: page([course], url) };
        else if (url.pathname.endsWith('/admin/orders')) body = { data: page([{ id: 1, orderNumber: 'ORD-001',
          items: [{ id: 1, courseId: 10, courseTitle: 'Kanji N5', unitPrice: 250000, subtotal: 250000 }],
          totalAmount: 250000, status: 'CONFIRMED', paymentStatus: 'SUCCESS', paymentMethod: 'BANK_TRANSFER',
          createdAt: '2026-09-01T00:00:00Z' }], url) };
        else if (url.pathname.endsWith('/upload/images')) {
          await delay(500);
          body = { data: { id: 20, secureUrl: origin + '/favicon.ico' } };
        } else throw new Error(`Unexpected API: ${request.method} ${url.pathname}`);
      }
      await send('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: [
        { name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: origin },
        { name: 'Access-Control-Allow-Credentials', value: 'true' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-XSRF-TOKEN' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
      ], body: Buffer.from(status === 204 ? '' : JSON.stringify(body)).toString('base64') });
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
  const viewport = (width, height = 900) => send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: width < 600,
  });
  const screenshot = async (name) => {
    await delay(250);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    await writeFile(join(profile, name + '.png'), Buffer.from(shot.data, 'base64'));
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, `${name}: page overflow (${profile})`);
  };
  const clickText = (text) => evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(text)}).click()`);
  const escape = () => send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  const values = () => evaluate(`[...document.querySelectorAll('[data-slot=count-up]')].map(e => e.lastElementChild.textContent)`);
  const finalValues = () => evaluate(`[...document.querySelectorAll('[data-slot=count-up]')].map(e => e.firstElementChild.textContent)`);
  const contrast = async (selector) => {
    const result = await evaluate(`(() => {
      const e = document.querySelector(${JSON.stringify(selector)});
      const c = getComputedStyle(e);
      const rgb = s => { const ctx = document.createElement('canvas').getContext('2d'); ctx.fillStyle=s; ctx.fillRect(0,0,1,1); return [...ctx.getImageData(0,0,1,1).data].slice(0,3); };
      const lum = s => rgb(s).map(n => n/255).map(n => n <= .04045 ? n/12.92 : ((n+.055)/1.055)**2.4).reduce((a,n,i) => a+n*[.2126,.7152,.0722][i],0);
      let bg = c.backgroundColor, parent = e;
      while (bg === 'rgba(0, 0, 0, 0)' && parent.parentElement) { parent=parent.parentElement; bg=getComputedStyle(parent).backgroundColor; }
      const a=lum(c.color), b=lum(bg);
      return { color:c.color, background:bg, ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05) };
    })()`);
    assert.ok(result.ratio >= 4.5, `${selector}: ${JSON.stringify(result)}`);
    return result;
  };

  await viewport(1440);
  await navigate('/admin/courses');
  await waitFor('document.querySelectorAll("[data-slot=count-up]").length === 4');
  await waitFor('document.querySelector("table")?.textContent.includes("Kanji N5")');
  await delay(1400);
  assert.deepEqual(await values(), ['62','54','8','428']);
  assert.deepEqual(await values(), await finalValues());
  await screenshot('courses-desktop');
  // Observe values through a real pagination rerender, instead of only inspecting final values.
  await evaluate(`window.statChanges=[]; new MutationObserver(() => window.statChanges.push([...document.querySelectorAll('[data-slot=count-up]')].map(e=>e.lastElementChild.textContent))).observe(document.querySelector('[data-slot=count-up]').closest('section'),{subtree:true,childList:true,characterData:true}); document.querySelector('[aria-label="Page 2"]').click()`);
  await waitFor('new URLSearchParams(location.search).get("page") === "2"');
  await delay(500);
  assert.deepEqual(await values(), ['62','54','8','428']);
  assert.deepEqual(await evaluate('window.statChanges'), [], 'pagination must not restart animation');
  assert.ok(requests.some(r => r.path.endsWith('/courses') && r.params.page === '1'));
  await waitFor(`document.querySelector('[aria-label="Xóa Kanji N5"]')`);
  await evaluate(`document.querySelector('[aria-label="Xóa Kanji N5"]').click()`);
  await waitFor('document.querySelector("[role=alertdialog]")');
  await contrast('[data-slot=alert-dialog-content]');
  await contrast('[data-slot=alert-dialog-action]');
  await screenshot('course-delete-desktop');
  await escape();
  await viewport(390,844);
  await screenshot('courses-mobile');

  await navigate('/admin/categories-course');
  await waitFor('document.querySelectorAll("[data-slot=count-up]").length === 4');
  await delay(1400);
  assert.deepEqual(await finalValues(), ['8','62','428','87,1%']);
  await clickText('Tạo danh mục');
  await waitFor('document.getElementById("category-name")');
  await contrast('[data-slot=dialog-content]');
  await contrast('form button[type=submit]');
  assert.equal(await evaluate(`(() => {const r=document.querySelector('[role=dialog]').getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight && r.left>=0 && r.right<=innerWidth})()`), true);
  await screenshot('category-dialog-mobile');
  await send('Input.dispatchKeyEvent', { type:'keyDown', key:'Tab', code:'Tab', windowsVirtualKeyCode:9 });
  assert.equal(await evaluate('document.activeElement.closest("[role=dialog]") !== null'),true,'focus remains in dialog');
  await escape();
  await waitFor('!document.getElementById("category-name")');

  for (const path of ['/admin/courses/create','/admin/courses/10/edit']) {
    await navigate(path);
    await waitFor('document.getElementById("course-title")');
    await contrast('#course-form button');
    await contrast('#course-form button[type=submit]');
    await send('Emulation.setEmulatedMedia', { features: [{ name:'prefers-color-scheme', value:'dark' }] });
    await contrast('#course-form button');
    await screenshot(path.endsWith('create') ? 'course-create-mobile-dark-os' : 'course-edit-mobile-dark-os');
    await viewport(1440);
    await screenshot(path.endsWith('create') ? 'course-create-desktop' : 'course-edit-desktop');
    await viewport(390,844);
  }
  // The actual picker still validates and uploads through the configured API.
  await evaluate(`(() => {const f=new File(['bad'],'bad.txt',{type:'text/plain'});const d=new DataTransfer();d.items.add(f);const input=document.querySelector('#course-form input[type=file]');input.files=d.files;input.dispatchEvent(new Event('change',{bubbles:true}))})()`);
  await waitFor('document.querySelector("#course-form [role=alert]")');
  assert.equal(requests.filter(r=>r.path.endsWith('/upload/images')).length,0);
  await evaluate(`(() => {const f=new File([new Uint8Array([137,80,78,71])],'cover.png',{type:'image/png'});const d=new DataTransfer();d.items.add(f);const input=document.querySelector('#course-form input[type=file]');input.files=d.files;input.dispatchEvent(new Event('change',{bubbles:true}))})()`);
  await waitFor('document.querySelector("#course-form button")?.disabled');
  await contrast('#course-form button');
  await waitFor('document.querySelector("#course-form [role=status]")?.textContent.includes("Ảnh đã tải lên")');
  assert.equal(requests.filter(r=>r.path.endsWith('/upload/images')).length,1);
  await clickText('Bỏ ảnh');

  await viewport(1440);
  await send('Emulation.setEmulatedMedia', { features: [{ name:'prefers-reduced-motion', value:'reduce' },{ name:'prefers-color-scheme', value:'dark' }] });
  await navigate('/admin/orders');
  await waitFor('document.querySelector("table")?.textContent.includes("ORD-001")');
  assert.deepEqual(await finalValues(), ['1.250','38','1.184','28']);
  assert.equal(await evaluate('getComputedStyle(document.querySelector("[data-slot=count-up]").lastElementChild).display'), 'none');
  assert.equal(requests.filter(r=>r.path.endsWith('/admin/orders')).length,1,'only the table request is sent');
  await screenshot('orders-desktop');
  await viewport(390,844);
  await screenshot('orders-mobile');
  await evaluate(`document.querySelector('[aria-label="Page 2"]').click()`);
  await waitFor('new URLSearchParams(location.search).get("page") === "2"');
  await waitFor('document.body.innerText.includes("11–11 / 21")');
  assert.deepEqual(await finalValues(), ['1.250','38','1.184','28']);
  assert.deepEqual(errors, []);
  process.stdout.write(`PASS: admin mock stats, pagination isolation, Count Up stability/reduced motion, light/dark-OS contrast, dialogs, keyboard, image validation/upload/remove, mobile/desktop. Screenshots: ${profile}\n`);
} finally {
  socket?.close();
  browser.kill();
}
