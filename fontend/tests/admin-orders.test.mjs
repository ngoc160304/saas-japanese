import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { Script } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

// Execute the actual modules with mocked boundaries; no backend or new test framework.
const root = resolve(import.meta.dirname, '..');
function load(path, mocks = {}) {
  const file = resolve(root, path);
  const source = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: file,
  }).outputText;
  const mod = { exports: {} };
  const require = createRequire(file);
  new Script(`(function(require,module,exports){${source}\n})`, {
    filename: file,
  }).runInThisContext()((name) => (name in mocks ? mocks[name] : require(name)), mod, mod.exports);
  return mod.exports;
}

function find(node, type) {
  if (!node || typeof node !== 'object') return undefined;
  if (node.type === type) return node;
  for (const child of [node.props?.children].flat(Infinity)) {
    const match = find(child, type);
    if (match) return match;
  }
}

test('admin order API unwraps Spring page and forwards server filters and cancellation', async () => {
  const calls = [];
  const page = { content: [], totalElements: 27, totalPages: 3 };
  const { ordersAPI } = load('apis/orders/orders.api.ts', {
    '@/lib/authorize-axios': {
      get: async (url, config) => {
        calls.push({ url, ...config });
        return { data: { data: page } };
      },
    },
  });
  const signal = new AbortController().signal;
  assert.equal(
    await ordersAPI.getAdminOrders(
      { page: 2, size: 10, search: '  ORD-27  ', status: 'CONFIRMED', paymentStatus: 'SUCCESS' },
      signal,
    ),
    page,
  );
  assert.deepEqual(calls[0].params, {
    page: 2,
    size: 10,
    search: 'ORD-27',
    status: 'CONFIRMED',
    paymentStatus: 'SUCCESS',
  });
  assert.equal(calls[0].url, '/admin/orders');
  assert.equal(calls[0].signal, signal);
  assert.equal(calls[0].localErrorHandling, true);
  await ordersAPI.getAdminOrders({ page: 0, size: 10, search: '   ' });
  assert.equal(calls[1].params.search, undefined);
});

function renderPage(
  queryState,
  searchParams = 'page=2&status=confirmed&payment_status=SUCCESS&search=ORD',
) {
  let listQuery;
  let countQueries;
  const statusUtils = load('features/orders/utils/order-list.ts');
  const Page = load('features/orders/component/OrdersPage.tsx', {
    react: { useEffect: () => {} },
    'next/navigation': { useSearchParams: () => new URLSearchParams(searchParams) },
    '@tanstack/react-query': {
      useQuery: (options) => {
        listQuery = options;
        return queryState;
      },
      useQueries: (options) => {
        countQueries = options.queries;
        return [27, 15, 10, 2].map((totalElements) => ({
          data: { totalElements },
          isError: false,
        }));
      },
      useQueryClient: () => ({ invalidateQueries: () => {} }),
    },
    '@/apis/orders/orders.api': { ordersAPI: { getAdminOrders: () => {} } },
    '@/components/layout/management/header/Header': 'Header',
    '@/components/layout/management/page-section/PageSection': 'PageSection',
    '@/components/common/stats/StatCard': { StatCard: 'StatCard' },
    '@/components/common/table/DataTableToolbar': { DataTableToolbar: 'Toolbar' },
    '@/components/common/table/search-bar/DataTableReset': { DataTableReset: 'Reset' },
    '@/components/common/table/DataTablePagination': { DataTablePagination: 'Pagination' },
    '@/components/ui/button': { Button: 'Button' },
    '@/components/common/loading/IsLoading': { IsLoading: 'Loading' },
    '@/lib/api-error': { getApiErrorMessage: () => 'API unavailable' },
    '../utils/order-list': statusUtils,
    './OrdersTable': { OrdersTable: 'OrdersTable' },
  }).default;
  return {
    tree: Page(),
    get listQuery() {
      return listQuery;
    },
    get countQueries() {
      return countQueries;
    },
  };
}

test('page uses server pagination and uppercase backend status, with global statistics', () => {
  const orders = [{ id: 27, orderNumber: 'ORD-27' }];
  const result = renderPage({
    data: { content: orders, number: 1, totalPages: 3, totalElements: 27 },
    isPending: false,
    isError: false,
  });
  assert.deepEqual(result.listQuery.queryKey[2], {
    page: 1,
    size: 10,
    search: 'ORD',
    status: 'CONFIRMED',
    paymentStatus: 'SUCCESS',
    sortKey: 'createdAt',
    sortType: 'DESC',
  });
  assert.equal(find(result.tree, 'Pagination').props.totalPages, 3);
  assert.equal(find(result.tree, 'OrdersTable').props.orders, orders);
  assert.deepEqual(
    find(result.tree, 'StatCard').props.items.map((item) => item.value),
    [27, 15, 10, 2],
  );
  assert.equal(result.countQueries.length, 4);
});

test('page displays loading and retryable error without a misleading empty table', () => {
  const pending = renderPage({ isPending: true, isError: false }, 'page=-3&status=wrong');
  assert.ok(find(pending.tree, 'Loading'));
  assert.equal(pending.listQuery.queryKey[2].page, 0);
  assert.equal(pending.listQuery.queryKey[2].status, undefined);
  assert.equal(find(pending.tree, 'OrdersTable'), undefined);
  const failed = renderPage({
    isPending: false,
    isError: true,
    error: new Error(),
    refetch: () => {},
  });
  assert.ok(find(failed.tree, 'Button'));
  assert.equal(find(failed.tree, 'OrdersTable'), undefined);
  assert.equal(find(failed.tree, 'Pagination'), undefined);
});

test('table renders camelCase API fields, course titles, VND and Vietnam time', () => {
  const utils = load('features/orders/utils/order-list.ts');
  const tableMocks = Object.fromEntries(
    ['Table', 'TableBody', 'TableCell', 'TableHead', 'TableHeader', 'TableRow'].map((name) => [
      name,
      name,
    ]),
  );
  const { OrdersTable } = load('features/orders/component/OrdersTable.tsx', {
    '@/components/ui/table': tableMocks,
    '@/components/ui/button': { Button: 'Button' },
    '../utils/order-list': utils,
  });
  const tree = OrdersTable({
    orders: [
      {
        id: 27,
        orderNumber: 'ORD-27',
        items: [{ courseTitle: 'Tiếng Nhật' }],
        totalAmount: 1000000,
        status: 'CONFIRMED',
        paymentStatus: 'SUCCESS',
        paymentMethod: 'BANK_TRANSFER',
        createdAt: '2026-09-30T14:16:03Z',
      },
    ],
    onReset: () => {},
  });
  const rendered = JSON.stringify(tree);
  for (const text of [
    'ORD-27',
    'Tiếng Nhật',
    '1.000.000',
    'Đã xác nhận',
    'Thành công',
    'Chuyển khoản',
    '21:16',
  ])
    assert.ok(rendered.includes(text), text);
  assert.ok(
    JSON.stringify(OrdersTable({ orders: [], onReset: () => {} })).includes(
      'Không tìm thấy đơn hàng phù hợp',
    ),
  );
});
