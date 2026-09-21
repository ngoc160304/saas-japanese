import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

// Execute actual TypeScript modules using the existing Node test runner.
function load(relativePath, mocks = {}) {
  const file = fileURLToPath(new URL(`../${relativePath}`, import.meta.url));
  const source = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: file,
  }).outputText;
  const compiledModule = { exports: {} };
  const require = createRequire(file);
  new Script(`(function(require, module, exports) {${source}\n})`, {
    filename: file,
  }).runInThisContext()(
    (name) => (name in mocks ? mocks[name] : require(name)),
    compiledModule,
    compiledModule.exports,
  );
  return compiledModule.exports;
}

test('course API uses configured client, zero-based page, search and response envelope', async () => {
  const envelope = { data: { content: [], totalElements: 0 } };
  const api = load('apis/courses/courses.api.ts', {
    '@/lib/authorize-axios': {
      get: async (url, config) => {
        assert.equal(url, '/courses');
        assert.deepEqual(config.params, { search: '日本語', page: 1, size: 12 });
        return { data: envelope };
      },
    },
  });
  assert.equal(await api.courseAPI.getCourses({ search: '日本語', page: 2, size: 12 }), envelope);
});

test('API failures propagate to the query error state', async () => {
  const error = new Error('test failure');
  const api = load('apis/courses/courses.api.ts', {
    '@/lib/authorize-axios': {
      get: async () => {
        throw error;
      },
    },
  });
  await assert.rejects(api.courseAPI.getCourses({ search: '', page: 1, size: 10 }), error);
});

function paramsFor(queryString) {
  const navigations = [];
  const { useDataTableParams } = load('components/common/table/hooks/useDataTableParams.ts', {
    'next/navigation': {
      useSearchParams: () => new URLSearchParams(queryString),
      usePathname: () => '/admin/courses',
      useRouter: () => ({ replace: (url) => navigations.push(url) }),
    },
  });
  // Navigation hooks are replaced with pure stubs in this unit test.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return { params: useDataTableParams({ maxSize: 12 }), navigations };
}

test('URL params default invalid values and cap the backend page size', () => {
  for (const query of ['page=-2&size=-1', 'page=NaN&size=NaN', 'page=1.5&size=0']) {
    const { params } = paramsFor(query);
    assert.equal(params.page, 1);
    assert.equal(params.size, 10);
  }
  assert.equal(paramsFor('size=999').params.size, 12);
  assert.equal(paramsFor('page=3&size=5').params.page, 3);
});

test('search/size reset the page and reset preserves unrelated URL params', () => {
  const { params, navigations } = paramsFor('search=old&page=4&size=5&tab=list');
  params.setSearch('日本語');
  let url = new URL(navigations.at(-1), 'http://localhost');
  assert.equal(url.searchParams.get('search'), '日本語');
  assert.equal(url.searchParams.get('page'), '1');
  params.setSize(12);
  url = new URL(navigations.at(-1), 'http://localhost');
  assert.equal(url.searchParams.get('page'), '1');
  assert.equal(url.searchParams.get('size'), '12');
  params.reset();
  assert.equal(navigations.at(-1), '/admin/courses?tab=list');
});

test('query key and request use the same complete params', () => {
  const params = { search: 'N3', page: 2, size: 5 };
  let options;
  let sent;
  const { useDataTableQuery } = load('components/common/table/hooks/useDataTableQuery.ts', {
    './useDataTableParams': { useDataTableParams: () => params },
    '@tanstack/react-query': {
      keepPreviousData: 'keep',
      useQuery: (value) => {
        options = value;
        return {};
      },
    },
  });
  useDataTableQuery({
    queryKey: ['courses'],
    queryFn: (value) => {
      sent = value;
    },
  });
  assert.deepEqual(options.queryKey, ['courses', params]);
  options.queryFn();
  assert.deepEqual(sent, params);
});

test('formatters preserve zero price and handle missing/invalid dates', () => {
  const { formatCoursePrice, formatCourseDate } = load('features/course/utils/course-format.ts');
  assert.match(formatCoursePrice(0), /0/);
  assert.match(formatCoursePrice(499000), /499\.000/);
  assert.equal(formatCoursePrice(null), 'Chưa có giá');
  assert.equal(formatCourseDate(null), 'Chưa có dữ liệu');
  assert.equal(formatCourseDate('invalid'), 'Chưa có dữ liệu');
  assert.equal(formatCourseDate('2026-09-21T00:00:00Z'), '21/9/2026');
});

test('shared search and reset components forward handlers', () => {
  let searched;
  const { DataTableSearch } = load('components/common/table/search-bar/DataTableSearch.tsx', {
    '@/components/ui/input': { Input: 'input' },
    '@/lib/utils': { cn: (...parts) => parts.join(' ') },
  });
  const input = DataTableSearch({
    value: '',
    onChange: (value) => {
      searched = value;
    },
  }).props.children[1];
  input.props.onChange({ target: { value: 'N3' } });
  assert.equal(searched, 'N3');
  const reset = () => {};
  const { DataTableToolbar } = load('components/common/table/DataTableToolbar.tsx', {
    './search-bar/DataTableSearch': { DataTableSearch: 'search' },
    './search-bar/DataTableReset': { DataTableReset: 'reset' },
  });
  const resetElement = DataTableToolbar({ onReset: reset }).props.children[1].props.children[1];
  assert.equal(resetElement.props.onReset, reset);
});
