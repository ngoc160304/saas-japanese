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
const { parseAdminJlptExamId, parseAdminJlptExamQuery, writeAdminJlptExamQuery } = load(
  resolve(root, 'features/admin-jlpt-exams/admin-jlpt-route'),
);
const { validateAdminJlptMedia } = load(resolve(root, 'apis/admin-jlpt-exams/admin-jlpt-media'));
const { uploadAPI } = load(resolve(root, 'apis/upload/upload.api'));
const { adminJlptMetadataSchema, adminJlptMetadataPayload, adminJlptMetadataLock } = load(
  resolve(root, 'features/admin-jlpt-exams/admin-jlpt-metadata'),
);
const {
  adminJlptSessionSchema,
  adminJlptPartSchema,
  adminJlptSessionPayload,
  adminJlptPartPayload,
  adminJlptContentLock,
  adminJlptMoveIds,
} = load(resolve(root, 'features/admin-jlpt-exams/admin-jlpt-structure'));
const questionEditor = load(resolve(root, 'features/admin-jlpt-exams/admin-jlpt-question'));
const preview = load(resolve(root, 'features/admin-jlpt-exams/admin-jlpt-preview'));
const { adminJlptCanTransition } = load(resolve(root, 'features/admin-jlpt-exams/admin-jlpt-policy'));
const { adminJlptIssueDestination } = load(resolve(root, 'features/admin-jlpt-exams/admin-jlpt-validation'));

test('lifecycle permissions are independent from content/metadata attempt locks', () => {
  for (const hasAttempts of [false, true]) {
    const draft = { status: 'DRAFT', hasAttempts, contentLocked: hasAttempts };
    assert.equal(adminJlptCanTransition(draft, 'publish'), true);
    assert.equal(adminJlptCanTransition(draft, 'archive'), true);
    assert.equal(adminJlptCanTransition(draft, 'unpublish'), false);
    const published = { ...draft, status: 'PUBLISHED', contentLocked: true };
    assert.equal(adminJlptCanTransition(published, 'unpublish'), true);
    assert.equal(adminJlptCanTransition(published, 'archive'), true);
    assert.equal(Boolean(adminJlptContentLock(draft)), hasAttempts);
    assert.equal(Boolean(adminJlptMetadataLock(draft)), hasAttempts);
    for (const action of ['publish', 'unpublish', 'archive'])
      assert.equal(adminJlptCanTransition({ ...draft, status: 'ARCHIVED' }, action), false);
  }
});

test('preview allowlists presentation fields, orders data and copies form options without authoring secrets', () => {
  const media = { id: 4, secureUrl: 'https://example.test/image.png', originalName: '画像', fileType: 'IMAGE' };
  const question = { id: 31, sortOrder: 0, questionText: '<u>日本語</u>', passageText: '本文', image: media,
    explanation: 'SECRET_EXPLANATION', points: 90, questionType: 'single_choice',
    answers: [{ id: 312, answerText: '乙', isCorrect: false, sortOrder: 1 }, { id: 311, answerText: '甲', isCorrect: true, sortOrder: 0 }] };
  const exam = { id: 1, title: '試験', description: null, level: 'N3', totalTimeMinutes: 40,
    status: 'DRAFT', contentLocked: false, sessions: [{ id: 11, name: '読む', sortOrder: 0, timeLimitMinutes: 40,
      parts: [{ id: 21, name: '問題', instructions: '選ぶ', sortOrder: 0, audio: null, questions: [question] }] }] };
  const model = preview.adminJlptExamPreview(exam);
  const json = JSON.stringify(model);
  for (const secret of ['isCorrect', 'explanation', 'SECRET_EXPLANATION', 'points', 'contentLocked', 'questionType'])
    assert.equal(json.includes(secret), false);
  assert.deepEqual(model.sessions[0].parts[0].questions[0].options.map((a) => a.id), ['311', '312']);
  const values = questionEditor.adminJlptQuestionValues(question);
  const baseline = structuredClone(values);
  const draft = preview.adminJlptQuestionPreview(values, { url: 'blob:owned', name: 'local', local: true });
  draft.options[0].text = 'preview only';
  assert.deepEqual(values, baseline);
  assert.equal(JSON.stringify(draft).includes('isCorrect'), false);
  assert.equal(draft.image.url, 'blob:owned');
  assert.equal(preview.adminJlptQuestionPreview(questionEditor.adminJlptQuestionValues(), null).image, null);
});

