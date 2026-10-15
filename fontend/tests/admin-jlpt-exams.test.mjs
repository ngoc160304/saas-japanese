import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { Script } from 'node:vm';
import ts from 'typescript';
import { QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cache = new Map();
function load(path) {
  const file = [`${path}.ts`, `${path}.tsx`].find(existsSync);
  if (!file) throw new Error(`Cannot resolve ${path}`);
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
  const require = createRequire(file);
  const localRequire = (name) =>
    name.startsWith('@/')
      ? load(resolve(root, name.slice(2)))
      : name.startsWith('.')
        ? load(resolve(dirname(file), name))
        : require(name);
  new Script(`(function(require,module,exports){${source}\n})`, {
    filename: file,
  }).runInThisContext()(localRequire, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const client = load(resolve(root, 'lib/authorize-axios')).default;
const api = load(resolve(root, 'apis/admin-jlpt-exams/admin-jlpt-exams.api')).adminJlptExamsAPI;
const keys = load(resolve(root, 'apis/admin-jlpt-exams/admin-jlpt-exams.keys')).adminJlptExamKeys;
const { invalidateAdminJlptExam } = load(
  resolve(root, 'features/admin-jlpt-exams/hooks/useAdminJlptExams'),
);
const { getAdminJlptError } = load(resolve(root, 'features/admin-jlpt-exams/admin-jlpt-error'));
const { parseAdminJlptExamId, parseAdminJlptExamQuery } = load(
  resolve(root, 'features/admin-jlpt-exams/admin-jlpt-route'),
);
const { validateAdminJlptMedia } = load(resolve(root, 'apis/admin-jlpt-exams/admin-jlpt-media'));
const response = (config, data, status = 200) => ({
  config,
  data,
  status,
  statusText: 'OK',
  headers: {},
});

test('admin keys include list inputs; statistics exclude pagination/status/sort and student caches', () => {
  const params = {
    search: '日本語',
    level: 'N3',
    page: 2,
    size: 12,
    status: 'ARCHIVED',
    sortKey: 'title',
    sortType: 'ASC',
  };
  assert.deepEqual(keys.list(params), ['admin-jlpt-exams', 'list', params]);
  for (const [key, value] of Object.entries({
    page: 3,
    size: 10,
    status: 'DRAFT',
    sortKey: 'id',
    sortType: 'DESC',
    level: 'N4',
    search: 'other',
  })) {
    assert.notDeepEqual(keys.list(params), keys.list({ ...params, [key]: value }));
  }
  assert.deepEqual(keys.stats(params), keys.stats({ search: '日本語', level: 'N3' }));
  assert.notEqual(keys.detail(1)[0], 'jlpt-exams');
});

test('reads unwrap data, keep nullable fields, forward AbortSignal, and strip list inputs from stats', async () => {
  const calls = [];
  const detail = { id: 1, description: null, sessions: [] };
  client.defaults.adapter = async (config) => {
    calls.push(config);
    return response(config, { data: detail });
  };
  const signal = new AbortController().signal;
  assert.deepEqual(await api.detail(1, signal), detail);
  assert.equal(calls[0].url, '/admin/jlpt-exams/1');
  assert.equal(calls[0].signal, signal);
  assert.equal(calls[0].localErrorHandling, true);
  await api.stats({ page: 9, size: 1, status: 'DRAFT', search: 'test', level: 'N2' });
  assert.deepEqual(calls[1].params, { search: 'test', level: 'N2' });
  assert.equal(calls[1].baseURL.endsWith('/api/v1'), true);
  const aborted = new AbortController();
  aborted.abort();
  await assert.rejects(api.detail(1, aborted.signal), /canceled/i);
});

test('nested writes preserve every ownership ID, complete reorder sets and atomic retained/new answers', async () => {
  const calls = [];
  client.defaults.adapter = async (config) => {
    calls.push(config);
    return response(config, { data: { id: 7 } });
  };
  const path = { examId: 1, sessionId: 2, partId: 3, questionId: 4, answerId: 5 };
  const base = '/admin/jlpt-exams/1';
  const s = `${base}/sessions/2`,
    p = `${s}/parts/3`,
    q = `${p}/questions/4`,
    a = `${q}/answers/5`;
  const data = { sortOrder: 0 };
  const operations = [
    ['create', 'post', '/admin/jlpt-exams'],
    ['update', 'put', base],
    ['archive', 'delete', base],
    ['publish', 'post', `${base}/publish`],
    ['unpublish', 'post', `${base}/unpublish`],
    ['createSession', 'post', `${base}/sessions`],
    ['updateSession', 'put', s],
    ['deleteSession', 'delete', s],
    ['sortSession', 'patch', `${s}/sort-order`],
    ['createPart', 'post', `${s}/parts`],
    ['updatePart', 'put', p],
    ['deletePart', 'delete', p],
    ['sortPart', 'patch', `${p}/sort-order`],
    ['createQuestion', 'post', `${p}/questions`],
    ['updateQuestion', 'put', q],
    ['deleteQuestion', 'delete', q],
    ['sortQuestion', 'patch', `${q}/sort-order`],
    ['createQuestionWithAnswers', 'post', `${p}/questions/with-answers`],
    ['updateQuestionWithAnswers', 'put', `${q}/with-answers`],
    ['createAnswer', 'post', `${q}/answers`],
    ['updateAnswer', 'put', a],
    ['deleteAnswer', 'delete', a],
    ['sortAnswer', 'patch', `${a}/sort-order`],
  ];
  for (const [method, verb, url] of operations) {
    await api[method]({ ...path, data });
    assert.equal(calls.at(-1).method, verb, method);
    assert.equal(calls.at(-1).url, url, method);
  }
  for (const [method, parent] of [
    ['reorderSessions', `${base}/sessions`],
    ['reorderParts', `${s}/parts`],
    ['reorderQuestions', `${p}/questions`],
    ['reorderAnswers', `${q}/answers`],
  ]) {
    await api[method]({ ...path, data: { ids: [12, 8, 15] } });
    assert.equal(calls.at(-1).url, `${parent}/reorder`);
    assert.deepEqual(JSON.parse(calls.at(-1).data), { ids: [12, 8, 15] });
  }
  const atomic = {
    questionText: '日本語',
    questionType: 'single_choice',
    points: 1,
    sortOrder: 0,
    imageMediaId: null,
    answers: [
      { id: 51, answerText: '既存', isCorrect: false },
      { answerText: '新規', isCorrect: true },
    ],
  };
  await api.updateQuestionWithAnswers({ ...path, data: atomic });
  assert.deepEqual(JSON.parse(calls.at(-1).data), atomic);
  assert.equal(await api.archive(path), undefined, '204 is not unwrapped');
});

test('publish errors retain field paths and all structured issues; conflicts retain status', async () => {
  const issue = {
    code: 'CORRECT_ANSWER_COUNT',
    message: 'Exactly one correct answer',
    path: 'sessions[2].parts[3].questions[4].answers',
    category: 'CONTENT',
    resourceIds: { examId: 1, sessionId: 2, partId: 3, questionId: 4 },
  };
  const body = {
    status: 400,
    message: 'JLPT exam is not ready for publication',
    fieldErrors: { [issue.path]: issue.message },
    timestamp: '2026-10-15T00:00:00Z',
    issues: [issue, { ...issue, code: 'ANSWERS_TOO_FEW' }],
  };
  client.defaults.adapter = async (config) => {
    throw new AxiosError(
      'Bad request',
      'ERR_BAD_REQUEST',
      config,
      undefined,
      response(config, body, 400),
    );
  };
  await assert.rejects(api.publish({ examId: 1 }), (error) => {
    const result = getAdminJlptError(error);
    assert.equal(result.status, 400);
    assert.deepEqual(result.fieldErrors, body.fieldErrors);
    assert.deepEqual(result.issues, body.issues);
    return true;
  });
  const error = new AxiosError(
    'Conflict',
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    response({}, { message: 'Unpublish the exam before editing its content' }, 409),
  );
  assert.equal(getAdminJlptError(error).status, 409);
  assert.equal(getAdminJlptError(error).message, 'Unpublish the exam before editing its content');
});

test('invalidation refreshes all admin lists/stats and affected detail/validation, keeps other exams and student caches', async () => {
  const queryClient = new QueryClient();
  const affected = [
    keys.list({ page: 0 }),
    keys.list({ page: 1, status: 'ARCHIVED' }),
    keys.stats({}),
    keys.stats({ level: 'N2' }),
    keys.detail(1),
    keys.validation(1),
  ];
  const unchanged = [keys.detail(2), keys.validation(2), ['jlpt-exams', 'detail', 1]];
  for (const key of [...affected, ...unchanged]) queryClient.setQueryData(key, { marker: true });
  await invalidateAdminJlptExam(queryClient, 1);
  for (const key of affected) assert.equal(queryClient.getQueryState(key).isInvalidated, true);
  for (const key of unchanged) assert.equal(queryClient.getQueryState(key).isInvalidated, false);
  queryClient.clear();
});

test('route IDs and URL pagination reject malformed, unsafe, negative and fractional values', () => {
  for (const id of ['0', '-1', '1.1', '1e2', 'x', '9007199254740992', ''])
    assert.equal(parseAdminJlptExamId(id), null);
  assert.equal(parseAdminJlptExamId('12'), 12);
  assert.deepEqual(
    parseAdminJlptExamQuery(
      new URLSearchParams('page=2&size=12&level=N3&status=ARCHIVED&sortKey=title&sortType=asc'),
    ),
    { page: 1, size: 12, level: 'N3', status: 'ARCHIVED', sortKey: 'title', sortType: 'ASC' },
  );
  const invalid = parseAdminJlptExamQuery(
    new URLSearchParams('page=-1&size=13&level=N6&status=BAD&sortKey=password'),
  );
  assert.deepEqual(invalid, { page: 0, size: 10, sortKey: 'updatedAt', sortType: 'DESC' });
});

test('media rejects invalid MIME, extension and size before upload and reuses one authorized client', async () => {
  assert.equal(
    validateAdminJlptMedia({ name: 'test.JPEG', type: 'image/jpeg', size: 10 }, 'image'),
    null,
  );
  assert.ok(validateAdminJlptMedia({ name: 'test.jpg', type: 'image/jpeg', size: 10 }, 'image'));
  assert.ok(validateAdminJlptMedia({ name: 'test.mp3', type: 'text/plain', size: 10 }, 'audio'));
  assert.ok(
    validateAdminJlptMedia(
      { name: 'test.wav', type: 'audio/wav', size: 20 * 1024 * 1024 + 1 },
      'audio',
    ),
  );
  const calls = [];
  client.defaults.adapter = async (config) => {
    calls.push(config);
    return response(config, { data: { id: 43, secureUrl: 'https://example.test/media' } });
  };
  await assert.rejects(
    api.uploadAudio({ file: new File(['a'], 'bad.mp3', { type: 'text/plain' }) }),
  );
  assert.equal(calls.length, 0);
  assert.equal(
    (await api.uploadAudio({ file: new File(['test'], 'sound.mp3', { type: 'audio/mpeg' }) })).id,
    43,
  );
  assert.equal(calls.at(-1).url, '/upload/audios');
  assert.equal(calls.at(-1).data.get('file').name, 'sound.mp3');
  assert.equal(
    (await api.uploadImage({ file: new File(['test'], 'image.jpeg', { type: 'image/jpeg' }) })).id,
    43,
  );
  assert.equal(calls.at(-1).url, '/upload/images');
});
