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

test('category API sends search and zero-based page, clamps size, clears blank search', async () => {
  const calls = [];
  const { categoryCourseAPI } = load('apis/categories-course/categories-course.api.ts', {
    '@/lib/authorize-axios': {
      get: async (url, config) => {
        calls.push({ url, ...config });
        return { data: {} };
      },
    },
    '@/utils/constant': { API_VERSION: 'api/v1' },
  });
  await categoryCourseAPI.getCategoriesCourse({ page: 2, size: 50, search: '  日本語 & kanji  ' });
  assert.match(calls[0].url, /\/course-categories$/);
  assert.deepEqual(calls[0].params, { page: 1, size: 12, search: '日本語 & kanji' });
  await categoryCourseAPI.getCategoriesCourse({ page: 1, search: '   ' });
  assert.deepEqual(calls[1].params, { page: 0, size: 10, search: undefined });
});

test('URL search resets page, preserves unrelated params and reset removes filters', () => {
  let query = 'page=3&size=10&search=old&tab=all';
  const { useDataTableParams } = load('components/common/table/hooks/useDataTableParams.ts', {
    'next/navigation': {
      usePathname: () => '/admin/categories-course',
      useSearchParams: () => new URLSearchParams(query),
      useRouter: () => ({
        replace: (url) => {
          query = url.split('?')[1] ?? '';
        },
      }),
    },
  });
  useDataTableParams().setSearch('日本語 & kanji');
  assert.equal(useDataTableParams().search, '日本語 & kanji');
  assert.equal(useDataTableParams().page, 1);
  assert.equal(new URLSearchParams(query).get('tab'), 'all');
  useDataTableParams().setPage(2);
  assert.equal(useDataTableParams().search, '日本語 & kanji');
  useDataTableParams().reset();
  assert.equal(query, 'tab=all');
  assert.equal(useDataTableParams().page, 1);
  query = 'page=-3&size=0&search=restored';
  assert.equal(useDataTableParams().page, 1);
  assert.equal(useDataTableParams().search, 'restored');
});

test('search input and toolbar forward change/reset callbacks', () => {
  let search = '';
  const { DataTableSearch } = load('components/common/table/search-bar/DataTableSearch.tsx', {
    'lucide-react': { Search: 'Search' },
    '@/components/ui/input': { Input: 'Input' },
    '@/lib/utils': { cn: (...classes) => classes.filter(Boolean).join(' ') },
  });
  const input = find(
    DataTableSearch({
      value: '',
      onChange: (value) => {
        search = value;
      },
    }),
    'Input',
  );
  input.props.onChange({ target: { value: 'kanji' } });
  assert.equal(search, 'kanji');
  let resets = 0;
  const { DataTableToolbar } = load('components/common/table/DataTableToolbar.tsx', {
    './search-bar/DataTableSearch': { DataTableSearch: 'Search' },
    './search-bar/DataTableReset': { DataTableReset: 'Reset' },
  });
  find(
    DataTableToolbar({
      onReset: () => {
        resets++;
      },
    }),
    'Reset',
  ).props.onReset();
  assert.equal(resets, 1);
});

test('query identity includes search/page/size and forwards all params to the API', async () => {
  const params = { search: 'kanji', page: 2, size: 10 };
  let options;
  const { useDataTableQuery } = load('components/common/table/hooks/useDataTableQuery.ts', {
    '@tanstack/react-query': {
      useQuery: (value) => {
        options = value;
        return {};
      },
    },
    './useDataTableParams': { useDataTableParams: () => params },
  });
  let sent;
  useDataTableQuery({
    queryKey: ['categories-course'],
    queryFn: async (value) => {
      sent = value;
    },
  });
  assert.deepEqual(options.queryKey, ['categories-course', params]);
  await options.queryFn();
  assert.deepEqual(sent, params);
});

