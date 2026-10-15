// Regression for the live-discovered authoring/learner lifecycle integration.
// Synthetic public DTOs only. Does not call a real backend or create real attempts.
export default async function runAdminJlptHistoryRegression(
  page,
  origin = 'http://localhost:3000',
) {
  const check = (value, message) => {
    if (!value) throw new Error(message);
  };
  const exam = {
    id: 701,
    title: 'Isolated lifecycle resume',
    description: 'Public snapshot',
    jlptLevel: 'N3',
    totalTimeMinutes: 95,
    isPublished: true,
    sessions: [
      {
        id: 11,
        name: '読む',
        sessionType: 'reading',
        sortOrder: 0,
        timeLimitMinutes: 95,
        questionCount: 1,
        parts: [
          {
            id: 21,
            name: '問題',
            instructions: '一つ選んでください。',
            sortOrder: 0,
            questionCount: 1,
            audioMediaId: null,
          },
        ],
      },
    ],
  };
  const attempt = {
    attemptId: 801,
    examId: 701,
    examTitle: exam.title,
    mode: 'full',
    startedAt: new Date().toISOString(),
    sessions: [
      {
        sessionId: 11,
        attemptSessionId: 811,
        sessionTitle: '読む',
        sessionOrder: 0,
        parts: [
          {
            partId: 21,
            attemptPartId: 821,
            partName: '問題',
            partOrder: 0,
            questions: [
              {
                questionId: 31,
                questionOrder: 0,
                questionText: '日本語の問題',
                answers: [
                  { answerId: 310, answerText: '選択肢一' },
                  { answerId: 311, answerText: '選択肢二' },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  const state = { available: true, forbidden: false, starts: 0, saves: [], calls: [], errors: [] };
  const handler = async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname,
      method = request.method();
    state.calls.push({ path, method });
    const ok = (data) =>
      route.fulfill({ json: { statusCode: 200, error: null, message: 'OK', data } });
    const fail = (status) =>
      route.fulfill({ status, json: { status, message: 'Synthetic rejection', fieldErrors: {} } });
    if (path.endsWith('/csrf')) return ok({ token: 'synthetic', headerName: 'X-XSRF-TOKEN' });
    if (path.endsWith('/refresh-token'))
      return ok({
        access_token: 'synthetic',
        tokenType: 'Bearer',
        expiresIn: 600,
        user: { id: 701, name: 'Resume fixture', email: 'resume@example.test' },
      });
    if (path === '/api/v1/jlpt-exams/701/detail')
      return state.forbidden ? fail(403) : state.available ? ok(exam) : fail(404);
    if (path === '/api/v1/jlpt-exams/701/attempts') {
      if (!state.available) return fail(404);
      state.starts++;
      return ok(attempt);
    }
    if (path === '/api/v1/jlpt-exams/attempts/801/result') return fail(400);
    if (path === '/api/v1/jlpt-exams/attempts/801/sessions/811/answers') {
      const answer = request.postDataJSON();
      state.saves.push(answer);
      return ok({
        ...answer,
        attemptId: 801,
        attemptSessionId: 811,
        attemptAnswerId: 831,
        answeredAt: new Date().toISOString(),
      });
    }
    throw new Error(`Unexpected lifecycle-resume request ${method} ${path}`);
  };
  page.on('pageerror', (error) => state.errors.push(error.message));
  await page.unroute('**/api/v1/**');
  await page.route('**/api/v1/**', handler);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const taking = `${origin}/jlpt-exams/701/taking?mode=full`;
  await page.goto(taking);
  await page.getByRole('button', { name: 'Begin attempt', exact: true }).click();
  await page.getByRole('radio').first().waitFor();
  const save = async (index) => {
    const saved = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname.endsWith('/answers') &&
        response.request().method() === 'PUT',
    );
    await page.getByRole('radio').nth(index).check();
    check((await saved).status() === 200, 'Existing attempt answer saved');
  };
  await save(1);
  const snapshot = await page.evaluate(() =>
    Object.keys(sessionStorage)
      .map((key) => {
        try {
          return JSON.parse(sessionStorage.getItem(key));
        } catch {
          return null;
        }
      })
      .find((value) => value?.attempt?.attemptId === 801),
  );
  check(
    snapshot.exam.totalTimeMinutes === 95 && snapshot.exam.id === 701,
    'Original public duration and metadata retained',
  );
  check(
    !JSON.stringify(snapshot).match(/isCorrect|correctAnswerId|explanation/),
    'No authoring solutions in snapshot',
  );
  state.available = false; // Both unpublish and archive make the public catalog return 404.
  await page.reload();
  await page.getByRole('radio').nth(1).waitFor();
  check(
    await page.getByRole('radio').nth(1).isChecked(),
    'Saved selection restored after catalog 404',
  );
  await save(0);
  await page.reload();
  await page.getByRole('radio').first().waitFor();
  check(
    await page.getByRole('radio').first().isChecked(),
    'Snapshot survives subsequent answer writes',
  );
  check(state.starts === 1, 'Resume never starts a second attempt');
  const fresh = await page.context().newPage();
  try {
    await fresh.route('**/api/v1/**', handler);
    await fresh.goto(taking);
    await fresh.getByRole('heading', { name: 'Exam unavailable', exact: true }).waitFor();
    check(state.starts === 1, 'A new tab cannot start the hidden exam');
  } finally {
    await fresh.close();
  }
  state.forbidden = true;
  await page.reload();
  await page.getByRole('heading', { name: 'Could not load exam', exact: true }).waitFor();
  check((await page.getByRole('radio').count()) === 0, '403 never uses the stored snapshot');
  check(
    !state.calls.some((call) => call.path.includes('/admin/')),
    'Student resume never requests admin data',
  );
  check(state.errors.length === 0, JSON.stringify(state.errors));
  return {
    starts: state.starts,
    saves: state.saves.length,
    restoredAfter404: true,
    newStartsBlocked: true,
    forbiddenBlocked: true,
    errors: state.errors,
  };
}
