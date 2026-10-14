import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import { setImmediate } from 'node:timers/promises';
import { test } from 'node:test';
import ts from 'typescript';
import axios from 'axios';

// Exercise the actual TS modules with the existing Node test-runner convention.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function loadModules() {
  const cache = new Map();
  function load(path) {
    const file = existsSync(`${path}.ts`) ? `${path}.ts` : resolve(path, 'index.ts');
    if (cache.has(file)) return cache.get(file).exports;
    const compiledModule = { exports: {} };
    cache.set(file, compiledModule);
    const source = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
      fileName: file,
    }).outputText;
    const require = createRequire(file);
    const dependency = (name) =>
      name.startsWith('@/')
        ? load(resolve(root, name.slice(2)))
        : name.startsWith('.')
          ? load(resolve(dirname(file), name))
          : require(name);
    new Script(`(function(require,module,exports){${source}\n})`, {
      filename: file,
    }).runInThisContext()(dependency, compiledModule, compiledModule.exports);
    return compiledModule.exports;
  }
  return (path) => load(resolve(root, path));
}

const load = loadModules();
const { VideoWatchTracker, ProgressWriter } = load('features/student-lessons/utils/video-progress');
const { parseStudyId, assertLessonRoute, lessonHref } = load(
  'features/student-lessons/utils/lesson-route',
);
const sample = (currentTime, now, overrides = {}) => ({
  currentTime,
  now,
  duration: 100,
  playing: true,
  seeking: false,
  playbackRate: 1,
  ...overrides,
});

test('route IDs reject malformed, nonpositive and unsafe values', () => {
  for (const value of ['', '0', '-1', 'abc', '1e3', '1.2', 'Infinity', '9007199254740993', ' 1']) {
    assert.equal(parseStudyId(value), null, value);
  }
  assert.equal(parseStudyId('104'), 104);
  assert.equal(lessonHref(104, 207), '/student/courses/104/lessons/207');
});

test('course/lesson mismatch rejects content before optional sections can mount', () => {
  const lesson = { id: 207, courseId: 104, grammar: '<p>Saved content</p>' };
  assert.equal(assertLessonRoute(lesson, 104, 207), lesson);
  assert.throws(
    () => assertLessonRoute(lesson, 105, 207),
    (error) => error.status === 404,
  );
  assert.throws(
    () => assertLessonRoute(lesson, 104, 208),
    (error) => error.status === 404,
  );
});

test('opening or loading video metadata creates no watched time', () => {
  const tracker = new VideoWatchTracker(0);
  assert.equal(tracker.read(), null);
  tracker.sample(sample(0, 0, { playing: false }));
  tracker.sample(sample(0, 5000, { playing: false }));
  assert.equal(tracker.read(), null);
});

test('real playback accumulates on the saved baseline, but seeking does not', () => {
  const tracker = new VideoWatchTracker(40);
  tracker.sample(sample(0, 0));
  tracker.sample(sample(5, 5000));
  assert.deepEqual(tracker.read(), { watchDuration: 45, videoDuration: 100 });
  tracker.resetAnchor();
  tracker.sample(sample(80, 6000));
  assert.equal(tracker.read().watchDuration, 45);
  tracker.sample(sample(81, 7000));
  assert.equal(tracker.read().watchDuration, 46);
  tracker.sample(sample(99, 7100));
  assert.equal(
    tracker.read().watchDuration,
    46,
    'A playhead jump without a seek event is excluded too',
  );
});

test('pause/end count only the final playback delta; paused wall time does not count', () => {
  const tracker = new VideoWatchTracker(0);
  tracker.sample(sample(0, 0));
  tracker.sample(sample(5, 5000, { playing: false }));
  tracker.sample(sample(5, 50000, { playing: false }));
  assert.equal(tracker.read().watchDuration, 5);
  tracker.sample(sample(5, 60000));
  tracker.sample(sample(6, 61000));
  assert.equal(tracker.read().watchDuration, 6);
});

test('playback speed and fractional runtime are measured conservatively in whole seconds', () => {
  const tracker = new VideoWatchTracker(0);
  tracker.sample(sample(0, 0, { duration: 10.4, playbackRate: 2 }));
  tracker.sample(sample(2.4, 1200, { duration: 10.4, playbackRate: 2 }));
  assert.deepEqual(tracker.read(), { watchDuration: 2, videoDuration: 11 });
});

test('unknown or invalid runtime never produces a progress payload', () => {
  for (const duration of [0, -1, NaN, Infinity, 2_147_483_648]) {
    const tracker = new VideoWatchTracker(0);
    tracker.sample(sample(0, 0, { duration }));
    tracker.sample(sample(5, 5000, { duration }));
    assert.equal(tracker.read(), null);
  }
});