test('last-row deletion returns to previous page, but never before page one', () => {
  for (const [page, count, expected] of [
    [2, 1, 1],
    [1, 1, null],
    [3, 2, null],
  ]) {
    let nextPage = null;
    let stateIndex = 0;
    const mocks = {
      react: { useState: () => [stateIndex++ === 0 ? false : { id: 7 }, () => {}] },
      '@/apis/categories-course/categories-course.api': { categoryCourseAPI: {} },
      '@/lib/api-error': { getApiErrorMessage: () => '' },
      '@/components/common/table/hooks/useDataTableQuery': {
        useDataTableQuery: () => ({
          data: {
            data: {
              content: Array(count).fill({ id: 7 }),
              totalPages: page,
              pageable: { pageNumber: page - 1 },
            },
          },
          page,
          setPage: (value) => {
            nextPage = value;
          },
        }),
      },
    };
    for (const [path, name] of [
      ['@/components/ui/button', 'Button'],
      ['./CategoryCourseDialog', 'CategoryCourseDialog'],
      ['@/components/common/button/CreateButton', 'CreateButton'],
      ['@/components/common/table/DataTablePagination', 'DataTablePagination'],
      ['@/components/common/table/DataTableToolbar', 'DataTableToolbar'],
      ['@/components/common/table/search-bar/DataTableFilters', 'DataTableFilter'],
      ['@/features/category-course/component/CategoryCourseTable', 'CourseCategoriesTable'],
      ['@/components/common/stats/StatCard', 'StatCard'],
      ['@/components/common/loading/IsLoading', 'IsLoading'],
    ])
      mocks[path] = { [name]: name };
    mocks['@/components/layout/management/page-section/PageSection'] = 'PageSection';
    mocks['@/components/layout/management/header/Header'] = 'Header';
    const Page = load('features/category-course/component/CategoryCoursePage.tsx', mocks).default;
    find(Page(), 'CourseCategoriesTable').props.onDeleted();
    assert.equal(nextPage, expected);
  }
});

function popoverHarness(onConfirm) {
  const events = [];
  let stateIndex = 0;
  const { DeleteConfirmPopover } = load('components/common/DeleteConfirmPopover.tsx', {
    react: {
      useRef: () => ({ current: false }),
      useState: (initial) => {
        const index = stateIndex++;
        return [
          initial,
          (value) => {
            if (index === 0) events.push(value ? 'open' : 'close');
          },
        ];
      },
    },
    'lucide-react': { LoaderCircle: 'LoaderCircle' },
    '@/components/ui/button': { Button: 'Button' },
    '@/components/ui/popover': Object.fromEntries(
      ['Popover', 'PopoverContent', 'PopoverDescription', 'PopoverTitle', 'PopoverTrigger'].map(
        (name) => [name, name],
      ),
    ),
  });
  const tree = DeleteConfirmPopover({
    trigger: 'Trigger',
    title: 'Delete?',
    description: 'Warning',
    onConfirm,
    errorMessage: () => {
      events.push('error');
      return 'Failed';
    },
  });
  function confirmButton(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'Button' && node.props.variant === 'destructive') return node;
    for (const child of [node.props?.children].flat(Infinity)) {
      const result = confirmButton(child);
      if (result) return result;
    }
  }
  return { tree, events, confirm: confirmButton(tree).props.onClick };
}

test('popconfirm prevents duplicate submissions and dismissal while pending, closes on success', async () => {
  let calls = 0;
  let finish;
  const h = popoverHarness(async () => {
    calls++;
    await new Promise((resolvePromise) => {
      finish = resolvePromise;
    });
  });
  assert.equal(calls, 0);
  h.tree.props.onOpenChange(false);
  assert.deepEqual(h.events, ['close']);
  h.events.length = 0;
  const first = h.confirm();
  await h.confirm();
  h.tree.props.onOpenChange(false);
  assert.equal(calls, 1);
  assert.deepEqual(h.events, []);
  finish();
  await first;
  assert.deepEqual(h.events, ['close']);
});

test('popconfirm keeps failed request open and allows retry', async () => {
  let attempts = 0;
  const h = popoverHarness(async () => {
    if (++attempts === 1) throw new Error('failure');
  });
  await h.confirm();
  assert.deepEqual(h.events, ['error']);
  await h.confirm();
  assert.deepEqual(h.events, ['error', 'close']);
});

test('category detail and course filters use existing REST endpoints', async () => {
  let sent;
  const { courseAPI } = load('apis/courses/courses.api.ts', {
    '@/lib/authorize-axios': {
      get: async (url, config) => {
        sent = { url, ...config };
        return { data: {} };
      },
    },
  });
  await courseAPI.getCourses({
    categoryId: 7,
    page: 2,
    size: 5,
    search: 'kanji',
    published: false,
    pricing: 'free',
  });
  assert.deepEqual(sent, {
    url: '/courses',
    params: { categoryId: 7, page: 1, size: 5, search: 'kanji', published: false, pricing: 'free' },
  });
});