test('validation destinations use resource IDs, verify ownership and fall back after deletion', () => {
  const exam = { id: 1, sessions: [{ id: 11, name: '読む', parts: [{ id: 21, name: '問題', questions: [{ id: 31, answers: [{ id: 311 }] }] }] }] };
  const issue = { path: 'sessions[11].parts[21].questions[31].answers[311].answerText', resourceIds: { examId: 1, sessionId: 11, partId: 21, questionId: 31, answerId: 311 } };
  assert.equal(adminJlptIssueDestination(exam, issue).href, '/admin/exams/1/sessions/11/parts/21/questions/31#answer-resource-311');
  assert.equal(adminJlptIssueDestination(exam, { ...issue, resourceIds: { ...issue.resourceIds, answerId: 999 } }).missing, true);
  assert.equal(adminJlptIssueDestination(exam, { ...issue, resourceIds: { ...issue.resourceIds, questionId: 99 } }).href, '/admin/exams/1#part-21');
  assert.equal(adminJlptIssueDestination(exam, { ...issue, resourceIds: { ...issue.resourceIds, partId: 99 } }).href, '/admin/exams/1#session-11');
  assert.equal(adminJlptIssueDestination(exam, { ...issue, resourceIds: { examId: 2 } }).href, '/admin/exams/1#exam-overview');
});

test('content invalidation makes a previously valid readiness snapshot stale without auto-certifying it', async () => {
  const queryClient = new QueryClient();
  const key = keys.validation(701);
  queryClient.setQueryData(key, { canPublish: true, issues: [] });
  await invalidateAdminJlptExam(queryClient, 701);
  assert.equal(queryClient.getQueryState(key).isInvalidated, true);
  assert.equal(queryClient.getQueryData(key).canPublish, true); // retained history is not fresh proof
  queryClient.clear();
});

test('single-choice editor validates text, scores, positions, correctness and duplicate identities', () => {
  const values = questionEditor.adminJlptQuestionValues();
  values.questionText = '彼は<u>日本語</u>を勉強します。\n一つ選んでください。';
  values.answers = [{ answerText: '日本', isCorrect: true }, { answerText: '中国', isCorrect: false }];
  assert.equal(questionEditor.adminJlptQuestionSchema.safeParse(values).success, true);
  for (const patch of [
    { points: 0 }, { points: 1000 }, { points: 0.001 }, { points: NaN },
    { position: 0 }, { position: 1.2 }, { questionText: '<p>&nbsp;</p>' },
    { questionText: '<script>alert(1)</script>' }, { questionText: 'x'.repeat(20001) },
    { passageText: 'x'.repeat(50001) }, { explanation: 'x'.repeat(20001) },
    { answers: [{ answerText: '日', isCorrect: true }] },
    { answers: values.answers.map((a) => ({ ...a, isCorrect: true })) },
    { answers: values.answers.map((a) => ({ ...a, isCorrect: false })) },
    { answers: values.answers.map((a) => ({ ...a, answerId: 1 })) },
    { answers: [{ answerText: '<br>', isCorrect: true }, values.answers[1]] },
    { answers: [{ answerText: 'x'.repeat(501), isCorrect: true }, values.answers[1]] },
  ]) assert.equal(questionEditor.adminJlptQuestionSchema.safeParse({ ...values, ...patch }).success, false);
  assert.equal(questionEditor.adminJlptQuestionSchema.safeParse({ ...values, points: 999.99 }).success, true);
  assert.equal(questionEditor.adminJlptQuestionSchema.safeParse({ ...values, answers: [...values.answers, ...Array.from({ length: 100 }, () => ({ answerText: '追加', isCorrect: false }))] }).success, true);
});

