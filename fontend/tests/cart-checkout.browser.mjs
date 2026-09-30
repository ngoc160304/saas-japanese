import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const origin = process.env.CART_TEST_ORIGIN ?? 'http://localhost:3002';
const profile = await mkdtemp(join(tmpdir(), 'studyjlpt-cart-browser-'));
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
  for (let index = 0; index < 100; index++) {
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
    for (let index = 0; index < 200; index++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    throw new Error(`Timed out: ${expression}`);
  };
  const waitForLocal = async (predicate, label) => {
    for (let index = 0; index < 100; index++) {
      if (predicate()) return;
      await delay(100);
    }
    throw new Error(`Timed out: ${label}`);
  };

  const errors = [];
  const item32 = {
    id: 32,
    courseId: 12,
    courseTitle: 'Tiếng Nhật giao tiếp cho người mới',
    price: 5615,
    thumbnailUrl: null,
  };
  const item33 = {
    id: 33,
    courseId: 10,
    courseTitle: 'Tiếng Nhật giao tiếp cho người mới',
    price: 50,
    thumbnailUrl: null,
  };
  let cartItems = [item32, item33];
  let orderMode = 'error';
  const orderRequests = [];
  const paymentRequests = [];
  const checkoutFields = {
    order_amount: '5615',
    merchant: 'SP-TEST-HT8B2945',
    currency: 'VND',
    operation: 'PURCHASE',
    order_description: 'Thanh toan don hang ORD-TEST-1',
    order_invoice_number: 'ORD-TEST-1',
    signature: 'backend-generated-signature',
  };

  listeners.set('Runtime.exceptionThrown', (event) => errors.push(event.exceptionDetails.text));
  listeners.set('Fetch.requestPaused', async ({ requestId, request }) => {
    try {
      const url = new URL(request.url);
      if (url.hostname === 'pay-sandbox.sepay.vn') {
        paymentRequests.push({ method: request.method, postData: request.postData });
        await send('Fetch.fulfillRequest', {
          requestId,
          responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }],
          body: Buffer.from('<!doctype html><title>Mock SePay</title>').toString('base64'),
        });
        return;
      }
      if (!url.pathname.startsWith('/api/v1/')) {
        if (url.origin === origin) await send('Fetch.continueRequest', { requestId });
        else await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
        return;
      }

      let status = 200;
      let body = { data: {} };
      if (request.method === 'OPTIONS') status = 204;
      else if (url.pathname.endsWith('/auth/csrf'))
        body = { data: { token: 'test', headerName: 'X-XSRF-TOKEN' } };
      else if (url.pathname.endsWith('/auth/refresh-token'))
        body = {
          data: {
            access_token: 'test',
            tokenType: 'Bearer',
            expiresIn: 600,
            user: { id: 1, name: 'Learner', email: 'learner@example.test' },
          },
        };
      else if (url.pathname.endsWith('/cart') && request.method === 'GET')
        body = { data: { id: 1, items: cartItems, totalAmount: 1005701 } };
      else if (url.pathname.includes('/cart/items/') && request.method === 'DELETE') {
        const deletedId = Number(url.pathname.split('/').at(-1));
        await delay(250);
        cartItems = cartItems.filter((item) => item.id !== deletedId);
        body = { data: 'Deleted' };
      } else if (url.pathname.endsWith('/orders') && request.method === 'POST') {
        orderRequests.push(JSON.parse(request.postData));
        await delay(300);
        if (orderMode === 'error') {
          status = 500;
          body = { message: 'Mock order failure' };
        } else {
          body = {
            data: {
              id: orderRequests.length,
              orderNumber: 'ORD-TEST-1',
              items: [],
              totalAmount: 5615,
              status: 'PENDING',
              paymentStatus: 'PENDING',
              paymentMethod: 'BANK_TRANSFER',
              createdAt: '2026-09-30T00:00:00Z',
              confirmedAt: null,
              paidAt: null,
              checkoutUrl:
                orderMode === 'missing' ? null : 'https://pay-sandbox.sepay.vn/v1/checkout/init',
              checkoutFields: orderMode === 'missing' ? null : checkoutFields,
            },
          };
        }
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
          { name: 'Access-Control-Allow-Methods', value: 'GET, POST, DELETE, OPTIONS' },
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
  await send('Page.navigate', { url: origin + '/cart' });
  await waitFor('document.querySelector(\'[aria-label*="mục 32"]\')');

  const checkoutButton = `([...document.querySelectorAll('button')].find((button) => button.textContent.includes('Tiến hành thanh toán')))`;
  const checkbox = (id) => `document.querySelector('[aria-label*="mục ${id}"]')`;
  const selectAll = `document.querySelector('[aria-label="Chọn tất cả khóa học để thanh toán"]')`;
  assert.equal(await evaluate(`${checkoutButton}.disabled`), true);
  assert.equal(orderRequests.length, 0);

  await evaluate(`${checkbox(32)}.click()`);
  assert.equal(await evaluate(`${checkoutButton}.disabled`), false);
  await evaluate(`${checkoutButton}.click()`);
  await waitFor(`${checkoutButton} && !${checkoutButton}.disabled`);
  assert.deepEqual(orderRequests.at(-1), {
    cartItemIds: [32],
    paymentMethod: 'BANK_TRANSFER',
  });
  assert.equal(await evaluate(`${checkbox(32)}.checked`), true);

  await evaluate(`${checkbox(33)}.click()`);
  await waitFor(`document.body.innerText.includes('5.665')`);
  assert.equal(await evaluate(`${selectAll}.checked`), true);
  await evaluate(`${checkoutButton}.click()`);
  await waitFor(`${checkoutButton} && !${checkoutButton}.disabled`);
  assert.deepEqual(orderRequests.at(-1).cartItemIds, [32, 33]);

  await evaluate(`${checkbox(32)}.click()`);
  assert.equal(await evaluate(`${selectAll}.indeterminate`), true);
  await evaluate(`${checkoutButton}.click()`);
  await waitFor(`${checkoutButton} && !${checkoutButton}.disabled`);
  assert.deepEqual(orderRequests.at(-1).cartItemIds, [33]);

  const requestsBeforeRapidClick = orderRequests.length;
  await evaluate(`${checkoutButton}.click(); ${checkoutButton}.click()`);
  await waitFor(`document.body.innerText.includes('Đang tạo đơn hàng…')`);
  assert.equal(await evaluate(`${checkbox(33)}.disabled`), true);
  assert.equal(
    await evaluate(
      `[...document.querySelectorAll('button[aria-label^="Xóa "]')].every((button) => button.disabled)`,
    ),
    true,
  );
  await waitFor(`${checkoutButton} && !${checkoutButton}.disabled`);
  assert.equal(orderRequests.length, requestsBeforeRapidClick + 1);

  await evaluate(`[...document.querySelectorAll('button[aria-label^="Xóa "]')][1].click()`);
  assert.equal(await evaluate(`${checkoutButton}.disabled`), true);
  await waitFor(`!${checkbox(33)}`);
  assert.equal(await evaluate(`${checkoutButton}.disabled`), true);
  assert.equal(await evaluate(`document.body.innerText.includes('0 khóa học đã chọn')`), true);

  await evaluate(`${selectAll}.click()`);
  assert.equal(await evaluate(`${checkbox(32)}.checked`), true);
  await evaluate(`${selectAll}.click()`);
  assert.equal(await evaluate(`${checkbox(32)}.checked`), false);
  assert.equal(await evaluate(`${checkoutButton}.disabled`), true);
  await evaluate(`${selectAll}.click()`);
  orderMode = 'missing';
  const requestsBeforeMissingData = orderRequests.length;
  await evaluate(`${checkoutButton}.click()`);
  await waitFor(`document.body.innerText.includes('thiếu thông tin thanh toán')`);
  assert.equal(orderRequests.length, requestsBeforeMissingData + 1);
  assert.equal(await evaluate(`${checkbox(32)}.checked`), true);
  assert.equal(await evaluate(`${checkoutButton}.disabled`), false);
  assert.equal(paymentRequests.length, 0);

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await delay(200);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await delay(200);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);

  orderMode = 'success';
  await evaluate(
    `window.__cartNativeSubmit = HTMLFormElement.prototype.submit; HTMLFormElement.prototype.submit = function () { throw new Error('Mock blocked navigation'); }`,
  );
  const requestsBeforeSubmissionFailure = orderRequests.length;
  await evaluate(`${checkoutButton}.click()`);
  await waitFor(`document.body.innerText.includes('Không thể chuyển đến cổng thanh toán')`);
  assert.equal(orderRequests.length, requestsBeforeSubmissionFailure + 1);
  assert.equal(await evaluate(`${checkbox(32)}.checked`), true);
  await evaluate(`HTMLFormElement.prototype.submit = window.__cartNativeSubmit`);
  await evaluate(`${checkoutButton}.click()`);
  try {
    await waitForLocal(() => paymentRequests.length === 1, 'native SePay form POST');
  } catch (error) {
    error.message += `; orders=${orderRequests.length}; payments=${paymentRequests.length}; url=${await evaluate('location.href')}; pageErrors=${errors.join(' | ')}`;
    throw error;
  }
  assert.equal(orderRequests.length, requestsBeforeSubmissionFailure + 1);
  assert.equal(paymentRequests[0].method, 'POST');
  assert.deepEqual(
    Object.fromEntries(new URLSearchParams(paymentRequests[0].postData)),
    checkoutFields,
  );
  assert.deepEqual(errors, []);

  process.stdout.write('Cart checkout browser checks passed with mocked API and SePay POST.\n');
} finally {
  socket?.close();
  browser.kill();
}
