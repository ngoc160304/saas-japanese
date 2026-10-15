// Playwright-supplied page, no live uploads/provider calls. MCP can execute this
// callback after removing `export default `. Buffer is supplied by its runner.
export default async function runAdminJlptMediaSmoke(
  page,
  origin = 'http://localhost:3001',
  artifactDirectory,
) {
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  page.removeAllListeners('dialog');
  page.on('dialog', (dialog) => dialog.accept());
  await page.addInitScript(() => {
    const create = URL.createObjectURL.bind(URL),
      revoke = URL.revokeObjectURL.bind(URL);
    window.__mediaUrls = { active: [], revoked: [] };
    URL.createObjectURL = (file) => {
      const url = create(file);
      window.__mediaUrls.active.push(url);
      return url;
    };
    URL.revokeObjectURL = (url) => {
      window.__mediaUrls.active = window.__mediaUrls.active.filter((u) => u !== url);
      window.__mediaUrls.revoked.push(url);
      revoke(url);
    };
  });
  const png = Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 360;
      canvas.height = 180;
      const context = canvas.getContext('2d');
      context.fillStyle = '#e0f2fe';
      context.fillRect(0, 0, 360, 180);
      context.fillStyle = '#1e293b';
      context.font = '24px sans-serif';
      context.fillText('日本語の画像', 25, 95);
      return canvas.toDataURL('image/png').split(',')[1];
    }),
    'base64',
  );
  const wav = Buffer.alloc(44 + 16000, 128);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(8000, 28);
  wav.writeUInt16LE(1, 32);
  wav.writeUInt16LE(8, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(16000, 40);
  const media = (id, kind, name) => ({
    id,
    originalName: name,
    publicId: `synthetic-${id}`,
    secureUrl: `https://example.test/media/${id}.${kind === 'IMAGE' ? 'png' : 'wav'}`,
    fileType: kind,
  });
  const registry = new Map([
    [42, media(42, 'AUDIO', '聴解.wav')],
    [43, media(43, 'IMAGE', '問題.png')],
  ]);
  const question = (id, image) => ({
    id,
    questionText: `問題 ${id} <u>日本語</u>`,
    passageText: '読解',
    explanation: '説明',
    questionType: 'single_choice',
    points: 1.25,
    sortOrder: id - 31,
    image,
    answers: [0, 1, 2].map((i) => ({
      id: id * 10 + i,
      answerText: `答え ${i}`,
      isCorrect: i === 1,
      sortOrder: i,
    })),
  });
  const part = {
    id: 21,
    name: '聴解の問題',
    instructions: '説明を聞いてください。',
    sortOrder: 0,
    audio: registry.get(42),
    questions: [question(31, registry.get(43)), question(32, null)],
  };
  const exam = {
    id: 701,
    title: 'JLPT Media 日本語',
    level: 'N3',
    description: 'Isolated media smoke',
    status: 'DRAFT',
    hasAttempts: false,
    contentLocked: false,
    sessionCount: 1,
    partCount: 1,
    questionCount: 2,
    totalTimeMinutes: 30,
    passingScore: 95,
    createdAt: '2026-10-15T00:00:00Z',
    updatedAt: '2026-10-15T00:00:00Z',
    sessions: [
      {
        id: 11,
        name: '聴解',
        sessionType: 'listening',
        timeLimitMinutes: 30,
        sortOrder: 0,
        parts: [part],
      },
    ],
  };
  const state = (page.__jlptMedia = {
    exam,
    calls: [],
    errors: [],
    uploadFailure: 0,
    saveFailure: 0,
    hold: false,
    held: [],
    nextId: 100,
    mode: 'admin',
    mediaFailure: false,
  });
  let notifyHeld;
  const waitHeld = () =>
    state.held.length
      ? Promise.resolve()
      : new Promise((resolve) => {
          notifyHeld = resolve;
        });
  page.on('pageerror', (error) => state.errors.push(error.message));
  await page.unroute('**/api/v1/**');
  await page.route('https://example.test/media/**', (route) =>
    state.mediaFailure
      ? route.fulfill({ status: 404, body: '' })
      : route.fulfill({
          contentType: route.request().url().endsWith('.wav') ? 'audio/wav' : 'image/png',
          body: route.request().url().endsWith('.wav') ? wav : png,
        }),
  );
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname,
      method = req.method();
    const isUpload = path.startsWith('/api/v1/upload/');
    const body = isUpload ? null : req.postDataJSON();
    state.calls.push({ path, method, body });
    const ok = (data, status = 200) =>
      route.fulfill({ status, json: { statusCode: status, error: null, message: 'OK', data } });
    const fail = (status, fieldErrors = {}) =>
      route.fulfill({
        status,
        json: {
          status,
          message: status === 400 ? 'Validation failed' : 'Synthetic rejection',
          fieldErrors,
        },
      });
    if (path.endsWith('/csrf')) return ok({ token: 'synthetic', headerName: 'X-XSRF-TOKEN' });
    if (path.endsWith('/refresh-token'))
      return ok({
        access_token: 'synthetic',
        tokenType: 'Bearer',
        expiresIn: 600,
        user: { id: 701, name: 'Media test', email: 'media@example.test' },
      });
    if (state.mode === 'denied') return fail(403);
    if (path.endsWith('/stats'))
      return ok({ totalExams: 1, draftExams: 1, publishedExams: 0, archivedExams: 0 });
    if (method === 'GET' && path === '/api/v1/admin/jlpt-exams/701') return ok(exam);
    if (isUpload && method === 'POST') {
      check(
        ['/api/v1/upload/images', '/api/v1/upload/audios'].includes(path),
        'Exact upload paths',
      );
      check(
        /multipart\/form-data;\s*boundary=/.test(req.headers()['content-type']),
        'Browser multipart boundary',
      );
      const text = req.postDataBuffer().toString('utf8');
      check(
        (text.match(/Content-Disposition: form-data;/g) ?? []).length === 1 &&
          /name="file"; filename=/.test(text),
        'Exact multipart file field',
      );
      if (state.uploadFailure) {
        const status = state.uploadFailure;
        state.uploadFailure = 0;
        if (status === 403) state.mode = 'denied';
        return fail(status);
      }
      const name = /filename="([^"]+)"/.exec(text)[1];
      const created = media(state.nextId++, path.endsWith('/images') ? 'IMAGE' : 'AUDIO', name);
      registry.set(created.id, created);
      const response = {
        id: created.id,
        originalName: created.originalName,
        publicId: created.publicId,
        secureUrl: created.secureUrl,
      };
      if (state.hold) {
        state.held.push({ route, response });
        notifyHeld?.();
        notifyHeld = null;
        return;
      }
      return ok(response);
    }
    const match =
      /^\/api\/v1\/admin\/jlpt-exams\/701\/sessions\/11\/parts\/(\d+)\/questions(?:\/(\d+))?\/with-answers$/.exec(
        path,
      );
    const partWrite = /^\/api\/v1\/admin\/jlpt-exams\/701\/sessions\/11\/parts(?:\/(\d+))?$/.exec(
      path,
    );
    if (!match && !partWrite) return fail(404);
    if (state.saveFailure) {
      const status = state.saveFailure;
      state.saveFailure = 0;
      if (status === 409) {
        exam.status = 'PUBLISHED';
        exam.contentLocked = true;
      }
      return fail(
        status,
        status === 400
          ? match
            ? { questionText: 'Câu hỏi chưa hợp lệ' }
            : { name: 'Tên chưa hợp lệ' }
          : {},
      );
    }
    check(exam.status === 'DRAFT' && !exam.hasAttempts, 'No locked write');
    if (match) {
      const parent = exam.sessions[0].parts.find((p) => p.id === Number(match[1]));
      check(parent && ['POST', 'PUT'].includes(method), 'Question ownership/method');
      const existing = match[2] ? parent.questions.find((q) => q.id === Number(match[2])) : null;
      const saved = {
        ...body,
        id: existing?.id ?? state.nextId++,
        image: body.imageMediaId === null ? null : registry.get(body.imageMediaId),
        answers: body.answers.map((a) => ({ ...a, id: a.id ?? state.nextId++ })),
      };
      check(body.imageMediaId === null || saved.image?.fileType === 'IMAGE', 'Typed image ID');
      if (existing) parent.questions.splice(parent.questions.indexOf(existing), 1);
      parent.questions.splice(body.sortOrder, 0, saved);
      parent.questions.forEach((q, i) => {
        q.sortOrder = i;
      });
      exam.questionCount = exam.sessions[0].parts.reduce((n, p) => n + p.questions.length, 0);
      return ok(saved, existing ? 200 : 201);
    }
    const existing = partWrite[1]
      ? exam.sessions[0].parts.find((p) => p.id === Number(partWrite[1]))
      : null;
    const saved = {
      ...body,
      id: existing?.id ?? state.nextId++,
      audio: body.audioMediaId === null ? null : registry.get(body.audioMediaId),
      questions: existing?.questions ?? [],
    };
    check(body.audioMediaId === null || saved.audio?.fileType === 'AUDIO', 'Typed audio ID');
    if (existing) exam.sessions[0].parts.splice(exam.sessions[0].parts.indexOf(existing), 1);
    exam.sessions[0].parts.splice(body.sortOrder, 0, saved);
    exam.sessions[0].parts.forEach((p, i) => {
      p.sortOrder = i;
    });
    exam.partCount = exam.sessions[0].parts.length;
    return ok(saved, existing ? 200 : 201);
  });
  const base = `${origin}/admin/exams/701/sessions/11/parts/21/questions`;
  const uploads = () => state.calls.filter((c) => c.path.startsWith('/api/v1/upload/'));
  const writes = () =>
    state.calls.filter((c) => c.method !== 'GET' && c.path.includes('/admin/jlpt-exams/'));
  const saveQuestion = () => page.getByRole('button', { name: 'Lưu câu hỏi', exact: true });
  const imageInput = () => page.getByLabel('Chọn ảnh mới', { exact: true });
  const audioInput = () => page.getByLabel('Chọn audio mới', { exact: true });
  const ready = async () => {
    await imageInput().waitFor();
    await page.waitForFunction(() => !document.querySelector('input[type=file]')?.disabled);
  };
  const selectImage = (name = '新しい画像.png') =>
    imageInput().setInputFiles({ name, mimeType: 'image/png', buffer: png });
  const selectAudio = (name = '新しい聴解.wav') =>
    audioInput().setInputFiles({ name, mimeType: 'audio/wav', buffer: wav });
  const upload = () => page.getByRole('button', { name: 'Tải tệp lên', exact: true }).click();
  const staged = () => page.getByText(/Đã tải lên:.*Chưa lưu liên kết/);
  const waitSaved = async () => {
    await page.getByText('Đã lưu câu hỏi và toàn bộ đáp án.', { exact: true }).first().waitFor();
    await page.waitForFunction(() => !document.querySelector('input[type=file]')?.disabled);
  };
  const release = async () => {
    for (const item of state.held.splice(0)) {
      try {
        await item.route.fulfill({
          status: 200,
          json: { statusCode: 200, error: null, message: 'OK', data: item.response },
        });
      } catch {
        /* The browser may already have aborted this request. */
      }
    }
  };
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/31`);
  await ready();
  await page.getByLabel('Câu hỏi tiếng Nhật *', { exact: true }).fill('入力を保持する <u>問題</u>');
  await imageInput().setInputFiles({ name: 'bad.jpg', mimeType: 'image/jpeg', buffer: png });
  await page
    .getByText('Chọn ảnh .jpeg, .png, .webp hoặc .gif đúng định dạng.', { exact: true })
    .waitFor();
  check(uploads().length === 0, 'Invalid upload prevented');
  await selectImage();
  check(await saveQuestion().isDisabled(), 'Save blocked before upload');
  const localUrl = await page.locator('img[src^="blob:"]').getAttribute('src');
  check(localUrl, 'Local image preview');
  state.uploadFailure = 500;
  await upload();
  await page.getByText(/Chưa nhận được kết quả tải tệp/).waitFor();
  check(
    (await page.getByText(/Ảnh hiện có:.*#43/).count()) === 1 &&
      (await saveQuestion().isDisabled()),
    'Failed replacement preserves original association and blocks unresolved save',
  );
  await page.getByRole('button', { name: 'Thử tải lên lại', exact: true }).click();
  await staged().waitFor();
  const firstId = state.nextId - 1;
  const uploadCount = uploads().length;
  state.saveFailure = 400;
  await saveQuestion().click();
  await page.getByText(/Liên kết ảnh chưa được lưu qua yêu cầu này/).waitFor();
  check(
    (await staged().count()) === 1 &&
      (await page.getByLabel('Câu hỏi tiếng Nhật *', { exact: true }).inputValue()).includes(
        '入力',
      ),
    'Failed resource save retains staged image and content',
  );
  await saveQuestion().click();
  await waitSaved();
  check(
    uploads().length === uploadCount && writes().at(-1).body.imageMediaId === firstId,
    'Save retry reuses uploaded ID',
  );
  check(
    writes()
      .at(-1)
      .body.answers.map((a) => a.id)
      .join() === '310,311,312' && writes().at(-1).body.answers[1].isCorrect,
    'Answer IDs/correctness preserved',
  );
  check(
    await page.evaluate((url) => window.__mediaUrls.revoked.includes(url), localUrl),
    'Saved local URL revoked',
  );
  await page.reload();
  await ready();
  check(
    (await page.getByText(new RegExp(`Ảnh hiện có:.*#${firstId}`)).count()) === 1,
    'Image persistence after refresh',
  );
  await page.getByRole('button', { name: 'Tháo ảnh khi lưu', exact: true }).click();
  await saveQuestion().click();
  await waitSaved();
  check(writes().at(-1).body.imageMediaId === null, 'Explicit image removal');

  state.hold = true;
  await selectImage('古い.png');
  await upload();
  await page.getByRole('button', { name: 'Hủy tải lên', exact: true }).waitFor();
  await waitHeld();
  const staleId = state.nextId - 1;
  state.hold = false;
  await selectImage('最新.png');
  await upload();
  await staged().waitFor();
  const currentId = state.nextId - 1;
  await release();
  await saveQuestion().click();
  await waitSaved();
  check(
    currentId !== staleId && writes().at(-1).body.imageMediaId === currentId,
    'Stale upload ignored after selecting a new file',
  );
  state.hold = true;
  await selectImage('移動前.png');
  await upload();
  await page.getByRole('button', { name: 'Hủy tải lên', exact: true }).waitFor();
  await waitHeld();
  let switchedId = state.nextId - 1;
  await page.getByRole('button', { name: 'Về builder', exact: true }).click();
  await page.getByRole('button', { name: 'Tiếp tục chỉnh sửa', exact: true }).click();
  await page.getByRole('button', { name: 'Hủy tải lên', exact: true }).click();
  await page.getByText(/Đã hủy chờ tải lên/).waitFor();
  check(await saveQuestion().isDisabled(), 'Canceled file still requires retry or discard');
  await release();
  await selectImage('未完了移動.png');
  await upload();
  await waitHeld();
  switchedId = state.nextId - 1;
  await page.getByRole('button', { name: 'Về builder', exact: true }).click();
  await page.getByRole('button', { name: 'Bỏ thay đổi và rời trang', exact: true }).click();
  await page.waitForURL(/#part-21$/);
  await release();
  state.hold = false;
  await page.waitForFunction(() => window.__mediaUrls.active.length === 0);
  await page.goto(`${base}/32`);
  await ready();
  await saveQuestion().click();
  await waitSaved();
  check(
    writes().at(-1).body.imageMediaId === null && writes().at(-1).body.imageMediaId !== switchedId,
    'Upload never attaches to another question',
  );

  await page.goto(`${base}/new`);
  await ready();
  await page.getByLabel('Câu hỏi tiếng Nhật *', { exact: true }).fill('画像付きの新しい問題');
  await page.getByLabel('Nội dung đáp án 1', { exact: true }).fill('一');
  await page.getByLabel('Nội dung đáp án 2', { exact: true }).fill('二');
  await page.getByLabel('Chọn đáp án 1 đúng', { exact: true }).check();
  await selectImage();
  await upload();
  await staged().waitFor();
  const createImageId = state.nextId - 1;
  await page.getByRole('button', { name: 'Lưu & tiếp →', exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('#question-questionText')?.value === '' &&
      !document.querySelector('input[type=file]')?.disabled,
  );
  check(
    writes().at(-1).body.imageMediaId === createImageId &&
      (await staged().count()) === 0 &&
      (await page.locator('img[src^="blob:"]').count()) === 0,
    'Create Save & Next attaches image and resets next draft media',
  );
  await selectImage('戻す画像.png');
  await upload();
  await staged().waitFor();
  await page.getByRole('button', { name: 'Hoàn tác thay đổi media', exact: true }).click();
  await page.getByText('Biểu mẫu chưa có thay đổi mới', { exact: true }).waitFor();
  await page.getByLabel('Câu hỏi tiếng Nhật *', { exact: true }).fill('画像なしで作成');
  await page.getByLabel('Nội dung đáp án 1', { exact: true }).fill('一');
  await page.getByLabel('Nội dung đáp án 2', { exact: true }).fill('二');
  await page.getByLabel('Chọn đáp án 1 đúng', { exact: true }).check();
  await saveQuestion().click();
  await page.waitForURL(/\/questions\/\d+$/);
  await ready();
  check(
    writes().at(-1).body.imageMediaId === null,
    'Revert after Save & Next restores preserve command without attaching discarded media',
  );
  await page.getByRole('button', { name: 'Về builder', exact: true }).click();
  const editPart = () => page.getByRole('button', { name: 'Sửa phần thi 聴解の問題', exact: true });
  await editPart().click();
  await audioInput().waitFor();
  const dialog = page.getByRole('dialog');
  const savePart = () => dialog.getByRole('button', { name: 'Lưu thay đổi', exact: true });
  state.mediaFailure = true;
  await dialog.locator('audio').evaluate((audio) => audio.load());
  await dialog.getByText(/Không phát được audio/).waitFor();
  state.mediaFailure = false;
  await dialog.getByRole('button', { name: 'Thử tải lại media', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[role="dialog"] audio')?.readyState > 0);
  check(
    await dialog.locator('audio').evaluate((audio) => !audio.autoplay && audio.paused),
    'Audio retry loads without autoplay',
  );
  await dialog.getByLabel('Hướng dẫn', { exact: true }).fill('音声変更でもこの説明を保持。');
  const savedPartInstructions = '音声変更でもこの説明を保持。';
  await selectAudio();
  check(await savePart().isDisabled(), 'Part Save blocked before audio upload');
  const player = dialog.locator('audio[src^="blob:"]');
  await player.evaluate(async (audio) => {
    await audio.play();
    window.__oldAudio = audio;
  });
  check(await player.evaluate((audio) => !audio.paused), 'Native local playback');
  await selectAudio('次の音声.wav');
  check(
    await page.evaluate(() => window.__oldAudio.paused && window.__oldAudio.currentTime < 0.02),
    'Playback stops/resets on source replacement',
  );
  state.uploadFailure = 413;
  await upload();
  await page.getByText('Tệp vượt giới hạn dung lượng máy chủ cho phép.', { exact: true }).waitFor();
  check(
    (await dialog.getByText(/Audio hiện có:.*#42/).count()) === 1,
    'Audio failure preserves saved audio',
  );
  state.hold = true;
  await page.getByRole('button', { name: 'Thử tải lên lại', exact: true }).click();
  await waitHeld();
  await page.getByRole('button', { name: 'Hủy tải lên', exact: true }).click();
  await release();
  state.hold = false;
  await page.getByRole('button', { name: 'Thử tải lên lại', exact: true }).click();
  await staged().waitFor();
  const audioId = state.nextId - 1,
    audioUploads = uploads().length;
  await dialog.getByRole('button', { name: 'Hủy', exact: true }).click();
  await page.getByRole('button', { name: 'Tiếp tục chỉnh sửa', exact: true }).click();
  check((await staged().count()) === 1, 'Dirty audio close canceled without losing uploaded ID');
  if (artifactDirectory) {
    await page.screenshot({
      path: `${artifactDirectory}/admin-jlpt-audio-desktop.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
    await page.waitForFunction(
      () =>
        document.querySelector('[role="dialog"]')?.getBoundingClientRect().height <=
        innerHeight - 20,
    );
    await page.screenshot({
      path: `${artifactDirectory}/admin-jlpt-audio-mobile.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  state.saveFailure = 400;
  await savePart().click();
  await dialog.getByText('Tên chưa hợp lệ', { exact: true }).waitFor();
  await dialog.getByLabel('Tên phần thi *', { exact: true }).fill('聴解の問題');
  await savePart().click();
  await dialog.waitFor({ state: 'hidden' });
  check(
    writes().at(-1).body.audioMediaId === audioId &&
      writes().at(-1).body.instructions === savedPartInstructions &&
      writes().at(-1).body.sortOrder === 0 &&
      uploads().length === audioUploads,
    'Audio retry preserves part fields and uploaded ID',
  );
  await page.reload();
  await editPart().click();
  await audioInput().waitFor();
  check(
    (await page
      .getByRole('dialog')
      .getByText(new RegExp(`Audio hiện có:.*#${audioId}`))
      .count()) === 1,
    'Audio persisted after refresh',
  );
  await page.getByRole('button', { name: 'Tháo audio khi lưu', exact: true }).click();
  await savePart().click();
  await dialog.waitFor({ state: 'hidden' });
  check(
    writes().at(-1).body.audioMediaId === null &&
      writes().at(-1).body.instructions === savedPartInstructions,
    'Audio removal is null without losing instructions',
  );
  await page.getByRole('button', { name: 'Thêm phần thi', exact: true }).click();
  await audioInput().waitFor();
  await dialog.getByLabel('Tên phần thi *', { exact: true }).fill('新しい聴解');
  await selectAudio();
  await upload();
  await staged().waitFor();
  const createdAudio = state.nextId - 1;
  await savePart().click();
  await dialog.waitFor({ state: 'hidden' });
  check(
    writes().at(-1).method === 'POST' && writes().at(-1).body.audioMediaId === createdAudio,
    'New part persists uploaded audio',
  );

  await page.goto(`${base}/31`);
  await ready();
  await selectImage('日本語画像'.repeat(20) + '.png');
  await upload();
  await staged().waitFor();
  if (artifactDirectory)
    await page.screenshot({
      path: `${artifactDirectory}/admin-jlpt-media-desktop.png`,
      fullPage: true,
    });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
  if (artifactDirectory)
    await page.screenshot({
      path: `${artifactDirectory}/admin-jlpt-media-mobile.png`,
      fullPage: true,
    });
  state.saveFailure = 409;
  await saveQuestion().click();
  await page.getByText('Synthetic rejection', { exact: true }).waitFor();
  check(
    (await imageInput().isDisabled()) &&
      (await saveQuestion().isDisabled()) &&
      (await staged().count()) === 1,
    'Lock rejection preserves unpersisted upload and blocks editing',
  );
  exam.status = 'DRAFT';
  exam.hasAttempts = true;
  await page.reload();
  await imageInput().waitFor();
  check(await imageInput().isDisabled(), 'Attempt lock blocks uploads');
  exam.status = 'ARCHIVED';
  await page.reload();
  await imageInput().waitFor();
  check(
    (await imageInput().isDisabled()) && (await page.locator('img').count()) > 0,
    'Archived allows media viewing only',
  );
  exam.status = 'DRAFT';
  exam.hasAttempts = false;
  exam.contentLocked = false;
  await page.reload();
  await ready();
  state.uploadFailure = 403;
  await selectImage();
  await upload();
  await page.getByRole('heading', { name: 'Không có quyền truy cập', exact: true }).waitFor();
  check(state.errors.length === 0, JSON.stringify(state.errors));
  check(!state.calls.some((c) => c.method === 'DELETE'), 'No speculative remote cleanup');
  return { uploads: uploads().length, resourceWrites: writes().length, errors: state.errors };
}