test('atomic payload preserves retained IDs and media, omits deleted/new IDs, and assigns contiguous order', () => {
  const existing = { id: 31, questionText: '日本語', passageText: null, explanation: null, questionType: 'single_choice', points: 1, sortOrder: 2, image: { id: 43 }, answers: [
    { id: 310, answerText: 'A', isCorrect: true, sortOrder: 0 },
    { id: 311, answerText: 'B', isCorrect: false, sortOrder: 1 },
    { id: 312, answerText: 'C', isCorrect: false, sortOrder: 2 },
  ] };
  const values = questionEditor.adminJlptQuestionValues(existing);
  values.answers = [values.answers[2], values.answers[0], { answerText: '新規', isCorrect: false }];
  const payload = questionEditor.adminJlptUpdateQuestionPayload(values, existing);
  assert.equal(payload.imageMediaId, 43);
  assert.equal(payload.sortOrder, 2);
  assert.deepEqual(payload.answers, [
    { id: 312, answerText: 'C', isCorrect: false, sortOrder: 0 },
    { id: 310, answerText: 'A', isCorrect: true, sortOrder: 1 },
    { answerText: '新規', isCorrect: false, sortOrder: 2 },
  ]);
  assert.throws(() => questionEditor.adminJlptCreateQuestionPayload(values));
  assert.throws(() => questionEditor.adminJlptUpdateQuestionPayload({ ...values, answers: [values.answers[0], values.answers[0]] }, existing));
  assert.throws(() => questionEditor.adminJlptUpdateQuestionPayload({ ...values, answers: [{ answerId: 999, answerText: '他', isCorrect: true }] }, existing));
  const fresh = questionEditor.adminJlptQuestionValues(undefined, 3);
  assert.equal(fresh.position, 4);
  assert.equal(fresh.explanation, '');
  assert.equal(fresh.answers.some((a) => a.isCorrect || a.answerId !== undefined), false);
  const create = questionEditor.adminJlptCreateQuestionPayload(fresh);
  assert.equal(create.imageMediaId, null);
  assert.equal(create.answers.every((a) => !Object.hasOwn(a, 'id')), true);
  values.answers.splice(1, 1); // Removing the correct answer requires a new selection.
  assert.equal(questionEditor.adminJlptQuestionSchema.safeParse(values).success, false);
});

test('question routes verify every ancestor and Save & Next uses authoritative order', () => {
  const questions = [{ id: 33, sortOrder: 2 }, { id: 31, sortOrder: 0 }, { id: 32, sortOrder: 1 }];
  const exam = { id: 1, sessions: [{ id: 11, parts: [{ id: 21, questions }] }] };
  const target = { examId: 1, sessionId: 11, partId: 21, questionId: 31 };
  assert.equal(questionEditor.adminJlptQuestionContext(exam, target).question.id, 31);
  for (const patch of [{ examId: 2 }, { sessionId: 12 }, { partId: 22 }, { questionId: 99 }])
    assert.equal(questionEditor.adminJlptQuestionContext(exam, { ...target, ...patch }), null);
  assert.equal(questionEditor.adminJlptNextQuestion({ questions }, 31).id, 32);
  assert.equal(questionEditor.adminJlptNextQuestion({ questions }, 33), undefined);
  assert.throws(() => questionEditor.adminJlptNextQuestion({ questions }, 99));
  assert.equal(questionEditor.adminJlptQuestionUrl(target), '/admin/exams/1/sessions/11/parts/21/questions/31');
  assert.equal(questionEditor.adminJlptQuestionUrl({ ...target, questionId: undefined }), '/admin/exams/1/sessions/11/parts/21/questions/new');
  assert.equal(questionEditor.adminJlptBuilderUrl(target), '/admin/exams/1#part-21');
  assert.equal(questionEditor.adminJlptQuestionErrorPath('answers[1].answerText', 3), 'answers.1.answerText');
  assert.equal(questionEditor.adminJlptQuestionErrorPath('answers[1].isCorrect', 3), 'answers.1.isCorrect');
  assert.equal(questionEditor.adminJlptQuestionErrorPath('answers[3].answerText', 3), null);
  assert.equal(questionEditor.adminJlptQuestionErrorPath('sortOrder', 3), 'position');
});

