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

test('mock detail data uses stable unique IDs for accordion and list rendering', () => {
  const { MOCK_COURSE_DETAIL } = load('features/client-course-detail/course-detail.mock.ts');
  const moduleIds = MOCK_COURSE_DETAIL.syllabus.modules.map((module) => module.id);
  const lessonIds = MOCK_COURSE_DETAIL.syllabus.modules.flatMap((module) =>
    module.lessons.map((lesson) => lesson.id),
  );

  assert.equal(new Set(moduleIds).size, moduleIds.length);
  assert.equal(new Set(lessonIds).size, lessonIds.length);
  assert.equal(MOCK_COURSE_DETAIL.syllabus.modules[0].id, 'module-grammar-foundations');
});
