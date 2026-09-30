import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { Script } from 'node:vm';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');

function load(path, mocks = {}) {
  const file = resolve(root, path);
  const source = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
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

const Link = ({ href, children, ...props }) =>
  React.createElement('a', { href, ...props }, children);
const CourseThumbnail = ({ title }) => React.createElement('span', null, `Ảnh ${title}`);

const { CourseCard } = load('features/client-course/components/CourseCard.tsx', {
  'next/link': Link,
  '@/features/course/component/CourseThumbnail': { CourseThumbnail },
  '@/features/course/utils/course-format': {
    formatCoursePrice: (value) => `${value} đ`,
  },
});

function createCourse(id) {
  return {
    id,
    title: `Khóa học ${id}`,
    slug: `khoa-hoc-${id}`,
    description: 'Mô tả',
    categoryName: 'JLPT',
    lessonCount: 10,
    price: 499000,
    thumnailURL: null,
  };
}

test('course card title, thumbnail, and detail action use the actual course ID', () => {
  for (const id of [7, 42]) {
    const html = renderToStaticMarkup(
      React.createElement(CourseCard, { course: createCourse(id) }),
    );
    const hrefMatches = html.match(new RegExp(`href="/courses/${id}"`, 'g')) ?? [];

    assert.equal(hrefMatches.length, 3);
    assert.equal(html.includes(`/courses/khoa-hoc-${id}`), false);
  }
});

test('public APIs use selected IDs, unwrap data, and pass cancellation/local error handling', async () => {
  const requests = [];
  let refreshWaits = 0;
  const course = {
    ...createCourse(42),
    updatedAt: '2026-10-01T00:00:00Z',
    totalDurationMinutes: 30,
  };
  const lessons = [{ id: 901, title: 'Lesson', slug: 'lesson', durationMinutes: null }];
  const { clientCoursesAPI, clientCoursesQueryKeys } = load('apis/courses/client-courses.api.ts', {
    '@/lib/authorize-axios': {
      __esModule: true,
      default: {
        get: async (url, options) => {
          requests.push({ url, options });
          return { data: { data: url.endsWith('/lessons') ? lessons : course } };
        },
      },
      waitForSessionRefresh: async () => {
        refreshWaits++;
      },
    },
  });
  const { signal } = new AbortController();
  assert.equal(await clientCoursesAPI.getDetail(42, signal), course);
  assert.equal(await clientCoursesAPI.getLessons(42, signal), lessons);
  assert.equal(refreshWaits, 2);
  assert.deepEqual(
    requests.map(({ url }) => url),
    ['/client/courses/42', '/client/courses/42/lessons'],
  );
  for (const { options } of requests) {
    assert.equal(options.signal, signal);
    assert.equal(options.localErrorHandling, true);
  }
  assert.notDeepEqual(clientCoursesQueryKeys.detail(7), clientCoursesQueryKeys.detail(42));
  assert.notDeepEqual(clientCoursesQueryKeys.lessons(7), clientCoursesQueryKeys.lessons(42));
});

test('addCourse POSTs the course ID without a body and returns the shared cart contract', async () => {
  const requests = [];
  const cart = { id: 5, items: [{ id: 99, courseId: 42 }], totalAmount: 499000 };
  const { cartAPI, cartQueryKeys } = load('apis/cart/cart.api.ts', {
    '@/lib/authorize-axios': {
      __esModule: true,
      default: {
        post: async (...args) => {
          requests.push(args);
          return { data: { data: cart } };
        },
      },
    },
  });
  assert.equal(await cartAPI.addCourse({ courseId: 42 }), cart);
  assert.deepEqual(requests, [['/cart/add/42', undefined, { localErrorHandling: true }]]);
  assert.deepEqual(cartQueryKeys.detail, ['cart', 'detail']);
});

test('syllabus renders actual lesson order, null/zero durations, and no fabricated modules', () => {
  const { CourseSyllabus } = load('features/client-course-detail/components/CourseSyllabus.tsx');
  const html = renderToStaticMarkup(
    React.createElement(CourseSyllabus, {
      lessons: [
        { id: 901, title: 'First actual lesson', slug: 'one', durationMinutes: null },
        { id: 904, title: 'Second actual lesson', slug: 'two', durationMinutes: 0 },
      ],
      loading: false,
      error: null,
      retrying: false,
      onRetry() {},
      lessonCount: 2,
      totalDurationMinutes: 0,
    }),
  );
  assert.ok(html.indexOf('First actual lesson') < html.indexOf('Second actual lesson'));
  assert.match(html, /Chưa có thời lượng/);
  assert.match(html, /0 phút/);
  assert.doesNotMatch(html, /Chương 1|Học thử|videoUrl/);
});

test('syllabus supports loading, empty and retry states', () => {
  const { CourseSyllabus } = load('features/client-course-detail/components/CourseSyllabus.tsx');
  const props = {
    lessons: [],
    loading: false,
    error: null,
    retrying: false,
    onRetry() {},
    lessonCount: 0,
    totalDurationMinutes: 0,
  };
  assert.match(
    renderToStaticMarkup(React.createElement(CourseSyllabus, props)),
    /Chưa có bài học công khai/,
  );
  assert.match(
    renderToStaticMarkup(React.createElement(CourseSyllabus, { ...props, loading: true })),
    /role="status"/,
  );
  assert.match(
    renderToStaticMarkup(React.createElement(CourseSyllabus, { ...props, error: 'Network error' })),
    /Thử lại danh sách bài học/,
  );
});

test('purchase card exposes accessible pending state and keeps buy-now unavailable', () => {
  const { CoursePurchaseCard } = load(
    'features/client-course-detail/components/CoursePurchaseCard.tsx',
    {
      '@/features/course/component/CourseThumbnail': { CourseThumbnail },
      '@/features/course/utils/course-format': { formatCoursePrice: (value) => `${value} đ` },
    },
  );
  const html = renderToStaticMarkup(
    React.createElement(CoursePurchaseCard, {
      course: createCourse(42),
      onAddToCart() {},
      adding: true,
      addDisabled: true,
    }),
  );
  assert.match(html, /Đang thêm…/);
  assert.match(html, /aria-busy="true"/);
  assert.equal((html.match(/disabled=""/g) ?? []).length, 2);
  assert.doesNotMatch(html, /Cam kết hoàn tiền|Ưu đãi|not connected|chưa được kết nối/);
});
