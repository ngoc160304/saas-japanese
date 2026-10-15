// Run with a Playwright-supplied page; all API requests are intercepted, no live writes.
// For Playwright MCP, remove `export default ` and pass this callback's source.
export default async function runAdminJlptBuilderSmoke(page, origin = 'http://localhost:3001') {
  const check = (value, message) => {
    if (!value) throw new Error(message);
  };
  const media = {
    id: 42,
    originalName: '聴解.mp3',
    secureUrl: 'https://example.test/audio.mp3',
    fileType: 'AUDIO',
  };
  const question = (id, sortOrder) => ({
    id,
    sortOrder,
    questionText: `彼は毎日<u>日本語</u>を勉強します。<br>問題 ${id}<script>window.__unsafe = true</script>`,
    passageText: null,
    questionType: 'single_choice',
    explanation: null,
    points: 1.5,
    image: { ...media, id: 43, fileType: 'IMAGE' },
    answers: [
      {
        id: id * 10,
        answerText: '<ruby>日本語<rt>にほんご</rt></ruby>',
        isCorrect: true,
        sortOrder: 0,
      },
      { id: id * 10 + 1, answerText: '中国語', isCorrect: false, sortOrder: 1 },
    ],
  });
  const part = (id, sortOrder) => ({
    id,
    sortOrder,
    name: `部分 ${id}`,
    instructions: '次の文章を読んでください。\n一つ選びなさい。',
    audio: id === 21 ? media : null,
    questions: id === 21 ? [question(31, 0), question(32, 1), question(33, 2)] : [],
  });
  const exam = {
    id: 701,
    title: 'JLPT Builder 日本語'.repeat(5),
    description: '構造を管理します。\n日本語の説明。',
    level: 'N3',
    status: 'DRAFT',
    hasAttempts: false,
    contentLocked: false,
    passingScore: 95,
    createdAt: '2026-10-15T00:00:00Z',
    updatedAt: '2026-10-15T00:00:00Z',
    sessions: [11, 12, 13].map((id, sortOrder) => ({
      id,
      sortOrder,
      name: `Session ${id}`,
      sessionType: 'reading',
      timeLimitMinutes: 30,
      parts: id === 11 ? [part(21, 0), part(22, 1), part(23, 2)] : [],
    })),
  };
  const state = (page.__jlptBuilder = {
    exam,
    calls: [],
    errors: [],
    failNext: null,
    writeDelay: 0,
    nextId: 100,
    detailFailure: false,
    mode: 'admin',
  });
  page.on('pageerror', (error) => state.errors.push(error.message));
  const normalize = (rows) =>
    rows.forEach((row, index) => {
      row.sortOrder = index;
    });
  const recalculate = () => {
    exam.sessionCount = exam.sessions.length;
    exam.partCount = exam.sessions.reduce((n, s) => n + s.parts.length, 0);
    exam.questionCount = exam.sessions.reduce(
      (n, s) => n + s.parts.reduce((m, p) => m + p.questions.length, 0),
      0,
    );
    exam.totalTimeMinutes = exam.sessions.reduce((n, s) => n + s.timeLimitMinutes, 0);
  };
  recalculate();
  await page.unroute('**/api/v1/**');
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname,
      method = req.method(),
      body = req.postDataJSON();
    state.calls.push({ path, method, body });
    const ok = (data, status = 200) =>
      route.fulfill({ status, json: { statusCode: status, error: null, message: 'OK', data } });
    const fail = (status, message, fieldErrors = {}) =>
      route.fulfill({
        status,
        json: { status, message, fieldErrors, timestamp: '2026-10-15T00:00:00Z' },
      });
    if (path.endsWith('/csrf')) return ok({ token: 'synthetic', headerName: 'X-XSRF-TOKEN' });
    if (path.endsWith('/refresh-token'))
      return state.mode === 'anonymous'
        ? fail(401, 'Authentication required')
        : ok({
            access_token: 'synthetic',
            tokenType: 'Bearer',
            expiresIn: 600,
            user: { id: 701, name: 'Builder Test', email: 'builder@example.test' },
          });
    if (state.mode === 'denied') return fail(403, 'Access denied');
    if (path.endsWith('/stats'))
      return ok({ totalExams: 1, draftExams: 1, publishedExams: 0, archivedExams: 0 });
    if (path.endsWith('/jlpt-exams/701') && method === 'GET')
      return state.detailFailure ? fail(500, 'Internal error') : ok(exam);
    if (path.endsWith('/jlpt-exams/701') && method === 'PUT') {
      check(
        Object.keys(body).sort().join() === 'description,level,title',
        'Metadata leaked structure fields',
      );
      Object.assign(exam, body);
      return ok(exam);
    }
    if (method === 'OPTIONS') return route.fulfill({ status: 204 });
    const match = path.match(
      /^\/api\/v1\/admin\/jlpt-exams\/701\/sessions(?:\/(\d+))?(?:\/parts(?:\/(\d+))?)?(?:\/questions(?:\/(\d+))?)?(\/reorder)?$/,
    );
    // Session/part batch paths have reorder immediately after their collection.
    const collectionPath = path.endsWith('/reorder') ? path.slice(0, -8) : path;
    const batch = path.endsWith('/reorder');
    const ids = collectionPath.split('/').slice(6);
    const sessionId = Number(ids[1]),
      partId = Number(ids[3]),
      questionId = Number(ids[5]);
    const session = exam.sessions.find((s) => s.id === sessionId);
    const currentPart = session?.parts.find((p) => p.id === partId);
    const isQuestion = collectionPath.includes('/questions'),
      isPart = collectionPath.includes('/parts');
    if (!match && !batch) {
      state.errors.push(`Unexpected ${method} ${path}`);
      return fail(404, 'Unknown test endpoint');
    }
    if (state.writeDelay) await new Promise((resolve) => setTimeout(resolve, state.writeDelay));
    if (state.failNext) {
      const failure = state.failNext;
      state.failNext = null;
      if (failure.lock) {
        exam.hasAttempts = true;
        exam.contentLocked = true;
      }
      return fail(failure.status, failure.message || 'Validation failed', failure.fields || {});
    }
    if (exam.status === 'ARCHIVED') return fail(404, 'JLPT exam not found');
    if (exam.status === 'PUBLISHED' || exam.hasAttempts) return fail(409, 'Exam content is locked');
    if ((isPart && !session) || (isQuestion && !currentPart))
      return fail(404, 'Parent ownership mismatch');
    const rows = isQuestion ? currentPart.questions : isPart ? session.parts : exam.sessions;
    const id = isQuestion ? questionId : isPart ? partId : sessionId;
    if (batch) {
      check(method === 'PATCH', 'Reorder must be PATCH');
      check(
        body.ids.length === rows.length &&
          new Set(body.ids).size === rows.length &&
          rows.every((r) => body.ids.includes(r.id)),
        'Incomplete sibling set',
      );
      const reordered = body.ids.map((value) => rows.find((r) => r.id === value));
      rows.splice(0, rows.length, ...reordered);
      normalize(rows);
      return ok(rows);
    }
    if (method === 'DELETE') {
      const index = rows.findIndex((r) => r.id === id);
      if (index < 0) return fail(404, 'Resource not found');
      rows.splice(index, 1);
      normalize(rows);
      recalculate();
      return route.fulfill({ status: 204 });
    }
    if (method === 'POST' || method === 'PUT') {
      check(!isQuestion, 'Task 3 must not create/edit questions');
      check(
        body.sortOrder >= 0 && body.sortOrder <= rows.length - (method === 'PUT' ? 1 : 0),
        'Invalid order',
      );
      const row =
        method === 'POST'
          ? { id: state.nextId++, ...(isPart ? { questions: [], audio: null } : { parts: [] }) }
          : rows.find((r) => r.id === id);
      if (!row) return fail(404, 'Resource not found');
      if (isPart) {
        check(Object.hasOwn(body, 'audioMediaId'), 'Part save omitted audioMediaId');
        check(body.audioMediaId === (row.audio?.id ?? null), 'Unrelated edit changed audio');
        Object.assign(row, { name: body.name, instructions: body.instructions });
      } else
        Object.assign(row, {
          name: body.name,
          sessionType: body.sessionType,
          timeLimitMinutes: body.timeLimitMinutes,
        });
      if (method === 'PUT') rows.splice(rows.indexOf(row), 1);
      rows.splice(body.sortOrder, 0, row);
      normalize(rows);
      recalculate();
      return ok(row, method === 'POST' ? 201 : 200);
    }
    state.errors.push(`Unexpected ${method} ${path}`);
    return fail(404, 'Unexpected test request');
  });
  const writes = () =>
    state.calls.filter(
      (c) =>
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.method) &&
        c.path.includes('/admin/jlpt-exams'),
    );
  const waitIdle = async () => {
    await page.getByRole('button', { name: 'Thêm phiên thi', exact: true }).waitFor();
    await page.waitForFunction(
      () => !document.querySelector('button[aria-label="Sửa phiên thi Session 11"]')?.disabled,
    );
  };
  const save = () => page.getByRole('button', { name: 'Lưu thay đổi', exact: true });
  const dialog = () => page.getByRole('dialog');
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin + '/admin/exams/701');
    await waitIdle();
    check(
      state.calls.filter((c) => c.method === 'GET' && /\/sessions\//.test(c.path)).length === 0,
      'Fetched detail per row',
    );
    check(
      (await page.locator('[data-question-id="31"] u').innerText()) === '日本語',
      'Question formatting missing',
    );
    check(await page.evaluate(() => !window.__unsafe), 'Unsafe markup executed');
    const count = writes().length;
    await page
      .getByRole('button', { name: 'Chuyển lên phiên thi Session 11', exact: true })
      .click({ force: true });
    check(writes().length === count, 'First item moved outside boundary');

    // Reorder all three hierarchy levels; focus stays on the moved resource.
    // Returning from the question editor reveals a hash context once; later
    // user collapse choices must still survive authoritative tree refetches.
    await page.evaluate(() => { window.location.hash = 'part-22'; });
    await page.getByRole('button', { name: 'Thu gọn phần thi 部分 22', exact: true }).click();
    await page
      .getByRole('button', { name: 'Chuyển xuống phiên thi Session 11', exact: true })
      .click();
    await waitIdle();
    check(exam.sessions.map((s) => s.id).join() === '12,11,13', 'Session order incorrect');
    check(
      await page
        .getByRole('button', { name: 'Chuyển xuống phiên thi Session 11', exact: true })
        .evaluate((el) => el === document.activeElement),
      'Move lost keyboard focus',
    );
    await page.getByRole('button', { name: 'Chuyển xuống phần thi 部分 21', exact: true }).click();
    await waitIdle();
    check(
      exam.sessions
        .find((s) => s.id === 11)
        .parts.map((p) => p.id)
        .join() === '22,21,23',
      'Part order incorrect',
    );
    check(
      (await page
        .getByRole('button', { name: 'Mở phần thi 部分 22', exact: true })
        .getAttribute('aria-expanded')) === 'false',
      'Expansion lost on refetch',
    );
    await page.getByRole('button', { name: 'Chuyển xuống câu hỏi #31', exact: true }).click();
    await waitIdle();
    check(
      exam.sessions
        .find((s) => s.id === 11)
        .parts.find((p) => p.id === 21)
        .questions.map((q) => q.id)
        .join() === '32,31,33',
      'Question order incorrect',
    );
    await page.reload();
    await waitIdle();
    check(
      (
        await page
          .locator('[data-session-id]')
          .evaluateAll((rows) => rows.map((r) => r.dataset.sessionId))
      ).join() === '12,11,13',
      'Reload lost session order',
    );
    check(
      (
        await page
          .locator('[data-part-id]')
          .evaluateAll((rows) => rows.map((r) => r.dataset.partId))
      ).join() === '22,21,23',
      'Reload lost part order',
    );
    check(
      (
        await page
          .locator('[data-question-id]')
          .evaluateAll((rows) => rows.map((r) => r.dataset.questionId))
      ).join() === '32,31,33',
      'Reload lost question order',
    );

    // Create, client/server validation, dirty dismissal, authoritative edit and duplicate submit.
    await page.getByRole('button', { name: 'Thêm phiên thi', exact: true }).click();
    await page.getByLabel('Tên phiên thi *', { exact: true }).waitFor();
    await save().click();
    await page.getByText('Nhập tên.', { exact: true }).waitFor();
    await page.getByLabel('Tên phiên thi *', { exact: true }).fill('Session isolated');
    await page.getByLabel('Loại phiên thi *', { exact: true }).selectOption('listening');
    await page.getByLabel('Thời lượng (phút) *', { exact: true }).fill('1');
    await page.getByRole('button', { name: 'Hủy', exact: true }).click();
    await page.getByRole('button', { name: 'Tiếp tục chỉnh sửa', exact: true }).click();
    state.failNext = { status: 400, fields: { name: 'Tên bị backend từ chối' } };
    await save().click();
    await page.getByText('Tên bị backend từ chối', { exact: true }).waitFor();
    check(
      (await page.getByLabel('Tên phiên thi *', { exact: true }).inputValue()) ===
        'Session isolated',
      'Failure discarded input',
    );
    state.writeDelay = 500;
    const before = writes().length;
    await save().dblclick();
    await dialog().waitFor({ state: 'hidden' });
    check(writes().length === before + 1, 'Duplicate session write');
    state.writeDelay = 0;
    check(
      exam.sessionCount === 4 && exam.totalTimeMinutes === 91,
      'Create counts/duration incorrect',
    );
    await page.getByRole('button', { name: 'Sửa phiên thi Session isolated', exact: true }).click();
    await page.getByLabel('Thời lượng (phút) *', { exact: true }).fill('7');
    await save().click();
    await dialog().waitFor({ state: 'hidden' });
    check(exam.totalTimeMinutes === 97, 'Edit duration not persisted');
    await page
      .locator('[data-session-id="11"]')
      .getByRole('button', { name: 'Thêm phần thi', exact: true })
      .click();
    await page.getByLabel('Tên phần thi *', { exact: true }).fill('Part isolated');
    await page.getByLabel('Hướng dẫn', { exact: true }).fill('新しい説明\n改行');
    await save().click();
    await dialog().waitFor({ state: 'hidden' });
    check(exam.partCount === 4, 'Part count not updated');
    await page.getByRole('button', { name: 'Sửa phần thi 部分 21', exact: true }).click();
    await page.getByLabel('Tên phần thi *', { exact: true }).fill('Audio retained');
    await save().click();
    await dialog().waitFor({ state: 'hidden' });
    check(writes().at(-1).body.audioMediaId === 42, 'Audio association was cleared');

    // A failed reconciliation must not force closing and losing unsaved form data.
    await page.getByRole('button', { name: 'Sửa phần thi Audio retained', exact: true }).click();
    await page.getByLabel('Hướng dẫn', { exact: true }).fill('Keep after network failure');
    state.failNext = { status: 500 };
    state.detailFailure = true;
    await save().click();
    await page
      .getByRole('button', { name: 'Tải lại trạng thái, giữ biểu mẫu', exact: true })
      .waitFor();
    check(
      (await page.getByLabel('Hướng dẫn', { exact: true }).inputValue()) ===
        'Keep after network failure',
      'Failed reconciliation reset form',
    );
    state.detailFailure = false;
    await page
      .getByRole('button', { name: 'Tải lại trạng thái, giữ biểu mẫu', exact: true })
      .click();
    await page.waitForFunction(() => !document.querySelector('#structure-name')?.disabled);
    await page.getByRole('button', { name: 'Hủy', exact: true }).click();
    await page.getByRole('button', { name: 'Bỏ thay đổi', exact: true }).click();

    // Reuse task 2's metadata form from the builder.
    await page.getByRole('button', { name: 'Sửa thông tin đề', exact: true }).click();
    await page.getByLabel('Tiêu đề', { exact: false }).fill('JLPT Builder updated');
    await save().click();
    await dialog().waitFor({ state: 'hidden' });
    await page.getByRole('heading', { name: 'JLPT Builder updated', exact: true }).waitFor();

    // Reorder rejection has no optimistic reorder; reconcile current lock and retain form input.
    state.failNext = { status: 400, message: 'Include every current sibling ID exactly once' };
    const original = exam.sessions.map((s) => s.id).join();
    await page
      .getByRole('button', { name: 'Chuyển xuống phiên thi Session 12', exact: true })
      .click();
    await waitIdle();
    check(exam.sessions.map((s) => s.id).join() === original, 'Rejected move changed order');
    await page.getByRole('button', { name: 'Sửa phiên thi Session 11', exact: true }).click();
    await page.getByLabel('Tên phiên thi *', { exact: true }).fill('Unsaved session input');
    state.failNext = { status: 409, lock: true, message: 'An exam with attempts is immutable' };
    await save().click();
    await dialog()
      .getByText(/Nội dung đang nhập vẫn được giữ lại/)
      .first()
      .waitFor();
    check(
      (await page.getByLabel('Tên phiên thi *', { exact: true }).inputValue()) ===
        'Unsaved session input',
      'Conflict lost input',
    );
    check(await save().isDisabled(), 'Conflict did not enforce new lock');
    await page.getByRole('button', { name: 'Hủy', exact: true }).click();
    await page.getByRole('button', { name: 'Bỏ thay đổi', exact: true }).click();
    check(
      await page.getByRole('button', { name: 'Thêm phiên thi', exact: true }).isDisabled(),
      'Attempt lock not enforced',
    );
    exam.hasAttempts = false;
    exam.contentLocked = false;
    await page.reload();
    await waitIdle();

    // Accurate cascade confirmation; failed deletion stays open, success updates counts.
    await page.getByRole('button', { name: 'Xóa câu hỏi #31', exact: true }).click();
    await page
      .getByRole('alertdialog')
      .getByText(/2 đáp án sẽ bị xóa/)
      .waitFor();
    state.failNext = { status: 409, message: 'Concurrent update' };
    await page.getByRole('button', { name: 'Xóa vĩnh viễn', exact: true }).click();
    await page
      .getByText(/Concurrent update/)
      .first()
      .waitFor();
    check(exam.questionCount === 3, 'Rejected delete removed question');
    await page.getByRole('button', { name: 'Xóa vĩnh viễn', exact: true }).click();
    await page.getByRole('alertdialog').waitFor({ state: 'hidden' });
    check(exam.questionCount === 2, 'Question delete count incorrect');
    await page.getByRole('button', { name: 'Xóa phần thi Audio retained', exact: true }).click();
    await page
      .getByRole('alertdialog')
      .getByText(/2 câu hỏi, 4 đáp án sẽ bị xóa/)
      .waitFor();
    await page.getByRole('button', { name: 'Xóa vĩnh viễn', exact: true }).click();
    await page.getByRole('alertdialog').waitFor({ state: 'hidden' });
    check(exam.partCount === 3 && exam.questionCount === 0, 'Part cascade count incorrect');
    await page.getByRole('button', { name: 'Xóa phiên thi Session 11', exact: true }).click();
    await page
      .getByRole('alertdialog')
      .getByText(/3 phần thi, 0 câu hỏi, 0 đáp án sẽ bị xóa/)
      .waitFor();
    await page.getByRole('button', { name: 'Xóa vĩnh viễn', exact: true }).click();
    await page.getByRole('alertdialog').waitFor({ state: 'hidden' });
    check(
      exam.sessionCount === 3 && exam.partCount === 0 && exam.totalTimeMinutes === 67,
      'Session cascade duration/count incorrect',
    );
    await page.reload();
    await waitIdle();
    check(
      (await page.locator('[data-session-id="11"]').count()) === 0,
      'Reload restored deleted session',
    );

    // Read-only inspection, responsive layout, dialog scrolling and access boundary.
    for (const status of ['PUBLISHED', 'ARCHIVED']) {
      exam.status = status;
      exam.contentLocked = true;
      await page.reload();
      await page.getByRole('heading', { name: 'Cấu trúc đề thi', exact: true }).waitFor();
      check(
        await page.getByRole('button', { name: 'Thêm phiên thi', exact: true }).isDisabled(),
        `${status} allows edits`,
      );
      check((await page.locator('[data-session-id]').count()) === 3, 'Read-only tree hidden');
    }
    exam.status = 'DRAFT';
    exam.contentLocked = false;
    await page.reload();
    await waitIdle();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
      await page.getByRole('button', { name: 'Thêm phiên thi', exact: true }).click();
      await page.getByLabel('Tên phiên thi *', { exact: true }).waitFor();
      await page.waitForFunction(() => document.activeElement?.id === 'structure-name');
      check(
        await dialog().evaluate((el) => el.getBoundingClientRect().height <= innerHeight - 20),
        'Dialog exceeds viewport',
      );
      await page.keyboard.press('Escape');
      await dialog().waitFor({ state: 'hidden' });
    }
    state.mode = 'denied';
    await page.reload();
    await page.getByRole('heading', { name: 'Không có quyền truy cập', exact: true }).waitFor();
    state.mode = 'anonymous';
    await page.reload();
    await page.waitForURL((url) => url.pathname === '/login');
    check(state.errors.length === 0, JSON.stringify(state.errors));
    return {
      pass: 'CRUD sessions/parts, preserved audio, complete batch reorder at 3 levels and refresh persistence, cascade deletes, validation/conflicts/input, locks/access, focus/keyboard, desktop/mobile',
      writes: writes().length,
      errors: state.errors,
    };
  } finally {
    await page.unroute('**/api/v1/**');
  }
}
