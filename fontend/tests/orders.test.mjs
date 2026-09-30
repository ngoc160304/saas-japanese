import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { Script } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function createLoader() {
  const cache = new Map();

  function resolveModule(path) {
    const candidates = [
      `${path}.ts`,
      `${path}.tsx`,
      resolve(path, 'index.ts'),
      resolve(path, 'index.tsx'),
    ];
    const file = candidates.find((candidate) => existsSync(candidate));
    if (!file) throw new Error(`Cannot resolve module: ${path}`);
    return file;
  }

  function load(path) {
    const file = resolveModule(path);
    if (cache.has(file)) return cache.get(file).exports;

    const compiledModule = { exports: {} };
    cache.set(file, compiledModule);
    const source = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
      },
      fileName: file,
    }).outputText;
    const requireDependency = createRequire(file);
    const localRequire = (specifier) => {
      if (specifier.startsWith('@/')) return load(resolve(root, specifier.slice(2)));
      if (specifier.startsWith('.')) return load(resolve(dirname(file), specifier));
      return requireDependency(specifier);
    };
    new Script(`(function(require, module, exports) {${source}\n})`, {
      filename: file,
    }).runInThisContext()(localRequire, compiledModule, compiledModule.exports);
    return compiledModule.exports;
  }

  return load;
}

function axiosResponse(config, data) {
  return {
    config,
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
  };
}

const order = {
  id: 27,
  orderNumber: 'ORD-1790777763679',
  items: [
    {
      id: 33,
      courseId: 10,
      courseTitle: 'Tiếng Nhật giao tiếp cho người mới',
      thumbnailUrl: null,
      unitPrice: 50,
      subtotal: 50,
    },
    {
      id: 34,
      courseId: 11,
      courseTitle: 'Kanji N3 chuyên sâu',
      thumbnailUrl: null,
      unitPrice: 100000,
      subtotal: 100000,
    },
  ],
  totalAmount: 100050,
  status: 'CONFIRMED',
  paymentStatus: 'SUCCESS',
  paymentMethod: 'BANK_TRANSFER',
  createdAt: '2026-09-30T14:16:03.679076Z',
  confirmedAt: '2026-09-30T21:16:15.603012Z',
  paidAt: '2026-09-30T21:16:15.603012Z',
  checkoutUrl: null,
  checkoutFields: null,
};

const pageData = {
  content: [order],
  number: 1,
  size: 10,
  numberOfElements: 1,
  totalElements: 27,
  totalPages: 3,
  first: false,
  last: false,
  empty: false,
};

test('admin orders API normalizes the response and maps UI pages to backend pages', async () => {
  const load = createLoader();
  const client = load(resolve(root, 'lib/authorize-axios')).default;
  const { ordersAPI } = load(resolve(root, 'apis/orders/orders.api'));
  const signal = new AbortController().signal;
  let requestConfig;

  client.defaults.adapter = async (config) => {
    requestConfig = config;
    return axiosResponse(config, {
      data: pageData,
      error: null,
      message: 'CALL API SUCCESS !',
      statusCode: 200,
    });
  };

  const result = await ordersAPI.getAdminOrders(
    {
      page: 2,
      size: 10,
      search: '  ORD-1790  ',
      status: 'CONFIRMED',
      paymentStatus: 'SUCCESS',
      sortKey: 'createdAt',
      sortType: 'DESC',
    },
    signal,
  );

  assert.equal(result, pageData);
  assert.equal(requestConfig.url, '/admin/orders');
  assert.deepEqual(requestConfig.params, {
    page: 1,
    size: 10,
    search: 'ORD-1790',
    status: 'CONFIRMED',
    paymentStatus: 'SUCCESS',
    sortKey: 'createdAt',
    sortType: 'DESC',
  });
  assert.equal(requestConfig.signal, signal);
  assert.equal(requestConfig.localErrorHandling, true);
});