test('builder forms follow session/part bounds and translate human positions at the payload boundary', () => {
  const session = {
    kind: 'session',
    name: ' 読解 ',
    sessionType: 'reading',
    timeLimitMinutes: 1,
    position: 1,
  };
  assert.equal(adminJlptSessionSchema.safeParse(session).success, true);
  for (const patch of [
    { name: ' ' },
    { name: 'x'.repeat(151) },
    { sessionType: 'READING' },
    { timeLimitMinutes: 0 },
    { timeLimitMinutes: 181 },
    { timeLimitMinutes: 1.5 },
    { position: 0 },
    { position: 1.5 },
  ])
    assert.equal(adminJlptSessionSchema.safeParse({ ...session, ...patch }).success, false);
  assert.deepEqual(adminJlptSessionPayload(session), {
    name: '読解',
    sessionType: 'reading',
    timeLimitMinutes: 1,
    sortOrder: 0,
  });
  const part = {
    kind: 'part',
    name: ' Mondai ',
    instructions: ' 読んでください。\n次の問題 ',
    position: 3,
  };
  assert.equal(adminJlptPartSchema.safeParse(part).success, true);
  assert.equal(
    adminJlptPartSchema.safeParse({ ...part, instructions: 'x'.repeat(10001) }).success,
    false,
  );
  assert.deepEqual(adminJlptPartPayload(part, { audio: { id: 42 } }), {
    name: 'Mondai',
    instructions: '読んでください。\n次の問題',
    sortOrder: 2,
    audioMediaId: 42,
  });
  assert.equal(adminJlptPartPayload({ ...part, instructions: ' ' }).instructions, null);
  assert.equal(adminJlptPartPayload(part, { audio: null }).audioMediaId, null);
});

test('builder moves send every sibling exactly once, preserve input, and reject boundaries', () => {
  const siblings = [{ id: 8 }, { id: 12 }, { id: 3 }];
  assert.deepEqual(adminJlptMoveIds(siblings, 12, -1), [12, 8, 3]);
  assert.deepEqual(adminJlptMoveIds(siblings, 12, 1), [8, 3, 12]);
  assert.equal(adminJlptMoveIds(siblings, 8, -1), null);
  assert.equal(adminJlptMoveIds(siblings, 3, 1), null);
  assert.equal(adminJlptMoveIds(siblings, 99, -1), null);
  assert.equal(adminJlptMoveIds([], 99, 1), null);
  assert.deepEqual(siblings, [{ id: 8 }, { id: 12 }, { id: 3 }]);
});

test('builder respects explicit status and attempts even if contentLocked is inconsistent', () => {
  const draft = { status: 'DRAFT', hasAttempts: false, contentLocked: false };
  assert.equal(adminJlptContentLock(draft), null);
  for (const patch of [
    { status: 'PUBLISHED' },
    { status: 'ARCHIVED' },
    { hasAttempts: true },
    { contentLocked: true },
  ])
    assert.equal(typeof adminJlptContentLock({ ...draft, ...patch }), 'string');
});
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