test('progress requests serialize, coalesce and suppress already-submitted values', async () => {
  const calls = [];
  let release;
  const first = new Promise((resolve) => {
    release = resolve;
  });
  const writer = new ProgressWriter(async (data) => {
    calls.push(data.watchDuration);
    if (calls.length === 1) await first;
  }, 0);
  writer.enqueue({ watchDuration: 0, videoDuration: 100 });
  writer.enqueue({ watchDuration: 15, videoDuration: 100 });
  writer.enqueue({ watchDuration: 15, videoDuration: 100 });
  writer.enqueue({ watchDuration: 30, videoDuration: 100 });
  writer.enqueue({ watchDuration: 45, videoDuration: 100 });
  assert.deepEqual(calls, [15]);
  release();
  await setImmediate();
  assert.deepEqual(calls, [15, 45]);
  writer.enqueue({ watchDuration: 40, videoDuration: 100 });
  assert.deepEqual(calls, [15, 45]);
});

test('failed saves do not retry automatically, and manual retry saves the newest sample', async () => {
  const calls = [];
  const writer = new ProgressWriter(async (data) => {
    calls.push(data.watchDuration);
    if (calls.length === 1) throw new Error('offline');
  }, 0);
  writer.enqueue({ watchDuration: 15, videoDuration: 100 });
  await setImmediate();
  writer.enqueue({ watchDuration: 30, videoDuration: 100 });
  await setImmediate();
  assert.deepEqual(calls, [15]);
  writer.retry();
  await setImmediate();
  assert.deepEqual(calls, [15, 30]);
});

test('API methods preserve paths, wrappers, optional quiz status and exact mutation bodies', async () => {
  const modules = loadModules();
  const client = modules('lib/authorize-axios').default;
  const { studyAPI, studyKeys } = modules('apis/study/study.api');
  const { vocabularyAPI, kanjiAPI, quizAPI } = modules('apis/lessons/lesson-content.api');
  assert.equal(vocabularyAPI.listStudyByLesson, studyAPI.getVocabularies);
  assert.equal(kanjiAPI.listStudyByLesson, studyAPI.getKanjis);
  assert.equal(quizAPI.getStudyByLesson, studyAPI.getQuiz);
  const calls = [];
  let quizStatus = 204;
  client.defaults.adapter = async (config) => {
    calls.push(config);
    if (config.url.endsWith('/quiz') && quizStatus === 404) {
      throw new axios.AxiosError('Unavailable', undefined, config, undefined, {
        status: 404,
        data: {},
      });
    }
    return {
      config,
      data: config.url.endsWith('/quiz') && quizStatus === 204 ? '' : { data: { id: 207 } },
      status: config.url.endsWith('/quiz') ? quizStatus : 200,
      statusText: 'OK',
      headers: {},
    };
  };
  const signal = new AbortController().signal;
  assert.deepEqual(await studyAPI.getLesson(207, signal), { id: 207 });
  assert.equal(calls[0].signal, signal);
  await studyAPI.getLessons(104);
  await studyAPI.getVocabularies(207);
  await studyAPI.getKanjis(207);
  await studyAPI.getLessonProgress(207);
  await studyAPI.getCourseProgress(104);
  assert.equal(await studyAPI.getQuiz(207), null);
  quizStatus = 404;
  await assert.rejects(studyAPI.getQuiz(207), (error) => error.response.status === 404);
  quizStatus = 200;
  assert.deepEqual(await studyAPI.getQuiz(207), { id: 207 });
  await studyAPI.answerQuestion({ lessonId: 207, quizId: 300, questionId: 400, optionId: 500 });
  await studyAPI.updateProgress({ lessonId: 207, data: { watchDuration: 80, videoDuration: 100 } });
  assert.deepEqual(
    calls.slice(0, 6).map((call) => call.url),
    [
      '/study/lessons/207',
      '/study/courses/104/lessons',
      '/study/lessons/207/vocabularies',
      '/study/lessons/207/kanjis',
      '/study/lessons/207/progress',
      '/study/courses/104/progress',
    ],
  );
  assert.equal(calls[9].method, 'post');
  assert.equal(calls[9].url, '/study/lessons/207/quiz/300/questions/400/answer');
  assert.deepEqual(calls[9].params, { optionId: 500 });
  assert.equal(calls[9].data, undefined);
  assert.deepEqual(JSON.parse(calls[10].data), { watchDuration: 80, videoDuration: 100 });
  assert.ok(calls.every((call) => call.localErrorHandling === true));
  assert.notDeepEqual(studyKeys.detail(1, 104, 207), studyKeys.detail(2, 104, 207));
  assert.notDeepEqual(studyKeys.detail(1, 104, 207), studyKeys.detail(1, 105, 207));
  assert.notDeepEqual(studyKeys.detail(1, 104, 207), studyKeys.detail(1, 104, 208));
});
