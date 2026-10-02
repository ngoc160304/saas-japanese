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

const load = createLoader();
const { kanjiAPI } = load(resolve(root, 'apis/lessons/lesson-content.api'));
const client = load(resolve(root, 'lib/authorize-axios')).default;
const { KanjiCard } = load(resolve(root, 'features/lesson/component/kanji/KanjiCard'));
const { KanjiSection } = load(resolve(root, 'features/lesson/component/kanji/KanjiSection'));
const item = { id: 1, lessonId: 7, kanji: '学', onyomi: 'ガク', kunyomi: 'まなぶ', meaningVi: 'học', strokeCount: 8, exampleWords: '学生（がくせい）: học sinh' };

test('study Kanji request uses lesson path and unwraps array including empty results', async () => {
  const original = client.defaults.adapter;
  try {
    for (const data of [[item], []]) {
      client.defaults.adapter = async (config) => {
        assert.equal(config.method, 'get');
        assert.equal(config.url, '/study/lessons/7/kanjis');
        assert.equal(config.localErrorHandling, true);
        assert.equal(config.params, undefined);
        return axiosResponse(config, { data, error: null, statusCode: 200, message: 'OK' });
      };
      assert.deepEqual(await kanjiAPI.listByLesson(7), data);
    }
    client.defaults.adapter = async (config) => axiosResponse(config, { data: { content: [item] } });
    await assert.rejects(kanjiAPI.listByLesson(7), /Invalid Kanji response/);
    client.defaults.adapter = async () => { throw new Error('Network failed'); };
    await assert.rejects(kanjiAPI.listByLesson(7), /Network failed/);
  } finally {
    client.defaults.adapter = original;
  }
});

test('Kanji cards render server fields, escape content, and handle nullable values', () => {
  const markup = renderToStaticMarkup(React.createElement(KanjiCard, { item }));
  for (const value of ['学', 'ガク', 'まなぶ', 'học', '8 nét', '学生（がくせい）: học sinh']) assert.ok(markup.includes(value));
  const nullable = renderToStaticMarkup(React.createElement(KanjiCard, { item: { ...item, onyomi: null, kunyomi: null, strokeCount: null, exampleWords: '<script>alert(1)</script>' } }));
  assert.ok(nullable.includes('Chưa cập nhật số nét'));
  assert.ok(nullable.includes('&lt;script&gt;'));
  assert.ok(!nullable.includes('<script>'));
});

test('Kanji section presents loading, error/retry, empty and real count', () => {
  const base = { isFetching: false, isPending: false, isError: false, refetch: () => Promise.resolve(), data: [] };
  const render = (query) => renderToStaticMarkup(React.createElement(KanjiSection, { query: { ...base, ...query } }));
  assert.ok(render({ isPending: true }).includes('Đang tải Kanji'));
  assert.ok(render({ isError: true, error: new Error('Network') }).includes('Thử lại'));
  assert.ok(render({}).includes('Bài học này chưa có Kanji'));
  assert.ok(render({ data: [item] }).includes('Kanji Cards (1)'));
});