test('all filters are omitted and first UI page is sent as backend page zero', async () => {
  const load = createLoader();
  const client = load(resolve(root, 'lib/authorize-axios')).default;
  const { ordersAPI } = load(resolve(root, 'apis/orders/orders.api'));
  let requestConfig;

  client.defaults.adapter = async (config) => {
    requestConfig = config;
    return axiosResponse(config, { data: { ...pageData, number: 0 } });
  };

  await ordersAPI.getAdminOrders({
    page: 1,
    size: 10,
    search: '   ',
    sortKey: 'createdAt',
    sortType: 'DESC',
  });

  assert.deepEqual(requestConfig.params, {
    page: 0,
    size: 10,
    sortKey: 'createdAt',
    sortType: 'DESC',
  });
});

test('URL parsing, query construction, fallback labels and course mapping are stable', () => {
  const load = createLoader();
  const utils = load(resolve(root, 'features/orders/utils/order-list'));

  assert.deepEqual(utils.parseOrderPage(null), { page: 1, isValid: true });
  assert.deepEqual(utils.parseOrderPage('2'), { page: 2, isValid: true });
  assert.deepEqual(utils.parseOrderPage('0'), { page: 1, isValid: false });
  assert.deepEqual(utils.parseOrderPage('abc'), { page: 1, isValid: false });
  assert.equal(utils.parseOrderStatus('confirmed'), undefined);
  assert.equal(utils.parseOrderStatus('CONFIRMED'), 'CONFIRMED');
  assert.equal(utils.parsePaymentStatus('REFUNDED'), 'REFUNDED');

  assert.deepEqual(utils.buildOrderListParams(3, '  student@example.test ', 'PENDING', 'FAILED'), {
    page: 3,
    size: 10,
    search: 'student@example.test',
    status: 'PENDING',
    paymentStatus: 'FAILED',
    sortKey: 'createdAt',
    sortType: 'DESC',
  });
  assert.deepEqual(utils.buildOrderListParams(1, ''), {
    page: 1,
    size: 10,
    sortKey: 'createdAt',
    sortType: 'DESC',
  });
  assert.deepEqual(utils.buildOrderStatisticParams('CONFIRMED'), {
    page: 1,
    size: 1,
    status: 'CONFIRMED',
    sortKey: 'createdAt',
    sortType: 'DESC',
  });
  assert.equal(utils.getOrderStatusMeta('NEW_STATUS').label, 'Không xác định');
  assert.equal(utils.getPaymentStatusMeta('NEW_STATUS').label, 'Không xác định');
  assert.equal(utils.getPaymentMethodLabel('NEW_METHOD'), 'NEW METHOD');
});

test('orders table renders data, loading, error and empty states without mock fallback', () => {
  const load = createLoader();
  const { OrdersTable } = load(resolve(root, 'features/orders/component/OrdersTable'));
  const render = (props) =>
    renderToStaticMarkup(
      React.createElement(OrdersTable, {
        orders: [],
        onReset: () => {},
        onRetry: () => {},
        ...props,
      }),
    );

  const populated = render({ orders: [order] });
  assert.match(populated, /ORD-1790777763679/);
  assert.match(populated, /Tiếng Nhật giao tiếp cho người mới/);
  assert.match(populated, /Kanji N3 chuyên sâu/);
  assert.match(populated, /Đã xác nhận/);
  assert.match(populated, /Thành công/);
  assert.match(populated, /Chuyển khoản ngân hàng/);

  const loading = render({ isLoading: true });
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /aria-label="Loading"/);
  assert.doesNotMatch(loading, /Không tìm thấy đơn hàng phù hợp/);

  const error = render({ error: 'Không thể kết nối máy chủ.' });
  assert.match(error, /role="alert"/);
  assert.match(error, /Không thể kết nối máy chủ/);
  assert.match(error, /Thử lại/);
  assert.doesNotMatch(error, /Không tìm thấy đơn hàng phù hợp/);

  const empty = render({});
  assert.match(empty, /Không tìm thấy đơn hàng phù hợp/);
  assert.match(empty, /Xóa bộ lọc/);
});
