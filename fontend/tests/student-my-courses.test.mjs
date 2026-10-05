import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { Script } from 'node:vm';
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
  new Script(`(function(require,module,exports){${source}\n})`, { filename: file }).runInThisContext()(
    (name) => (name in mocks ? mocks[name] : require(name)),
    mod,
    mod.exports,
  );
  return mod.exports;
}

const urlState = load('features/student-courses/utils/my-courses-query.ts');

test('My Courses URL state uses a one-based page and only supported filters', () => {
  const state = urlState.parseMyCoursesSearchParams(
    new URLSearchParams('courseTitle=%20Kanji%20&page=3&pricing=paid&title=old'),
  );
  assert.deepEqual(state, { courseTitle: 'Kanji', page: 3 });
  assert.deepEqual(urlState.toMyCoursesQuery(state), {
    page: 2,
    size: 9,
    courseTitle: 'Kanji',
  });
  assert.equal(
    urlState.writeMyCoursesSearchParams(
      new URLSearchParams('tab=saved&pricing=paid&title=old&page=3'),
      { courseTitle: 'Kanji', page: 1 },
    ).toString(),
    'tab=saved&courseTitle=Kanji',
  );
  assert.deepEqual(
    urlState.parseMyCoursesSearchParams(new URLSearchParams('page=-1&courseTitle=%20')),
    { courseTitle: '', page: 1 },
  );
});

test('My Courses API sends title and pagination through the authenticated client', async () => {
  const requests = [];
  const posts = [];
  let paidCourse = false;
  const axios = {
    get: async (url, options) => {
      requests.push({ url, options });
      return {
        data: {
          data: {
            content: [
              { Id: 41, courseId: 9, courseTitle: 'Kanji', progressPercent: 30 },
              { Id: 42, courseId: 10, courseTitle: 'Grammar', progressPercent: 50 },
            ],
            number: 2,
            size: 9,
            totalElements: 22,
            totalPages: 3,
          },
        },
      };
    },
    post: async (url, body, options) => {
      posts.push({ url, body, options });
      return paidCourse
        ? { data: '' }
        : { data: { data: { Id: 51, courseId: 9, courseTitle: 'Kanji' } } };
    },
  };
  const { clientCoursesAPI, clientCoursesQueryKeys } = load('apis/courses/client-courses.api.ts', {
    '@/lib/authorize-axios': { __esModule: true, default: axios, waitForSessionRefresh: async () => {} },
  });
  const params = { page: 2, size: 9, courseTitle: 'Kanji' };
  const signal = new AbortController().signal;
  const page = await clientCoursesAPI.getMyCourses(params, signal);
  assert.equal(page.number, 2);
  assert.equal(page.totalPages, 3);
  assert.equal(page.content[0].id, 41);
  assert.equal(page.content[0].courseId, 9);
  assert.deepEqual(page.content.map((enrollment) => enrollment.id), [41, 42]);
  assert.equal('Id' in page.content[0], false);
  const enrollment = await clientCoursesAPI.enrollCourse(9);
  assert.equal(enrollment.id, 51);
  assert.equal(enrollment.courseId, 9);
  assert.equal('Id' in enrollment, false);
  paidCourse = true;
  assert.equal(await clientCoursesAPI.enrollCourse(10), null);
  assert.deepEqual(posts.map((post) => post.url), ['/courses/9/enroll', '/courses/10/enroll']);
  assert.deepEqual(requests, [
    { url: '/courses/my-courses', options: { params, signal, localErrorHandling: true } },
  ]);
  assert.notDeepEqual(
    clientCoursesQueryKeys.myCoursesPage(1, params),
    clientCoursesQueryKeys.myCoursesPage(2, params),
  );
});
