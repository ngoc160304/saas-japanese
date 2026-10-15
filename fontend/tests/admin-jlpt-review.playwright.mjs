// UI integration review: isolated browser context, all backend/media responses mocked.
// No credentials, remote uploads, attempts, or live resource writes are used.
export default async function runAdminJlptReview(
  page,
  origin = 'http://localhost:3000',
  artifactDirectory,
) {
  const check = (value, message) => {
    if (!value) throw new Error(message);
  };
  const table = `<table><tbody><tr>${Array.from({ length: 48 }, (_, i) => `<td>列${i + 1}日本語の長い内容</td>`).join('')}</tr></tbody></table>`;
  const question = {
    id: 31,
    questionType: 'single_choice',
    sortOrder: 0,
    points: 1.25,
    questionText: `<p>日本語の質問。次の表を読んでください。</p>${table}`,
    passageText: '<ruby>日本語<rt>にほんご</rt></ruby>\n改行を含む本文。',
    explanation: 'AUTHOR_ONLY_EXPLANATION',
    image: null,
    answers: Array.from({ length: 24 }, (_, i) => ({
      id: 310 + i,
      answerText: `選択肢 ${i + 1}：日本語の長い回答。`.repeat(5),
      isCorrect: i === 0,
      sortOrder: i,
    })),
  };
  const exam = {
    id: 701,
    title: 'JLPT N3 '.concat('長い日本語の試験タイトル'.repeat(9)),
    description: '説明文\n'.repeat(45),
    level: 'N3',
    status: 'DRAFT',
    hasAttempts: false,
    contentLocked: false,
    passingScore: 95,
    totalTimeMinutes: 30,
    sessionCount: 1,
    partCount: 1,
    questionCount: 1,
    createdAt: '2026-10-15T00:00:00Z',
    updatedAt: '2026-10-15T00:00:00Z',
    sessions: [
      {
        id: 11,
        name: '言語知識と読解'.repeat(15),
        sessionType: 'reading',
        timeLimitMinutes: 30,
        sortOrder: 0,
        parts: [
          {
            id: 21,
            name: '問題と長い見出し'.repeat(15),
            instructions: `一つ選んでください。\n${table}`,
            sortOrder: 0,
            audio: null,
            questions: [question],
          },
        ],
      },
    ],
  };
  const state = (page.__jlptReview = {
    calls: [],
    errors: [],
    validationRelease: null,
    holdValidation: false,
    ready: false,
  });
  page.on('pageerror', (error) => state.errors.push(error.message));
  await page.unroute('**/api/v1/**');
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname,
      method = request.method();
    state.calls.push({ path, method });
    const ok = (data) =>
      route.fulfill({ json: { statusCode: 200, error: null, message: 'OK', data } });
    if (path.endsWith('/csrf')) return ok({ token: 'synthetic', headerName: 'X-XSRF-TOKEN' });
    if (path.endsWith('/refresh-token'))
      return ok({
        access_token: 'synthetic',
        tokenType: 'Bearer',
        expiresIn: 600,
        user: { id: 701, name: 'Isolated UI fixture', email: 'ui@example.test' },
      });
    if (path.endsWith('/validation')) {
      const snapshot = {
        examId: 701,
        status: 'DRAFT',
        contentValid: state.ready,
        canPublish: state.ready,
        hasAttempts: false,
        contentLocked: false,
        totalTimeMinutes: 30,
        issues: [],
      };
      if (state.holdValidation) {
        state.holdValidation = false;
        await new Promise((resolve) => {
          state.validationRelease = resolve;
        });
      }
      return ok(snapshot);
    }
    if (path.endsWith('/stats'))
      return ok({ totalExams: 3, draftExams: 3, publishedExams: 0, archivedExams: 0 });
    if (path.endsWith('/admin/jlpt-exams')) {
      const { sessions: _sessions, ...summary } = exam;
      return ok({
        content: [summary, { ...summary, id: 702 }, { ...summary, id: 703 }],
        number: 0,
        size: 10,
        numberOfElements: 3,
        totalElements: 3,
        totalPages: 1,
        first: true,
        last: true,
        empty: false,
      });
    }
    if (path.endsWith('/admin/jlpt-exams/701') && method === 'GET') return ok(exam);
    if (path.endsWith('/admin/jlpt-exams/701') && method === 'PUT') {
      Object.assign(exam, request.postDataJSON());
      exam.updatedAt = '2026-10-15T13:00:00Z';
      return ok(exam);
    }
    throw new Error(`Unexpected review request ${method} ${path}`);
  });
  const fit = async (label) => {
    // Shell width transitions and font/layout changes settle after viewport switches.
    await page
      .waitForFunction(() => document.documentElement.scrollWidth <= innerWidth, null, { timeout: 3000 })
      .catch(() => {});
    await page.waitForTimeout(100);
    const overflow = await page.evaluate(() => ({
      width: innerWidth,
      actual: document.documentElement.scrollWidth,
    }));
    if (overflow.actual > overflow.width && artifactDirectory)
      await page.screenshot({ path: `${artifactDirectory}/admin-jlpt-overflow-before.png` });
    check(
      overflow.actual <= overflow.width,
      `${label}: page overflow ${overflow.actual} > ${overflow.width}`,
    );
  };
  const builder = `${origin}/admin/exams/701`;
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${origin}/admin/exams`);
  await page.getByRole('article').nth(2).waitFor();
  for (const width of [1440, 820, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await fit(`List ${width}`);
    if (artifactDirectory)
      await page
        .locator('main')
        .screenshot({ path: `${artifactDirectory}/admin-jlpt-final-list-${width}.png` });
  }
  check(!state.calls.some((c) => /jlpt-exams\/\d+$/.test(c.path)), 'No per-card detail reads');
  await page.goto(builder);
  await page.getByRole('button', { name: 'Thêm phiên thi', exact: true }).waitFor();
  for (const width of [1440, 820, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await fit(`Builder ${width}`);
    if (artifactDirectory)
      await page
        .locator('[data-session-id="11"]')
        .screenshot({ path: `${artifactDirectory}/admin-jlpt-final-builder-${width}.png` });
  }
  await page.getByRole('link', { name: 'Student Preview', exact: true }).click();
  await page.getByRole('radio').first().waitFor();
  for (const width of [1440, 820, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await fit(`Exam preview ${width}`);
    check(
      !(await page.locator('main').innerText()).includes('AUTHOR_ONLY_EXPLANATION'),
      'No preview solution',
    );
  }
  await page.goto(`${builder}/sessions/11/parts/21/questions/31`);
  const prompt = page.getByLabel('Câu hỏi tiếng Nhật *', { exact: true });
  await prompt.waitFor();
  await prompt.fill('未保存の質問\n' + table);
  const correctKey = await page.getByRole('radio', { checked: true }).getAttribute('value');
  for (const width of [1440, 820, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    const lastAnswer = page.getByLabel('Nội dung đáp án 24', { exact: true });
    await lastAnswer.focus();
    await fit(`Editor ${width}`);
    const answerBox = await lastAnswer.boundingBox();
    const toolbar = await page.locator('.sticky').boundingBox();
    check(answerBox.y >= toolbar.y + toolbar.height, `Focused answer obscured by toolbar ${width}`);
    await page.getByRole('button', { name: 'Preview câu hỏi', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('radio').nth(23).waitFor();
    await fit(`Question preview ${width}`);
    check(
      (await dialog.getByRole('radio', { checked: true }).count()) === 0,
      'No initial preview selection',
    );
    await dialog.getByRole('radio').nth(23).focus();
    await page.keyboard.press('Space');
    if (artifactDirectory)
      await page.screenshot({
        path: `${artifactDirectory}/admin-jlpt-final-editor-preview-${width}.png`,
      });
    await page.keyboard.press('Escape');
    check(
      (await page.getByRole('radio', { checked: true }).getAttribute('value')) === correctKey,
      'Preview keeps author correctness',
    );
    check((await prompt.inputValue()).startsWith('未保存'), 'Preview keeps dirty values');
  }
  check(
    !state.calls.some((c) => /attempt|submission|upload/.test(c.path)),
    'Preview has no attempt/upload calls',
  );
  check(
    !state.calls.some((c) => c.path.includes('/admin/jlpt-exams') && c.method !== 'GET'),
    'Preview has no writes',
  );
  await page.getByRole('button', { name: 'Về builder', exact: true }).click();
  await page.getByRole('button', { name: 'Bỏ thay đổi và rời trang', exact: true }).click();
  await page.getByRole('button', { name: 'Thêm phiên thi', exact: true }).waitFor();
  // Reproduce the cross-screen race: an old readiness GET finishes after metadata Save.
  state.ready = true;
  await page.getByRole('button', { name: 'Kiểm tra độ sẵn sàng', exact: true }).click();
  await page.getByText('Dữ liệu đã lưu đủ điều kiện xuất bản', { exact: false }).waitFor();
  state.holdValidation = true;
  await page.getByRole('button', { name: 'Kiểm tra độ sẵn sàng', exact: true }).click();
  for (let i = 0; !state.validationRelease && i < 100; i++) await page.waitForTimeout(20);
  check(state.validationRelease, 'Held readiness request started');
  await page.getByRole('button', { name: 'Sửa thông tin đề', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByLabel('Tiêu đề', { exact: false })
    .fill('JLPT N3 Changed after readiness began');
  await page.getByRole('dialog').getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  state.validationRelease();
  await page.getByText('Kết quả trước đã cũ.', { exact: false }).waitFor();
  check(
    (await page.getByText('Dữ liệu đã lưu đủ điều kiện xuất bản', { exact: false }).count()) === 0,
    'Late response cannot recertify content',
  );
  check(state.errors.length === 0, JSON.stringify(state.errors));
  return {
    viewports: [1440, 820, 390],
    answers: 24,
    race: 'stale after late response',
    errors: state.errors,
  };
}
