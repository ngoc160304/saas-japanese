// All API and media requests are intercepted. No provider or real exam is changed.
export default async function runAdminJlptLifecycleSmoke(
  page,
  origin = 'http://localhost:3001',
  artifactDirectory,
) {
  const check = (value, message) => {
    if (!value) throw new Error(message);
  };
  page.removeAllListeners('dialog');
  page.on('dialog', (dialog) => dialog.accept());
  const wav = Buffer.alloc(44 + 1600, 128);
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
  wav.writeUInt32LE(1600, 40);
  const question = (id, order) => ({
    id,
    sortOrder: order,
    questionType: 'single_choice',
    questionText: `問題 ${id} <u>日本語</u>`,
    passageText: '<p>本文\n次の文を読んでください。</p>',
    explanation: 'SECRET_EXPLANATION',
    points: 1,
    image: {
      id: 43,
      originalName: '画像',
      secureUrl: 'https://example.test/preview.png',
      fileType: 'IMAGE',
    },
    answers: [0, 1].map((i) => ({
      id: id * 10 + i,
      answerText: `選択肢 ${i + 1}`,
      isCorrect: i === 0,
      sortOrder: i,
    })),
  });
  const exam = {
    id: 701,
    title: 'JLPT N3 ライフサイクル 日本語',
    description: 'Isolated lifecycle fixture',
    level: 'N3',
    status: 'DRAFT',
    hasAttempts: false,
    contentLocked: false,
    passingScore: 95,
    sessionCount: 2,
    partCount: 2,
    questionCount: 2,
    totalTimeMinutes: 40,
    createdAt: '2026-10-15T00:00:00Z',
    updatedAt: '2026-10-15T00:00:00Z',
    sessions: [
      {
        id: 11,
        name: '読む',
        sessionType: 'reading',
        timeLimitMinutes: 30,
        sortOrder: 0,
        parts: [
          {
            id: 21,
            name: '問題一',
            instructions: '<p>一つ選んでください。</p>',
            sortOrder: 0,
            audio: {
              id: 42,
              originalName: '聴解.wav',
              secureUrl: 'https://example.test/preview.wav',
              fileType: 'AUDIO',
            },
            questions: [question(31, 0), question(32, 1)],
          },
          {
            id: 22,
            name: '空の部分',
            instructions: null,
            sortOrder: 1,
            audio: null,
            questions: [],
          },
        ],
      },
      {
        id: 12,
        name: '空のセッション',
        sessionType: 'listening',
        timeLimitMinutes: 10,
        sortOrder: 1,
        parts: [],
      },
    ],
  };
  const issue = (code, path, resourceIds, message = code) => ({
    code,
    path,
    resourceIds: { examId: 701, ...resourceIds },
    category: 'CONTENT',
    message,
  });
  const issues = [
    issue(
      'TEXT_REQUIRED',
      'sessions[11].parts[21].questions[31].answers[310].answerText',
      { sessionId: 11, partId: 21, questionId: 31, answerId: 310 },
      'Điền nội dung đáp án',
    ),
    issue(
      'MEDIA_UNAVAILABLE',
      'sessions[11].parts[21].audioMediaId',
      { sessionId: 11, partId: 21, mediaId: 50 },
      'Kiểm tra audio phần thi',
    ),
    issue(
      'COLLECTION_EMPTY',
      'sessions[12].parts',
      { sessionId: 12 },
      'Thêm phần thi trong phiên trống',
    ),
    issue(
      'TEXT_REQUIRED',
      'sessions[11].parts[21].questions[999].questionText',
      { sessionId: 11, partId: 21, questionId: 999 },
      'Tài nguyên cũ cần đối chiếu',
    ),
  ];
  const state = (page.__jlptLifecycle = {
    exam,
    issues,
    calls: [],
    errors: [],
    mode: 'admin',
    failPublish: false,
    ambiguous: null,
    delay: 0,
    validationError: false,
  });
  page.on('pageerror', (error) => state.errors.push(error.message));
  await page.unroute('**/api/v1/**');
  await page.route('https://example.test/preview.wav', (route) =>
    route.fulfill({ contentType: 'audio/wav', body: wav }),
  );
  await page.route('https://example.test/preview.png', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><text x="10" y="40">画像</text></svg>',
    }),
  );
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname,
      method = req.method();
    state.calls.push({ path, method });
    const ok = (data) =>
      route.fulfill({ json: { statusCode: 200, error: null, message: 'OK', data } });
    const fail = (status, message, extra = {}) =>
      route.fulfill({
        status,
        json: { status, message, fieldErrors: {}, timestamp: '2026-10-15T00:00:00Z', ...extra },
      });
    if (path.endsWith('/csrf')) return ok({ token: 'synthetic', headerName: 'X-XSRF-TOKEN' });
    if (path.endsWith('/refresh-token'))
      return state.mode === 'anonymous'
        ? fail(401, 'Authentication required')
        : ok({
            access_token: 'synthetic',
            tokenType: 'Bearer',
            expiresIn: 600,
            user: { id: 701, name: 'Lifecycle fixture', email: 'lifecycle@example.test' },
          });
    if (state.mode === 'denied') return fail(403, 'Access denied');
    if (path.endsWith('/stats'))
      return ok({
        totalExams: 1,
        draftExams: exam.status === 'DRAFT' ? 1 : 0,
        publishedExams: exam.status === 'PUBLISHED' ? 1 : 0,
        archivedExams: exam.status === 'ARCHIVED' ? 1 : 0,
      });
    if (path === '/api/v1/admin/jlpt-exams') {
      const status = url.searchParams.get('status');
      const visible = status ? status === exam.status : exam.status !== 'ARCHIVED';
      const currentPage = Number(url.searchParams.get('page') || 0);
      return ok({
        content: visible && currentPage === 0 ? [exam] : [],
        totalElements: visible ? 1 : 0,
        totalPages: visible ? 1 : 0,
        number: currentPage,
        size: 10,
        first: true,
        last: true,
        empty: !visible,
      });
    }
    const root = '/api/v1/admin/jlpt-exams/701';
    if (path === root && method === 'GET') return ok(exam);
    if (path === `${root}/validation`) {
      if (state.validationError) return fail(500, 'Validation unavailable');
      return ok({
        examId: 701,
        status: exam.status,
        contentValid: !state.issues.length,
        canPublish: !state.issues.length && exam.status !== 'ARCHIVED',
        hasAttempts: exam.hasAttempts,
        contentLocked: exam.contentLocked,
        totalTimeMinutes: 40,
        issues:
          exam.status === 'ARCHIVED'
            ? [
                ...state.issues,
                {
                  code: 'EXAM_ARCHIVED',
                  path: 'status',
                  category: 'LIFECYCLE',
                  message: 'Archived exams cannot be published',
                  resourceIds: { examId: 701 },
                },
              ]
            : state.issues,
      });
    }
    if (path === root && method === 'PUT') {
      if (exam.status !== 'DRAFT' || exam.hasAttempts) return fail(409, 'Exam is locked');
      Object.assign(exam, req.postDataJSON());
      exam.updatedAt = new Date().toISOString();
      return ok(exam);
    }
    if (
      (method === 'POST' && /\/(publish|unpublish)$/.test(path)) ||
      (path === root && method === 'DELETE')
    ) {
      if (state.delay) await new Promise((resolve) => setTimeout(resolve, state.delay));
      if (exam.status === 'ARCHIVED') return fail(404, 'Exam not found');
      if (path.endsWith('/publish') && state.failPublish) {
        state.failPublish = false;
        state.issues = [issues[0], issues[1]];
        return fail(400, 'Publish validation failed', { issues: state.issues });
      }
      exam.status =
        method === 'DELETE' ? 'ARCHIVED' : path.endsWith('/unpublish') ? 'DRAFT' : 'PUBLISHED';
      exam.contentLocked = exam.status !== 'DRAFT' || exam.hasAttempts;
      if (state.ambiguous) {
        state.ambiguous = null;
        return fail(500, 'Response interrupted');
      }
      if (method === 'DELETE') return route.fulfill({ status: 204 });
      return ok(exam);
    }
    return fail(404, 'Unexpected endpoint');
  });
  const builder = `${origin}/admin/exams/701`;
  const editor = `${builder}/sessions/11/parts/21/questions/31`;
  const writes = () =>
    state.calls.filter((c) => c.path.includes('/admin/jlpt-exams') && c.method !== 'GET');
  const dialog = () => page.getByRole('dialog');
  const ready = () => page.getByRole('button', { name: 'Thêm phiên thi', exact: true }).waitFor();
  const openAction = async (name) => {
    await page.getByRole('button', { name, exact: true }).click();
    await dialog().waitFor();
  };
  const confirm = (name) => dialog().getByRole('button', { name: `Xác nhận ${name}`, exact: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(builder);
  await ready();
  await page
    .getByRole('list', { name: 'Các vấn đề cần xử lý' })
    .getByRole('listitem')
    .nth(3)
    .waitFor();
  check(
    (await page
      .getByRole('list', { name: 'Các vấn đề cần xử lý' })
      .getByRole('listitem')
      .count()) === 4,
    'All readiness issues',
  );
  check(
    (await page
      .getByText('Tài nguyên đã thay đổi hoặc không còn tồn tại.', { exact: false })
      .count()) === 1,
    'Missing resource fallback',
  );
  await page.getByRole('button', { name: 'Thu gọn tất cả', exact: true }).click();
  await page.getByRole('list', { name: 'Các vấn đề cần xử lý' }).getByRole('link').nth(1).click();
  await page.waitForFunction(
    () =>
      document.querySelector('[aria-controls="part-21-body"]')?.getAttribute('aria-expanded') ===
      'true',
  );
  check(
    (await page.evaluate(() =>
      document.activeElement?.closest('[data-part-id]')?.getAttribute('data-part-id'),
    )) === '21',
    'Part issue expands and focuses',
  );
  await page.getByRole('list', { name: 'Các vấn đề cần xử lý' }).getByRole('link').first().click();
  await page.getByLabel('Câu hỏi tiếng Nhật *', { exact: true }).waitFor();
  await page.waitForFunction(
    () => document.activeElement?.closest('[id="answer-resource-310"]') !== null,
  );
  check(page.url() === `${editor}#answer-resource-310`, 'Resource answer ID navigation');
  const prompt = page.getByLabel('Câu hỏi tiếng Nhật *', { exact: true });
  await prompt.fill('未保存 <u>編集</u>\n二行目<script>window.badPreview=true</script>');
  const authorCorrect = await page.getByRole('radio', { checked: true }).getAttribute('value');
  const beforePreviewWrites = writes().length;
  await page.getByRole('button', { name: 'Preview câu hỏi', exact: true }).click();
  await dialog().getByText('Bao gồm thay đổi chưa lưu.', { exact: false }).waitFor();
  check(
    (await dialog().getByRole('radio', { checked: true }).count()) === 0,
    'Preview starts unselected',
  );
  check(!(await dialog().innerText()).includes('SECRET_EXPLANATION'), 'Preview hides explanation');
  check(!(await page.evaluate(() => window.badPreview)), 'Preview safe markup');
  await dialog().getByRole('radio').nth(1).check();
  await dialog().getByRole('button', { name: '← Về editor', exact: true }).click();
  check((await prompt.inputValue()).includes('未保存'), 'Unsaved prompt survives preview');
  check(
    (await page.getByRole('radio', { checked: true }).getAttribute('value')) === authorCorrect,
    'Correct answer unchanged',
  );
  check(writes().length === beforePreviewWrites, 'Question preview creates no writes');
  await page.getByLabel('Chọn ảnh mới', { exact: true }).setInputFiles({
    name: 'local.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCucAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await page.getByRole('button', { name: 'Preview câu hỏi', exact: true }).click();
  check(
    (await dialog().getByRole('img').getAttribute('src')).startsWith('blob:'),
    'Question preview uses current local image without uploading',
  );
  check((await dialog().locator('audio').count()) === 1, 'Parent audio shown in part context');
  check(
    (await dialog().getByRole('radio', { checked: true }).count()) === 0,
    'New preview resets selection',
  );
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Về builder', exact: true }).click();
  await page.getByRole('button', { name: 'Bỏ thay đổi và rời trang', exact: true }).click();
  await ready();

  await page.getByRole('link', { name: 'Student Preview', exact: true }).click();
  await page.getByRole('heading', { name: 'Admin preview · Toàn đề', exact: true }).waitFor();
  await page.getByRole('radio').first().waitFor();
  check(
    (await page.getByRole('radio', { checked: true }).count()) === 0,
    'Full preview starts unselected',
  );
  await page.getByRole('radio').first().check();
  check(
    !(await page.locator('main').innerText()).includes('SECRET_EXPLANATION'),
    'Full preview hides explanation',
  );
  await page.getByRole('button', { name: 'Câu tiếp →', exact: true }).click();
  await page.getByRole('article', { name: 'Preview câu 2', exact: true }).waitFor();
  await page.getByRole('combobox').nth(1).selectOption('22');
  await page.getByText('Phần thi chưa có câu hỏi.', { exact: true }).waitFor();
  await page.getByRole('combobox').first().selectOption('12');
  await page.getByText('Phiên thi chưa có phần thi.', { exact: true }).waitFor();
  await page.reload();
  await page.getByRole('radio').first().waitFor();
  check(
    (await page.getByRole('radio', { checked: true }).count()) === 0,
    'Refresh resets transient selection',
  );
  check(writes().length === beforePreviewWrites, 'Full preview creates no mutations');
  check(
    !state.calls.some((c) => /attempt|submission|student.*jlpt/.test(c.path)),
    'No attempt API requests',
  );
  if (artifactDirectory)
    await page.screenshot({ path: `${artifactDirectory}/admin-jlpt-preview-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  await page.getByRole('article').scrollIntoViewIfNeeded();
  check(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    'Preview mobile fits',
  );
  if (artifactDirectory)
    await page.screenshot({ path: `${artifactDirectory}/admin-jlpt-preview-mobile.png` });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('link', { name: '← Về builder', exact: true }).click();
  await ready();

  state.issues = [];
  await page.getByRole('button', { name: 'Kiểm tra độ sẵn sàng', exact: true }).click();
  await page.getByText('Dữ liệu đã lưu đủ điều kiện xuất bản', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Sửa thông tin đề', exact: true }).click();
  await dialog().getByLabel('Tiêu đề', { exact: false }).fill('JLPT N3 メタデータ変更');
  await dialog().getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await page.getByText('Kết quả trước đã cũ.', { exact: false }).waitFor();
  state.validationError = true;
  await page.getByRole('button', { name: 'Kiểm tra độ sẵn sàng', exact: true }).click();
  await page.getByText('Chưa xác nhận độ sẵn sàng.', { exact: false }).waitFor();
  state.validationError = false;
  await openAction('Xuất bản');
  await confirm('xuất bản').waitFor();
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[role="dialog"] button')].some(
      (b) => b.textContent === 'Xác nhận xuất bản' && !b.disabled,
    ),
  );
  if (artifactDirectory)
    await dialog().screenshot({ path: `${artifactDirectory}/admin-jlpt-lifecycle-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  check(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    'Lifecycle mobile fits',
  );
  if (artifactDirectory)
    await page.screenshot({ path: `${artifactDirectory}/admin-jlpt-lifecycle-mobile.png` });
  await page.setViewportSize({ width: 1440, height: 1000 });
  state.failPublish = true;
  await confirm('xuất bản').click();
  await dialog().getByText('Máy chủ từ chối xuất bản', { exact: false }).waitFor();
  check(
    (await dialog().getByRole('listitem').count()) === 2,
    'Publish rejection preserves multiple issues',
  );
  check(await confirm('xuất bản').isDisabled(), 'Earlier validation cannot bypass rejection');
  await dialog().getByRole('button', { name: 'Đóng', exact: true }).last().click();
  state.issues = [];
  await openAction('Xuất bản');
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[role="dialog"] button')].some(
      (b) => b.textContent === 'Xác nhận xuất bản' && !b.disabled,
    ),
  );
  state.delay = 200;
  const beforeDouble = writes().length;
  await confirm('xuất bản').evaluate((button) => {
    button.click();
    button.click();
  });
  await page.getByRole('button', { name: 'Hủy xuất bản', exact: true }).waitFor();
  check(writes().length === beforeDouble + 1, 'No duplicate lifecycle mutation');
  check(
    await page.getByRole('button', { name: 'Thêm phiên thi', exact: true }).isDisabled(),
    'Published content locked',
  );
  state.delay = 0;
  exam.hasAttempts = true;
  await openAction('Hủy xuất bản');
  await dialog().getByText('nội dung vẫn khóa sau khi hủy xuất bản', { exact: false }).waitFor();
  await confirm('hủy xuất bản').click();
  await page.getByRole('button', { name: 'Xuất bản', exact: true }).waitFor();
  check(
    await page.getByRole('button', { name: 'Thêm phiên thi', exact: true }).isDisabled(),
    'Unpublished attempted content remains locked',
  );
  check(
    !(await page.getByRole('button', { name: 'Xuất bản', exact: true }).isDisabled()),
    'Attempt lock permits republish',
  );
  await openAction('Xuất bản');
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[role="dialog"] button')].some(
      (b) => b.textContent === 'Xác nhận xuất bản' && !b.disabled,
    ),
  );
  await confirm('xuất bản').click();
  await page.getByRole('button', { name: 'Hủy xuất bản', exact: true }).waitFor();
  await page.goto(`${origin}/admin/exams?status=PUBLISHED&page=1`);
  await page.getByRole('article').waitFor();
  state.ambiguous = 'archive';
  await openAction('Lưu trữ');
  await confirm('lưu trữ').click();
  await dialog().getByText('Chưa xác nhận được kết quả yêu cầu.', { exact: false }).waitFor();
  await dialog().getByText('Trạng thái vừa tải:', { exact: false }).waitFor();
  check(
    (await dialog().innerText()).includes('ARCHIVED'),
    'Ambiguous archive refetches authoritative state',
  );
  check(await confirm('lưu trữ').isDisabled(), 'Ambiguous lifecycle cannot automatically retry');
  await dialog().getByRole('button', { name: 'Đóng', exact: true }).last().click();
  await page.getByText('Không tìm thấy đề thi phù hợp', { exact: true }).waitFor();
  check(page.url().includes('status=PUBLISHED'), 'Preserve list filters after archive');
  await page.goto(builder);
  await ready();
  check(
    (await page.getByRole('button', { name: 'Lưu trữ', exact: true }).count()) === 0,
    'No restore or archive on archived exam',
  );
  await page.getByRole('link', { name: 'Student Preview', exact: true }).click();
  await page.getByRole('radio').first().waitFor();
  // A state change after confirmation opens is still rejected by the server.
  exam.status = 'DRAFT';
  exam.contentLocked = true;
  await page.goto(builder);
  await ready();
  await openAction('Lưu trữ');
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[role="dialog"] button')].some(
      (b) => b.textContent === 'Xác nhận lưu trữ' && !b.disabled,
    ),
  );
  exam.status = 'ARCHIVED';
  await confirm('lưu trữ').click();
  await dialog().getByText('Exam not found', { exact: true }).waitFor();
  check(
    await confirm('lưu trữ').isDisabled(),
    'Archived-on-server rejection refreshes permissions',
  );
  await dialog().getByRole('button', { name: 'Đóng', exact: true }).last().click();
  // Independent fixture reset for the confirmed 204 success path, still with attempts.
  exam.status = 'DRAFT';
  await page.goto(builder);
  await ready();
  await openAction('Lưu trữ');
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[role="dialog"] button')].some(
      (b) => b.textContent === 'Xác nhận lưu trữ' && !b.disabled,
    ),
  );
  await confirm('lưu trữ').click();
  await page.getByText('Đã lưu trữ đề thi; lịch sử được giữ lại.', { exact: true }).waitFor();
  check(exam.status === 'ARCHIVED', 'Archive confirmed persistence');
  await page.getByRole('link', { name: 'Student Preview', exact: true }).click();
  await page.getByRole('radio').first().waitFor();
  state.mode = 'denied';
  await page.reload();
  await page.getByText('Không có quyền truy cập', { exact: false }).first().waitFor();
  state.mode = 'anonymous';
  await page.reload();
  await page.waitForURL(/\/login\?next=/);
  check(state.errors.length === 0, `Unexpected page errors: ${state.errors.join('; ')}`);
  return {
    writes: writes().length,
    validationReads: state.calls.filter((c) => c.path.endsWith('/validation')).length,
    errors: state.errors,
  };
}
