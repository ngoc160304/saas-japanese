import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function createLoader() {
  const cache = new Map();
  function load(path) {
    const file = existsSync(path + '.ts') ? path + '.ts' : resolve(path, 'index.ts');
    if (cache.has(file)) return cache.get(file).exports;
    const compiledModule = { exports: {} };
    cache.set(file, compiledModule);
    const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText;
    const dependency = createRequire(file);
    const localRequire = (specifier) =>
      specifier.startsWith('@/')
        ? load(resolve(root, specifier.slice(2)))
        : specifier.startsWith('.')
          ? load(resolve(dirname(file), specifier))
          : dependency(specifier);
    new Script('(function(require,module,exports){' + compiled + '\n})', {
      filename: file,
    }).runInThisContext()(localRequire, compiledModule, compiledModule.exports);
    return compiledModule.exports;
  }
  return (file) => load(resolve(root, file));
}
const encode = (data) => new TextEncoder().encode(JSON.stringify(data));

test('missing scores stay unavailable while genuine zero is preserved', () => {
  const load = createLoader();
  const { formatScore } = load('features/speaking/utils/session-events');
  const { sessionResultSchema } = load('apis/speaking/speaking.type');
  assert.equal(formatScore(null), 'Chưa có đánh giá');
  assert.equal(formatScore(undefined), 'Chưa có đánh giá');
  assert.equal(formatScore(NaN), 'Chưa có đánh giá');
  assert.equal(formatScore(0), '0');
  assert.equal(formatScore(92.4), '92');
  const result = sessionResultSchema.parse({ overall: 0, grammar: null });
  assert.equal(result.overall, 0);
  assert.equal(result.grammar, null);
  assert.equal(result.pronunciation, null);
});

test('real transcript events append without artificial pending messages and reject malformed data', () => {
  const load = createLoader();
  const { readTranscriptEvent, appendTranscript } = load('features/speaking/utils/session-events');
  const ai = readTranscriptEvent(encode({ type: 'ai_message', text: 'こんにちは' }));
  assert.deepEqual(appendTranscript([], ai, 'ai-1'), [
    { id: 'ai-1', role: 'ai', message: 'こんにちは' },
  ]);
  const user = readTranscriptEvent(encode({ type: 'user_message', text: '日本語', id: 'event-1' }));
  const first = appendTranscript([], user, 'user-1');
  assert.equal(first.length, 1);
  assert.equal(first[0].message, '日本語');
  assert.equal(appendTranscript(first, user, 'user-2'), first);
  assert.equal(readTranscriptEvent(encode({ type: 'telemetry', text: 'ignored' })), null);
  assert.throws(() => readTranscriptEvent(new TextEncoder().encode('not JSON')));
  assert.throws(() => readTranscriptEvent(encode({ type: 'user_message', text: 123 })));
});

test('ai-service paths and identity match main.py without Spring credentials or prefix', async () => {
  process.env.NEXT_PUBLIC_SPEAKING_API_URL = 'https://speaking.example.test';
  const load = createLoader();
  const client = load('lib/speaking-axios').default;
  const { speakingAPI, serializeSpeakingIdentity, speakingQueryKeys } = load(
    'apis/speaking/speaking.api',
  );
  const calls = [];
  client.defaults.adapter = async (config) => {
    calls.push(config);
    const data = config.url.endsWith('/create-room')
      ? { name: 'room-1' }
      : config.url.endsWith('/join-room')
        ? { serverUrl: 'wss://livekit.example.test', participantToken: 'test-participant' }
        : { success: true, session_result: { overall: 0, pronunciation: null } };
    return { data, status: 200, statusText: 'OK', headers: {}, config };
  };
  const room = await speakingAPI.createRoom();
  const payload = serializeSpeakingIdentity(
    { id: 42, name: 'Actual Student', email: 'student@example.test' },
    { id: 7, title: 'Persisted topic', description: 'From catalog' },
    room.name,
  );
  assert.equal(payload.user_id, '42');
  assert.equal(payload.user_name, 'Actual Student');
  assert.equal(payload.topic.id, '7');
  await speakingAPI.joinRoom(payload);
  const ended = await speakingAPI.endRoom({ room_name: room.name });
  assert.equal(ended.session_result.overall, 0);
  assert.equal(ended.session_result.pronunciation, null);
  assert.deepEqual(
    calls.map((call) => call.url),
    [
      'https://speaking.example.test/create-room',
      'https://speaking.example.test/join-room',
      'https://speaking.example.test/end-room',
    ],
  );
  for (const call of calls) {
    assert.equal(call.withCredentials, false);
    assert.equal(call.headers.get('Authorization'), undefined);
    assert.ok(!call.url.includes('/api/v1'));
  }
  assert.deepEqual(JSON.parse(calls[1].data), payload);
  assert.notDeepEqual(speakingQueryKeys.topics(42, 0), speakingQueryKeys.topics(43, 0));
});

test('missing Speaking URL and malformed connection responses fail with actionable errors', async () => {
  const load = createLoader();
  const infrastructure = load('lib/speaking-axios');
  delete process.env.NEXT_PUBLIC_SPEAKING_API_URL;
  assert.throws(infrastructure.requireSpeakingApiUrl, /NEXT_PUBLIC_SPEAKING_API_URL/);
  process.env.NEXT_PUBLIC_SPEAKING_API_URL = 'https://speaking.example.test';
  delete process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const { speakingAPI } = load('apis/speaking/speaking.api');
  infrastructure.default.defaults.adapter = async (config) => ({
    data: { participantToken: 'test' },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });
  await assert.rejects(
    speakingAPI.joinRoom({
      room_name: 'test',
      user_id: '42',
      user_name: 'Student',
      topic: { id: '7', title: 'Topic', description: 'Description' },
    }),
    /NEXT_PUBLIC_LIVEKIT_URL/,
  );
});

test('microphone/listeners release once, including scoring failure; end requests are deduplicated', async () => {
  const load = createLoader();
  const { releaseSessionMedia, endServerSession } = load(
    'features/speaking/hooks/session-resources',
  );
  let stopped = 0,
    detached = 0,
    disconnected = 0,
    requests = 0;
  const track = {
    stop() {
      stopped++;
    },
  };
  const resource = {
    roomName: 'room-1',
    microphone: track,
    endPromise: null,
    detach() {
      detached++;
    },
    room: {
      localParticipant: { trackPublications: new Map([['mic', { track }]]) },
      disconnect(stopTracks) {
        assert.equal(stopTracks, true);
        disconnected++;
        return Promise.resolve();
      },
    },
  };
  releaseSessionMedia(resource);
  releaseSessionMedia(resource);
  const end = async () => {
    requests++;
    throw new Error('Scoring unavailable');
  };
  const first = endServerSession(resource, end);
  const second = endServerSession(resource, end);
  assert.equal(first, second);
  await assert.rejects(first, /Scoring unavailable/);
  assert.equal(stopped, 1);
  assert.equal(detached, 1);
  assert.equal(disconnected, 1);
  assert.equal(requests, 1);
});