test('list URL round trips filters, indexing and size; canonicalization/reset preserve unrelated state', () => {
  const original = new URLSearchParams(
    'tab=library&page=3&size=12&search=%20日本語%20&level=N3&status=DRAFT&sortKey=title&sortType=ASC',
  );
  const state = parseAdminJlptExamQuery(original);
  assert.equal(state.page, 2);
  const canonical = writeAdminJlptExamQuery(original, state);
  assert.equal(canonical.get('tab'), 'library');
  assert.equal(canonical.get('page'), '3');
  assert.deepEqual(parseAdminJlptExamQuery(canonical), state);
  const reset = writeAdminJlptExamQuery(canonical, {
    ...state,
    search: undefined,
    level: undefined,
    status: undefined,
    page: 0,
    size: 10,
  });
  assert.equal(reset.has('search'), false);
  assert.equal(reset.has('level'), false);
  assert.equal(reset.has('status'), false);
  assert.equal(reset.has('page'), false);
  assert.equal(reset.has('size'), false);
  assert.equal(reset.get('sortKey'), 'title');
  assert.equal(reset.get('tab'), 'library');
  const malformed = new URLSearchParams('tab=keep&page=1e2&size=99&level=N6&status=published');
  const fixed = writeAdminJlptExamQuery(malformed, parseAdminJlptExamQuery(malformed));
  assert.equal(fixed.toString(), 'tab=keep');
  for (const size of [1, 5, 10, 12])
    assert.equal(parseAdminJlptExamQuery(new URLSearchParams(`size=${size}`)).size, size);
});

test('metadata schema validates backend bounds and payload excludes lifecycle/derived fields', () => {
  assert.equal(
    adminJlptMetadataSchema.safeParse({ title: '   ', level: 'N3', description: '' }).success,
    false,
  );
  assert.equal(
    adminJlptMetadataSchema.safeParse({ title: 'x'.repeat(201), level: 'N3', description: '' })
      .success,
    false,
  );
  assert.equal(
    adminJlptMetadataSchema.safeParse({ title: 'Test', level: 'N6', description: '' }).success,
    false,
  );
  assert.equal(
    adminJlptMetadataSchema.safeParse({ title: 'Test', level: 'N3', description: 'x'.repeat(501) })
      .success,
    false,
  );
  const parsed = adminJlptMetadataSchema.parse({
    title: '  日本語  ',
    level: 'N3',
    description: '  ',
    status: 'PUBLISHED',
    passingScore: 1,
    totalTimeMinutes: 10,
  });
  assert.deepEqual(adminJlptMetadataPayload(parsed), {
    title: '日本語',
    level: 'N3',
    description: null,
  });
});

