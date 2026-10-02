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

const quiz = {
  id: 2,
  title: 'Quiz Bài 2',
  description: 'Kiểm tra kiến thức về công việc.',
  questions: [
    {
      id: 7,
      questionText: '「仕事」 có nghĩa là gì?',
      questionType: 'SINGLE_CHOICE',
      sortOrder: 2,
      options: [
        { id: 26, optionText: 'Gia đình.', sortOrder: 2 },
        { id: 25, optionText: 'Công việc.', sortOrder: 1 },
      ],
    },
    {
      id: 6,
      questionText: '「会社」 có nghĩa là gì?',
      questionType: 'SINGLE_CHOICE',
      sortOrder: 1,
      options: [{ id: 21, optionText: 'Trường học.', sortOrder: 1 }],
    },
  ],
};
const wrap = (data) => ({ data, error: null, message: 'CALL API SUCCESS !', statusCode: 200 });

test('quiz uses the current lesson, cancellation and sorts nested data without mutating the response', async () => {
  const load = createLoader();
  const client = load(resolve(root, 'lib/authorize-axios')).default;
  const { getLessonQuiz } = load(resolve(root, 'apis/lessons/lesson-quiz.api'));
  let request;
  client.defaults.adapter = async (config) => {
    request = config;
    return axiosResponse(config, wrap(quiz));
  };
  const signal = new AbortController().signal;
  const result = await getLessonQuiz(42, signal);
  assert.equal(request.url, '/study/lessons/42/quiz');
  assert.equal(request.signal, signal);
  assert.equal(request.localErrorHandling, true);
  assert.deepEqual(
    result.questions.map((q) => q.id),
    [6, 7],
  );
  assert.deepEqual(
    result.questions[1].options.map((o) => o.id),
    [25, 26],
  );
  assert.deepEqual(
    quiz.questions.map((q) => q.id),
    [7, 6],
  );
  assert.deepEqual(
    quiz.questions[0].options.map((o) => o.id),
    [26, 25],
  );
  await getLessonQuiz(43);
  assert.equal(request.url, '/study/lessons/43/quiz');
});

test('empty payload stays empty and API envelope failures are rejected', async () => {
  const load = createLoader();
  const client = load(resolve(root, 'lib/authorize-axios')).default;
  const { getLessonQuiz } = load(resolve(root, 'apis/lessons/lesson-quiz.api'));
  client.defaults.adapter = async (config) => axiosResponse(config, wrap(null));
  assert.equal(await getLessonQuiz(2), null);
  client.defaults.adapter = async (config) =>
    axiosResponse(config, { ...wrap(null), error: 'Failed', statusCode: 500 });
  await assert.rejects(getLessonQuiz(2));
  client.defaults.adapter = async () => {
    throw new Error('Offline');
  };
  await assert.rejects(getLessonQuiz(2), /Offline/);
});

test('quiz displays API fields, derived count and neutral options without invented settings or answers', () => {
  const load = createLoader();
  const { QuizSection } = load(resolve(root, 'features/lesson/component/quiz/QuizSection'));
  const render = (props) =>
    renderToStaticMarkup(
      React.createElement(QuizSection, {
        quiz,
        isPending: false,
        isFetching: false,
        isError: false,
        error: null,
        onRetry() {},
        ...props,
      }),
    );
  const html = render();
  assert.match(html, /Quiz Bài 2/);
  assert.match(html, /Quiz Questions \(2\)/);
  assert.match(html, /「仕事」 có nghĩa là gì/);
  assert.match(html, /Công việc/);
  assert.doesNotMatch(html, /Pass Score|Time Limit|Add Question|emerald|checked/);
  assert.match(render({ isPending: true }), /Đang tải quiz/);
  assert.match(render({ quiz: null }), /Bài học chưa có quiz/);
  assert.match(render({ quiz: { ...quiz, questions: [] } }), /Quiz chưa có câu hỏi/);
  assert.match(render({ isError: true, error: new Error('Offline') }), /role="alert"/);
  assert.match(render({ isError: true }), /Thử lại/);
});
