import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Requires a local production server. The detail page itself makes no course API requests.
const origin = process.env.COURSE_DETAIL_TEST_ORIGIN ?? 'http://localhost:3100';
const profile = await mkdtemp(join(tmpdir(), 'studyjlpt-course-detail-browser-'));
const browser = spawn(
  process.env.COURSE_DETAIL_TEST_BROWSER ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
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
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) return;
    const callback = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) callback.reject(new Error(JSON.stringify(message.error)));
    else callback.resolve(message.result);
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
    for (let index = 0; index < 100; index++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    throw new Error(`Timed out: ${expression}`);
  };
  const setViewport = (width, height) =>
    send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });
  const captureScreenshot = async (name) => {
    const result = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    await writeFile(join(profile, `${name}.png`), Buffer.from(result.data, 'base64'));
  };
  const navigate = async (path) => {
    await send('Page.navigate', { url: origin + path });
    await waitFor('document.readyState === "complete"');
    await waitFor(`document.querySelectorAll('button[aria-controls$="-content"]').length === 5`);
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await setViewport(1440, 1000);
  await navigate('/courses/7');

  assert.equal(await evaluate('document.body.innerText.includes("khóa học #7")'), true);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  assert.deepEqual(
    await evaluate(
      `[...document.querySelectorAll('button[aria-controls$="-content"]')].map(button => button.getAttribute("aria-expanded"))`,
    ),
    ['true', 'false', 'false', 'false', 'false'],
  );
  assert.equal(
    await evaluate(
      `getComputedStyle(document.querySelector('aside[aria-label="Thông tin mua khóa học"]').parentElement).position`,
    ),
    'sticky',
  );
  assert.equal(
    await evaluate(`(() => {
      const details = document.querySelector('.order-2.space-y-8').getBoundingClientRect();
      const purchase = document.querySelector('aside[aria-label="Thông tin mua khóa học"]').getBoundingClientRect();
      return details.left < purchase.left;
    })()`),
    true,
  );
  assert.equal(
    await evaluate(
      `document.querySelectorAll('aside[aria-label="Thông tin mua khóa học"] button:disabled').length`,
    ),
    2,
  );

  await evaluate(
    `document.querySelector('button[aria-controls="module-grammar-foundations-content"]').focus()`,
  );
  assert.equal(
    await evaluate(
      'document.activeElement.getAttribute("aria-controls") === "module-grammar-foundations-content" && document.activeElement.tabIndex === 0',
    ),
    true,
  );
  await evaluate(
    `document.querySelector('button[aria-controls="module-grammar-foundations-content"]').click()`,
  );
  await waitFor(
    `document.querySelector('button[aria-controls="module-grammar-foundations-content"]').getAttribute("aria-expanded") === "false"`,
  );
  await evaluate(
    '[...document.querySelectorAll("button")].find(button => button.textContent.includes("Mở rộng tất cả")).click()',
  );
  await waitFor(
    `[...document.querySelectorAll('button[aria-controls$="-content"]')].every(button => button.getAttribute("aria-expanded") === "true")`,
  );

  await send('Page.reload');
  await waitFor('document.readyState === "complete"');
  await waitFor('document.body.innerText.includes("khóa học #7")');

  await setViewport(390, 844);
  await send('Page.reload');
  await waitFor('document.readyState === "complete"');
  await waitFor(`document.querySelectorAll('button[aria-controls$="-content"]').length === 5`);
  await delay(200);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  assert.equal(
    await evaluate(`(() => {
      const details = document.querySelector('.order-2.space-y-8').getBoundingClientRect();
      const purchase = document.querySelector('aside[aria-label="Thông tin mua khóa học"]').getBoundingClientRect();
      return purchase.top < details.top;
    })()`),
    true,
  );
  await captureScreenshot('course-detail-mobile');

  await navigate('/courses/42');
  assert.equal(await evaluate('document.body.innerText.includes("khóa học #42")'), true);
  assert.equal(
    await evaluate(
      `[...document.querySelectorAll('nav[aria-label="Breadcrumb"] a')].map(link => link.getAttribute("href")).join(",")`,
    ),
    '/,/courses',
  );

  process.stdout.write(
    `Browser course detail passed: direct routes and refresh, route IDs, keyboard-focusable accordion controls, expand/collapse, disabled purchase actions, breadcrumbs, and responsive desktop/mobile ordering.\nScreenshot: ${profile}\n`,
  );
} finally {
  socket?.close();
  browser.kill();
}
