// Supply a Playwright page. All APIs/media are intercepted; no live exam is mutated.
// MCP: strip `export default ` and pass the callback source to browser_run_code_unsafe.
export default async function runAdminJlptQuestionSmoke(
  page,
  origin = 'http://localhost:3001',
  artifactDirectory,
) {
  page.removeAllListeners('dialog');
  page.on('dialog', (dialog) => dialog.accept());
  const check = (value, message) => {
    if (!value) throw new Error(message);
  };
  const media = {
    id: 43,
    originalName: '問題.png',
    secureUrl: 'https://example.test/question-image.svg',
    fileType: 'IMAGE',
  };
  const question = (id, sortOrder) => ({
    id,
    sortOrder,
    questionType: 'single_choice',
    questionText: `問題 ${id} <u>日本語</u>`,
    passageText: '<p>読み物</p>',
    explanation: '<p>説明</p>',
    points: 1.25,
    image: id === 31 ? media : null,
    answers: [0, 1, 2].map((i) => ({
      id: id * 10 + i,
      sortOrder: i,
      answerText: `答え ${i + 1}`,
      isCorrect: i === 0,
    })),
  });
  const part = {
    id: 21,
    name: '問題一',
    instructions: '一つ選びなさい。',
    sortOrder: 0,
    audio: null,
    questions: [question(31, 0), question(32, 1), question(33, 2)],
  };
  const exam = {
    id: 701,
    title: 'JLPT N3 日本語 編集試験',
    description: 'Question editor isolated test',
    level: 'N3',
    status: 'DRAFT',
    hasAttempts: false,
    contentLocked: false,
    passingScore: 95,
    sessionCount: 1,
    partCount: 1,
    questionCount: 3,
    totalTimeMinutes: 30,
    createdAt: '2026-10-15T00:00:00Z',
    updatedAt: '2026-10-15T00:00:00Z',
    sessions: [
      {
        id: 11,
        name: '言語知識',
        sessionType: 'language_knowledge',
        sortOrder: 0,
        timeLimitMinutes: 30,
        parts: [part],
      },
    ],
  };
  const state = (page.__jlptQuestion = {
    exam,
    calls: [],
    errors: [],
    failNext: null,
    detailError: false,
    mode: 'admin',
    nextId: 100,
    delay: 0,
  });
  page.on('pageerror', (error) => state.errors.push(error.message));
  await page.unroute('**/api/v1/**');
  await page.route('https://example.test/question-image.svg', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><text x="10" y="50">画像</text></svg>',
    }),
  );
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
            user: { id: 701, name: 'Question test', email: 'question@example.test' },
          });
    if (state.mode === 'denied') return fail(403, 'Access denied');
    if (path.endsWith('/stats'))
      return ok({ totalExams: 1, draftExams: 1, publishedExams: 0, archivedExams: 0 });
    if (path === '/api/v1/admin/jlpt-exams/701' && method === 'GET')
      return state.detailError ? fail(500, 'Unavailable') : ok(exam);
    const match =
      /^\/api\/v1\/admin\/jlpt-exams\/701\/sessions\/11\/parts\/21\/questions(?:\/(\d+))?\/with-answers$/.exec(
        path,
      );
    if (!match || !['POST', 'PUT'].includes(method)) return fail(404, 'Unexpected endpoint');
    if (state.delay) await new Promise((resolve) => setTimeout(resolve, state.delay));
    const failure = state.failNext;
    state.failNext = null;
    if (failure === 'field')
      return fail(400, 'Validation failed', {
        'answers[1].answerText': 'Đáp án chưa hợp lệ từ máy chủ',
      });
    if (failure === 'conflict') {
      exam.hasAttempts = true;
      exam.contentLocked = true;
      return fail(409, 'An exam with attempts is immutable');
    }
    if (failure === 'server') return fail(500, 'Unavailable');
    if (exam.status !== 'DRAFT' || exam.hasAttempts) return fail(409, 'Exam is locked');
    const existing =
      method === 'PUT' ? part.questions.find((q) => q.id === Number(match[1])) : null;
    if (method === 'PUT' && !existing) return fail(404, 'Question not found');
    check(body.questionType === 'single_choice', 'Question type');
    check(
      !Object.hasOwn(body, 'status') && !Object.hasOwn(body, 'audioMediaId'),
      'No unsupported fields',
    );
    check(
      body.answers.length >= 2 && body.answers.filter((a) => a.isCorrect).length === 1,
      'Single choice',
    );
    check(
      body.answers.every((a, i) => a.sortOrder === i && a.answerText.trim()),
      'Complete zero-based answers',
    );
    const ids = body.answers.filter((a) => a.id !== undefined).map((a) => a.id);
    check(
      new Set(ids).size === ids.length &&
        ids.every((id) => existing?.answers.some((a) => a.id === id)),
      'Answer IDs ownership',
    );
    check(body.imageMediaId === (existing?.image?.id ?? null), 'Image association preserved');
    check(
      Number.isInteger(body.sortOrder) &&
        body.sortOrder >= 0 &&
        body.sortOrder <= part.questions.length - (existing ? 1 : 0),
      'Question insertion position',
    );
    const saved = {
      id: existing?.id ?? state.nextId++,
      sortOrder: body.sortOrder,
      questionText: body.questionText.trim(),
      passageText: body.passageText,
      explanation: body.explanation,
      questionType: body.questionType,
      points: body.points,
      image: existing?.image ?? null,
      answers: body.answers.map((a, i) => ({ ...a, id: a.id ?? state.nextId++, sortOrder: i })),
    };
    if (existing) part.questions.splice(part.questions.indexOf(existing), 1);
    part.questions.splice(body.sortOrder, 0, saved);
    part.questions.forEach((q, i) => {
      q.sortOrder = i;
    });
    exam.questionCount = part.questions.length;
    if (failure === 'after-commit') return fail(500, 'Response interrupted after persistence');
    if (failure === 'read-after-save') state.detailError = true;
    return ok(saved, existing ? 200 : 201);
  });
  const base = `${origin}/admin/exams/701/sessions/11/parts/21/questions`;
  const prompt = () => page.getByLabel('Câu hỏi tiếng Nhật *', { exact: true });
  const answer = (i) => page.getByLabel(`Nội dung đáp án ${i}`, { exact: true });
  const save = () => page.getByRole('button', { name: 'Lưu câu hỏi', exact: true });
  const next = () => page.getByRole('button', { name: 'Lưu & tiếp →', exact: true });
  const writes = () =>
    state.calls.filter((c) => c.path.endsWith('/with-answers') && c.method !== 'GET');
  const ready = async () => {
    await prompt().waitFor();
    await page.waitForFunction(() => !document.querySelector('#question-questionText')?.disabled);
  };
  const fillNew = async (text) => {
    await prompt().fill(text);
    await answer(1).fill('正しい答え');
    await answer(2).fill('別の答え');
    await page.getByLabel('Chọn đáp án 1 đúng', { exact: true }).check();
  };
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${origin}/admin/exams/701`);
  await page.getByRole('link', { name: 'Thêm câu hỏi', exact: true }).click();
  await page.waitForURL(`${base}/new`);
  await ready();
  check((await page.getByRole('radio').count()) === 2, 'Fresh form has two options');
  await fillNew('新しい問題 <u>日本語</u>\n次の文を読んでください。');
  await page.getByRole('button', { name: 'Thêm đáp án', exact: true }).click();
  await answer(3).fill('三つ目');
  const correctKey = await page
    .locator('[data-answer-key]')
    .first()
    .getAttribute('data-answer-key');
  const move = page.getByRole('button', { name: 'Chuyển xuống đáp án 1', exact: true });
  await move.focus();
  await move.press('Enter');
  check(
    (await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))) ===
      'Chuyển xuống đáp án 2',
    'Reorder preserves keyboard focus',
  );
  check(
    await page.getByLabel('Chọn đáp án 2 đúng', { exact: true }).isChecked(),
    'Correct identity follows reorder',
  );
  check(
    (await page.locator('[data-answer-key]').nth(1).getAttribute('data-answer-key')) === correctKey,
    'RHF identity stable',
  );
  await page.getByRole('button', { name: 'Xóa đáp án 2', exact: true }).click();
  await save().click();
  await page.getByText('Chọn đúng một đáp án đúng.', { exact: true }).waitFor();
  check(writes().length === 0, 'Invalid complete form sends no write');
  await page.getByLabel('Chọn đáp án 1 đúng', { exact: true }).check();
  state.failNext = 'field';
  await next().click();
  await page.getByText('Đáp án chưa hợp lệ từ máy chủ', { exact: true }).waitFor();
  check(
    page.url() === `${base}/new` && (await prompt().inputValue()).includes('新しい問題'),
    'Failed create never advances or clears input',
  );
  await answer(2).fill('修正しました');
  state.delay = 250;
  const beforeCreate = writes().length;
  await save().evaluate((button) => {
    button.click();
    button.click();
  });
  await page.waitForURL(new RegExp('/questions/\\d+$'));
  check(writes().length === beforeCreate + 1, 'Duplicate create prevented');
  state.delay = 0;
  const createdId = Number(page.url().split('/').pop());
  await ready();
  await prompt().fill('作成後の編集');
  await save().click();
  await page.getByText('Đã lưu câu hỏi và toàn bộ đáp án.', { exact: true }).first().waitFor();
  check(
    writes().at(-1).method === 'PUT' && writes().at(-1).path.includes(`/${createdId}/`),
    'Save after create updates same question',
  );
  await page.reload();
  await ready();
  check((await prompt().inputValue()) === '作成後の編集', 'Created question survives refresh');

  await page.getByRole('button', { name: 'Về builder', exact: true }).click();
  await page.waitForURL(`${origin}/admin/exams/701#part-21`);
  await page
    .locator('[data-question-id="31"]')
    .getByRole('link', { name: 'Sửa câu hỏi', exact: true })
    .click();
  await ready();
  check(
    (await page.getByText('Ảnh hiện có:', { exact: false }).count()) === 1,
    'Existing image association visible',
  );
  await page.getByRole('button', { name: 'Chuyển xuống đáp án 1', exact: true }).click();
  await page.getByRole('button', { name: 'Xóa đáp án 3', exact: true }).click();
  await page.getByRole('button', { name: 'Thêm đáp án', exact: true }).click();
  await answer(3).fill('追加の答え');
  await prompt().fill('未保存の入力');
  const readsBefore = state.calls.filter(
    (c) => c.path === '/api/v1/admin/jlpt-exams/701' && c.method === 'GET',
  ).length;
  part.questions.find((q) => q.id === 31).questionText = '別の管理者による更新';
  const backgroundRead = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/v1/admin/jlpt-exams/701' &&
      response.request().method() === 'GET',
  );
  await page.evaluate(() => {
    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
  });
  await backgroundRead;
  await page.waitForFunction(() => !document.querySelector('#question-questionText')?.disabled);
  check(
    state.calls.filter((c) => c.path === '/api/v1/admin/jlpt-exams/701' && c.method === 'GET')
      .length > readsBefore,
    'Background detail refetched',
  );
  check(
    (await prompt().inputValue()) === '未保存の入力',
    'Dirty prompt survives background refetch',
  );
  await page.getByRole('button', { name: 'Về builder', exact: true }).click();
  await page.getByRole('alertdialog').waitFor();
  await page.getByRole('button', { name: 'Tiếp tục chỉnh sửa', exact: true }).click();
  check((await prompt().inputValue()) === '未保存の入力', 'Dirty exit canceled');
  check(
    await page.evaluate(
      () => !window.dispatchEvent(new Event('beforeunload', { cancelable: true })),
    ),
    'Reload warning registered',
  );
  await save().click();
  await page.getByText('Đã lưu câu hỏi và toàn bộ đáp án.', { exact: true }).first().waitFor();
  const edited = writes().at(-1).body;
  check(edited.imageMediaId === 43, 'Image retained');
  check(
    edited.answers[0].id === 311 && edited.answers[1].id === 310 && edited.answers[1].isCorrect,
    'Retained answer identity/order',
  );
  check(
    edited.answers[2].id === undefined && !edited.answers.some((a) => a.id === 312),
    'New and deleted IDs correct',
  );
  await page.reload();
  await ready();
  check(
    await page.getByLabel('Chọn đáp án 2 đúng', { exact: true }).isChecked(),
    'Persisted correctness/order',
  );
  await prompt().fill('通信失敗でも保持');
  state.failNext = 'server';
  state.detailError = true;
  await save().click();
  await page
    .getByRole('button', { name: 'Tải lại trạng thái, giữ biểu mẫu', exact: true })
    .waitFor();
  check(
    (await prompt().inputValue()) === '通信失敗でも保持' && (await save().isDisabled()),
    'Failed update and refetch preserve disabled form',
  );
  state.detailError = false;
  await page.getByRole('button', { name: 'Tải lại trạng thái, giữ biểu mẫu', exact: true }).click();
  await ready();
  check(
    (await prompt().inputValue()) === '通信失敗でも保持',
    'Retry surrounding data preserves dirty form',
  );
  await prompt().fill('次へ移動');
  state.failNext = 'field';
  await next().click();
  await page.getByText('Đáp án chưa hợp lệ từ máy chủ', { exact: true }).waitFor();
  check(page.url() === `${base}/31`, 'Failed Save & Next stays');
  await answer(2).fill('修正答え');
  await next().click();
  await page.waitForURL(`${base}/32`);
  await ready();
  check(
    (await prompt().inputValue()).includes('問題 32'),
    'Save & Next opens next authoritative sibling',
  );
  state.failNext = 'read-after-save';
  const beforeSavedReadFailure = writes().length;
  await next().click();
  await page
    .getByRole('button', { name: 'Tải thứ tự mới nhất và tiếp tục', exact: true })
    .waitFor();
  check(
    page.url() === `${base}/32` && (await save().isDisabled()),
    'Successful save with failed reconciliation does not navigate or resave',
  );
  state.detailError = false;
  await page.getByRole('button', { name: 'Tải thứ tự mới nhất và tiếp tục', exact: true }).click();
  await page.waitForURL(`${base}/33`);
  await ready();
  check(
    writes().length === beforeSavedReadFailure + 1,
    'Next navigation retries only GET after confirmed save',
  );
  await page.goto(`${base}/${createdId}`);
  await ready();
  await next().click();
  await page.waitForURL(`${base}/new`);
  await ready();
  check(
    (await prompt().inputValue()) === '' &&
      (await page.getByRole('radio', { checked: true }).count()) === 0,
    'Last question opens clean create form',
  );
  await fillNew('続けて作成');
  await page.getByLabel('Giải thích đáp án', { exact: true }).fill('前の説明');
  const readsBeforeCreateNext = state.calls.filter((c) => c.method === 'GET' && c.path === '/api/v1/admin/jlpt-exams/701').length;
  await next().click();
  await page.waitForFunction(
    () =>
      document.querySelector('#question-questionText')?.value === '' &&
      !document.querySelector('#question-questionText')?.disabled,
  );
  check(
    page.url() === `${base}/new` &&
      (await page.getByLabel('Giải thích đáp án', { exact: true }).inputValue()) === '',
    'Create Save & Next resets explanation/context without navigation duplicate',
  );
  check(state.calls.filter((c) => c.method === 'GET' && c.path === '/api/v1/admin/jlpt-exams/701').length === readsBeforeCreateNext + 1, 'Save & Next reuses the mutation detail refetch');
  await fillNew('応答が途切れた問題');
  state.failNext = 'after-commit';
  await save().click();
  await page
    .getByRole('heading', { name: 'Chưa xác nhận được kết quả tạo câu hỏi', exact: true })
    .waitFor();
  check(await save().isDisabled(), 'Ambiguous create blocks resubmission');
  const ambiguousWrites = writes().length;
  await page.getByRole('button', { name: 'Kiểm tra dữ liệu đã lưu', exact: true }).click();
  await page
    .getByText('Câu hỏi mới so với trước lần gửi (cần tự đối chiếu nội dung):', { exact: true })
    .waitFor();
  check(
    (await page.getByRole('link', { name: /Mở câu hỏi #.* trong tab mới/ }).count()) === 1 &&
      writes().length === ambiguousWrites,
    'Persisted candidate found without automatic retry',
  );
  await page.getByRole('button', { name: 'Về builder', exact: true }).click();
  await page.getByRole('button', { name: 'Bỏ thay đổi và rời trang', exact: true }).click();
  await page.waitForURL(`${origin}/admin/exams/701#part-21`);

  await page.goto(`${base}/31`);
  await ready();
  await prompt().fill('ロック前の入力');
  state.failNext = 'conflict';
  await save().click();
  await page.getByText('An exam with attempts is immutable', { exact: true }).waitFor();
  check(
    (await prompt().inputValue()) === 'ロック前の入力' && (await save().isDisabled()),
    '409 preserves input and applies refreshed attempt lock',
  );
  exam.hasAttempts = false;
  exam.contentLocked = true;
  exam.status = 'PUBLISHED';
  await page.reload();
  await prompt().waitFor();
  check(
    (await save().isDisabled()) &&
      (await page.getByRole('button', { name: 'Thêm đáp án', exact: true }).isDisabled()),
    'Published view is read-only',
  );
  exam.status = 'ARCHIVED';
  await page.reload();
  await prompt().waitFor();
  check(await save().isDisabled(), 'Archived read-only');
  exam.status = 'DRAFT';
  exam.contentLocked = false;
  await page.goto(`${base}/999`);
  await page
    .getByRole('heading', { name: 'Không tìm thấy câu hỏi hoặc phần thi', exact: true })
    .waitFor();
  await page.goto(`${origin}/admin/exams/701/sessions/999/parts/21/questions/31`);
  await page
    .getByRole('heading', { name: 'Không tìm thấy câu hỏi hoặc phần thi', exact: true })
    .waitFor();
  await page.goto(`${base}/bad`);
  await page.getByRole('heading', { name: 'Không tìm thấy đề thi', exact: true }).waitFor();
  await page.goto(`${base}/31`);
  await ready();
  if (artifactDirectory)
    await page.screenshot({
      path: `${artifactDirectory}/admin-jlpt-question-desktop.png`,
      fullPage: true,
    });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.documentElement.scrollWidth <= window.innerWidth);
  if (artifactDirectory)
    await page.screenshot({
      path: `${artifactDirectory}/admin-jlpt-question-mobile.png`,
      fullPage: true,
    });
  await prompt().fill('小画面の入力');
  await page.getByRole('link', { name: 'Đề thi', exact: true }).click();
  await page.getByRole('alertdialog').waitFor();
  await page.getByRole('button', { name: 'Tiếp tục chỉnh sửa', exact: true }).click();
  state.mode = 'denied';
  await page.reload();
  await page.getByRole('heading', { name: 'Không có quyền truy cập', exact: true }).waitFor();
  state.mode = 'anonymous';
  await page.reload();
  await page.waitForURL(/\/login\?next=/);
  check(state.errors.length === 0, `Page exceptions: ${state.errors.join(', ')}`);
  check(
    state.calls
      .filter((c) => c.method !== 'GET' && !c.path.endsWith('/with-answers'))
      .every((c) => /\/auth\//.test(c.path)),
    'All question writes atomic',
  );
  return { writes: writes().length, errors: state.errors, desktop: 1440, mobile: 390 };
}
