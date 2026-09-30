import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { Script } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');

function load(path, mocks = {}) {
  const file = resolve(root, path);
  const source = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
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

const query = load('features/client-course/utils/course-list-query.ts');

test('course listing URL parser sanitizes invalid values and trims title', () => {
  assert.deepEqual(
    query.parseCoursesSearchParams(
      new URLSearchParams('title=%20N3%20&page=0&size=13&pricing=trial&categoryId=-4&sort=popular'),
    ),
    {
      title: 'N3',
      categoryId: null,
      pricing: 'all',
      page: 1,
      size: 9,
      sort: 'newest',
    },
  );
  assert.deepEqual(
    query.parseCoursesSearchParams(
      new URLSearchParams('page=3&size=12&pricing=paid&categoryId=7&sort=price-desc'),
    ),
    {
      title: '',
      categoryId: 7,
      pricing: 'paid',
      page: 3,
      size: 12,
      sort: 'price-desc',
    },
  );
});

test('UI page converts to zero-based API page exactly once with supported sorting', () => {
  assert.deepEqual(
    query.toClientCoursesQuery({
      title: 'N2',
      categoryId: 4,
      pricing: 'free',
      page: 3,
      size: 9,
      sort: 'price-asc',
    }),
    {
      page: 2,
      size: 9,
      title: 'N2',
      categoryId: 4,
      pricing: 'free',
      sortKey: 'price',
      sortType: 'ASC',
    },
  );
  assert.deepEqual(
    query.toClientCoursesQuery(query.parseCoursesSearchParams(new URLSearchParams())),
    { page: 0, size: 9, sortKey: 'createdAt', sortType: 'DESC' },
  );
});

test('canonical course params preserve unrelated URL state and omit defaults', () => {
  const params = query.writeCoursesSearchParams(
    new URLSearchParams('tab=saved&page=bad&pricing=trial&sort=popular'),
    query.parseCoursesSearchParams(
      new URLSearchParams('tab=saved&page=bad&pricing=trial&sort=popular'),
    ),
  );
  assert.equal(params.toString(), 'tab=saved');
});

test('pagination creates compact, stable windows around the current page', () => {
  assert.deepEqual(query.getCoursesPaginationItems(1, 1), [1]);
  assert.deepEqual(query.getCoursesPaginationItems(4, 10), [1, 2, 3, 4, 5, 'ellipsis', 10]);
  assert.deepEqual(query.getCoursesPaginationItems(6, 10), [
    1,
    'ellipsis',
    5,
    6,
    7,
    'ellipsis',
    10,
  ]);
  assert.deepEqual(query.getCoursesPaginationItems(10, 10), [1, 'ellipsis', 6, 7, 8, 9, 10]);
});

test('public course API forwards the full query and AbortSignal through the configured client', async () => {
  let request;
  const expected = { content: [], totalElements: 0 };
  const { clientCoursesAPI, clientCoursesQueryKeys } = load('apis/courses/client-courses.api.ts', {
    '@/lib/authorize-axios': {
      get: async (url, config) => {
        request = { url, config };
        return { data: { data: expected } };
      },
      waitForSessionRefresh: async () => undefined,
    },
  });
  const params = {
    title: 'N1',
    pricing: 'paid',
    page: 0,
    size: 9,
    sortKey: 'createdAt',
    sortType: 'DESC',
  };
  const controller = new AbortController();

  assert.equal(await clientCoursesAPI.getClientCourses(params, controller.signal), expected);
  assert.deepEqual(request, {
    url: '/client/courses',
    config: { params, signal: controller.signal, localErrorHandling: true },
  });
  assert.deepEqual(clientCoursesQueryKeys.list(params), ['client-courses', params]);
});