test('metadata permissions follow whole-exam PUT restrictions, including inconsistent/stale flags', () => {
  assert.equal(
    adminJlptMetadataLock({ status: 'DRAFT', hasAttempts: false, contentLocked: false }),
    null,
  );
  assert.ok(
    adminJlptMetadataLock({ status: 'PUBLISHED', hasAttempts: false, contentLocked: false }),
  );
  assert.ok(
    adminJlptMetadataLock({ status: 'ARCHIVED', hasAttempts: false, contentLocked: false }),
  );
  assert.ok(adminJlptMetadataLock({ status: 'DRAFT', hasAttempts: true, contentLocked: false }));
  assert.ok(adminJlptMetadataLock({ status: 'DRAFT', hasAttempts: false, contentLocked: true }));
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

test('media validates exact MIME/extension pairs, names and byte bounds from the backend', () => {
  for (const [name, type, kind, size] of [
    ['a.jpeg', 'image/jpeg', 'image', 10 * 1024 * 1024],
    ['a.png', 'image/png', 'image', 1], ['a.webp', 'image/webp', 'image', 1],
    ['a.GIF', 'IMAGE/GIF; charset=binary', 'image', 1],
    ['a.mp3', 'audio/mpeg', 'audio', 20 * 1024 * 1024],
    ['a.wav', 'audio/wav', 'audio', 1], ['a.WAV', 'audio/x-wav', 'audio', 1],
    ['a.wav', 'audio/wave; charset=binary', 'audio', 1],
  ]) assert.equal(validateAdminJlptMedia({ name, type, size }, kind), null);
  for (const [name, type, kind, size] of [
    ['jpeg', 'image/jpeg', 'image', 1], ['.mp3', 'audio/mpeg', 'audio', 1],
    ['a.jpg', 'image/jpeg', 'image', 1], ['a.png', 'image/jpeg', 'image', 1],
    ['a.svg', 'image/svg+xml', 'image', 1], ['a.mp3', 'audio/mp3', 'audio', 1],
    ['a.ogg', 'audio/ogg', 'audio', 1], ['a.png', 'image/png', 'image', 0],
    ['a.png', 'image/png', 'image', 10 * 1024 * 1024 + 1],
    ['a.wav', 'audio/wav', 'audio', 20 * 1024 * 1024 + 1],
    ['x'.repeat(252) + '.png', 'image/png', 'image', 1],
  ]) assert.ok(validateAdminJlptMedia({ name, type, size }, kind));
});

test('media attachment payloads distinguish preserve, replace and explicit null without changing other fields', () => {
  const existing = { id: 31, questionText: '日本語', passageText: '文', explanation: '説明', points: 1.25, sortOrder: 2, image: { id: 43 }, answers: [
    { id: 310, answerText: '正', isCorrect: true, sortOrder: 0 }, { id: 311, answerText: '他', isCorrect: false, sortOrder: 1 },
  ] };
  const values = questionEditor.adminJlptQuestionValues(existing);
  const preserved = questionEditor.adminJlptUpdateQuestionPayload(values, existing);
  for (const id of [null, 81]) {
    const result = questionEditor.adminJlptUpdateQuestionPayload({ ...values, imageMediaId: id }, existing);
    assert.deepEqual(result, { ...preserved, imageMediaId: id });
  }
  assert.equal(preserved.imageMediaId, 43);
  assert.equal(questionEditor.adminJlptCreateQuestionPayload({ ...values, imageMediaId: 82, answers: values.answers.map(({ answerId: _answerId, ...a }) => a) }).imageMediaId, 82);
  const part = { kind: 'part', name: '聴解', instructions: '説明', position: 3 };
  const original = adminJlptPartPayload(part, { audio: { id: 42 } });
  assert.equal(original.audioMediaId, 42);
  for (const id of [null, 84]) assert.deepEqual(adminJlptPartPayload({ ...part, audioMediaId: id }, { audio: { id: 42 } }), { ...original, audioMediaId: id });
});

test('uploads preserve legacy image wrapper/audio callbacks and forward cancellation, timeout and indeterminate progress', async () => {
  const controller = new AbortController();
  const calls = [], progress = [], legacyProgress = [];
  client.defaults.adapter = async (config) => {
    calls.push(config);
    config.onUploadProgress?.({ loaded: 10 });
    config.onUploadProgress?.({ loaded: 10, total: 20 });
    return response(config, { data: { id: 92, originalName: 'a.png', publicId: 'synthetic', secureUrl: 'https://example.test/a.png' } });
  };
  const file = new File(['synthetic'], 'a.png', { type: 'image/png' });
  assert.equal((await uploadAPI.uploadImage(file)).data.id, 92);
  const normalized = await api.uploadImage({ file, signal: controller.signal, onProgress: (p) => progress.push(p) });
  assert.equal(normalized.id, 92);
  assert.equal(normalized.secureUrl, 'https://example.test/a.png');
  assert.deepEqual(progress, [null, 50]);
  assert.equal(calls.at(-1).signal, controller.signal);
  assert.equal(calls.at(-1).timeout, 120000);
  assert.equal(calls.at(-1).localErrorHandling, true);
  assert.deepEqual([...calls.at(-1).data.keys()], ['file']);
  await uploadAPI.uploadAudio(new File(['synthetic'], 'a.wav', { type: 'audio/wav' }), (p) => legacyProgress.push(p), { signal: controller.signal });
  assert.deepEqual(legacyProgress, [50]);
  assert.equal(calls.at(-1).signal, controller.signal);
  let attempts = 0;
  client.defaults.adapter = async (config) => { attempts++; throw new AxiosError('synthetic failure', 'ERR_BAD_RESPONSE', config, null, response(config, {}, 500)); };
  await assert.rejects(api.uploadImage({ file }));
  assert.equal(attempts, 1, 'No automatic upload retry');
  controller.abort();
  attempts = 0;
  await assert.rejects(api.uploadImage({ file, signal: controller.signal }), { code: 'ERR_CANCELED' });
  assert.equal(attempts, 0, 'An already canceled signal must not start a request');
});
