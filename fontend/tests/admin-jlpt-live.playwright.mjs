// Opt-in LIVE local authoring check. Requires an already authenticated ADMIN page.
// Creates only its own uniquely named exam. No login secrets or provider calls.
// The captured fixture is retained for lifecycle/history checks and soft archive.
export default async function runAdminJlptLiveAuthoring(page, origin = 'http://localhost:3000') {
  if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))
    throw new Error('Local origin required');
  if (page.__jlptLive?.fixture)
    throw new Error('A fixture already exists; inspect it instead of creating duplicates');
  const check = (value, message) => {
    if (!value) throw new Error(message);
  };
  await page.goto(`${origin}/admin/exams`);
  await page.getByRole('button', { name: 'Thêm đề thi', exact: true }).waitFor();
  check(new URL(page.url()).pathname === '/admin/exams', 'Authenticated admin route required');
  const title = `JLPT-T7-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const fixture = {
    title,
    examId: null,
    detail: null,
    sessions: [],
    parts: [],
    questions: [],
    checks: [],
  };
  page.__jlptLive ??= { calls: [], errors: [], fixture: null };
  page.__jlptLive.fixture = fixture;
  page.on('response', (response) => {
    const path = new URL(response.url()).pathname;
    if (/^\/api\/v1\/(admin\/)?jlpt-exams/.test(path))
      page.__jlptLive.calls.push({
        path,
        method: response.request().method(),
        status: response.status(),
      });
  });
  page.on('pageerror', (error) => page.__jlptLive.errors.push(error.message));
  const pathOf = (response) => new URL(response.url()).pathname;
  const responseFor = (method, path) =>
    page.waitForResponse((r) => r.request().method() === method && pathOf(r) === path);
  const dialog = () => page.getByRole('dialog');
  await page.getByRole('button', { name: 'Thêm đề thi', exact: true }).click();
  await dialog().locator('#jlpt-title').fill(title);
  await dialog().locator('#jlpt-level').selectOption('N3');
  await dialog()
    .locator('#jlpt-description')
    .fill('Isolated frontend task 7 verification. Safe to retain as archived test history.');
  const created = responseFor('POST', '/api/v1/admin/jlpt-exams');
  await dialog().getByRole('button', { name: 'Tạo đề thi', exact: true }).click();
  const creation = await created;
  check(creation.status() === 201, `Exam create status ${creation.status()}`);
  const initial = (await creation.json()).data;
  check(initial.title === title && initial.status === 'DRAFT', 'New isolated DRAFT');
  fixture.examId = initial.id;
  fixture.detail = initial;
  const root = `/api/v1/admin/jlpt-exams/${initial.id}`;
  const card = page.getByRole('article', { name: title, exact: true });
  await card.getByRole('link', { name: /Mở Exam Builder/ }).click();
  await page.getByRole('button', { name: 'Thêm phiên thi', exact: true }).waitFor();
  const persist = async (method, path, click) => {
    check(fixture.detail.title === title, 'Only the owned fixture may be written');
    const response = responseFor(method, path);
    const refreshed = responseFor('GET', root);
    await click();
    const saved = await response;
    check(saved.status() >= 200 && saved.status() < 300, `${method} ${path}: ${saved.status()}`);
    const data = saved.status() === 204 ? null : (await saved.json()).data;
    const read = await refreshed;
    check(read.status() === 200, 'Authoritative detail refreshed');
    fixture.detail = (await read.json()).data;
    check(
      fixture.detail.id === fixture.examId && fixture.detail.title === title,
      'Authoritative fixture ownership',
    );
    return data;
  };
  const readyBuilder = async () => {
    await page.getByRole('button', { name: 'Thêm phiên thi', exact: true }).waitFor();
    await page.waitForFunction(() =>
      [...document.querySelectorAll('button')].some(
        (b) => b.textContent.includes('Thêm phiên thi') && !b.disabled,
      ),
    );
  };
  const addSession = async (name, type, minutes) => {
    await readyBuilder();
    await page.getByRole('button', { name: 'Thêm phiên thi', exact: true }).click();
    await dialog().locator('#structure-name').fill(name);
    await dialog().locator('#structure-sessionType').selectOption(type);
    await dialog().locator('#structure-timeLimitMinutes').fill(String(minutes));
    const session = await persist('POST', `${root}/sessions`, () =>
      dialog().getByRole('button', { name: 'Lưu thay đổi', exact: true }).click(),
    );
    await dialog().waitFor({ state: 'hidden' });
    fixture.sessions.push(session);
    return session;
  };
  const addPart = async (session, name) => {
    await readyBuilder();
    await page
      .locator(`[data-session-id="${session.id}"]`)
      .getByRole('button', { name: 'Thêm phần thi', exact: true })
      .click();
    await dialog().locator('#structure-name').fill(name);
    await dialog()
      .locator('#structure-instructions')
      .fill('日本語を読んで、一つ選んでください。\n改行の確認。');
    const part = await persist('POST', `${root}/sessions/${session.id}/parts`, () =>
      dialog().getByRole('button', { name: 'Lưu thay đổi', exact: true }).click(),
    );
    await dialog().waitFor({ state: 'hidden' });
    const result = { ...part, sessionId: session.id };
    fixture.parts.push(result);
    return result;
  };
  const back = async () => {
    await page.getByRole('button', { name: 'Về builder', exact: true }).click();
    await readyBuilder();
  };
  const openNew = async (part) => {
    await page
      .locator(`[data-part-id="${part.id}"]`)
      .getByRole('link', { name: 'Thêm câu hỏi', exact: true })
      .click();
    await page.locator('#question-questionText').waitFor();
  };
  const addQuestion = async (part, label, next = false) => {
    await page
      .locator('#question-questionText')
      .fill(`<p>${label}：正しい<u>日本語</u>を選んでください。</p>`);
    await page.locator('#question-passageText').fill('<p>読解の本文。\n二行目です。</p>');
    await page.locator('#question-points').fill('1.25');
    await page.locator('#question-explanation').fill('検証用の解説。完了前には公開しません。');
    await page.getByLabel('Nội dung đáp án 1', { exact: true }).fill(`${label} 正しい答え`);
    await page.getByLabel('Nội dung đáp án 2', { exact: true }).fill(`${label} 別の答え`);
    await page.getByRole('button', { name: 'Thêm đáp án', exact: true }).click();
    await page.getByLabel('Nội dung đáp án 3', { exact: true }).fill(`${label} 三番目`);
    await page.getByLabel('Chọn đáp án 1 đúng', { exact: true }).check();
    const path = `${root}/sessions/${part.sessionId}/parts/${part.id}/questions/with-answers`;
    const question = await persist('POST', path, () =>
      page
        .getByRole('button', { name: next ? 'Lưu & tiếp →' : 'Lưu câu hỏi', exact: true })
        .click(),
    );
    const result = { ...question, partId: part.id, sessionId: part.sessionId };
    fixture.questions.push(result);
    if (next)
      await page.waitForFunction(
        () => document.querySelector('#question-questionText')?.value === '',
      );
    else await page.waitForURL((u) => u.pathname.endsWith(`/questions/${question.id}`));
    return result;
  };
  const language = await addSession('T7 Language', 'language_knowledge', 30);
  const reading = await addSession('T7 Reading', 'reading', 40);
  const listening = await addSession('T7 Listening', 'listening', 20);
  const a = await addPart(language, 'T7 Part A');
  const b = await addPart(language, 'T7 Part B');
  const r = await addPart(reading, 'T7 Reading Part');
  const l = await addPart(listening, 'T7 Listening Part');
  await openNew(a);
  await addQuestion(a, 'T7 Q1', true);
  const q2 = await addQuestion(a, 'T7 Q2');
  await page.getByLabel('Nội dung đáp án 1', { exact: true }).fill('T7 Q2 正しい答え 編集済み');
  await page.getByRole('button', { name: 'Xóa đáp án 3', exact: true }).click();
  await page.getByRole('button', { name: 'Thêm đáp án', exact: true }).click();
  await page.getByLabel('Nội dung đáp án 3', { exact: true }).fill('T7 新しい答え');
  await page.getByRole('button', { name: 'Chuyển lên đáp án 3', exact: true }).click();
  const q2path = `${root}/sessions/${language.id}/parts/${a.id}/questions/${q2.id}/with-answers`;
  const edited = await persist('PUT', q2path, () =>
    page.getByRole('button', { name: 'Lưu câu hỏi', exact: true }).click(),
  );
  check(
    edited.answers[0].id === q2.answers[0].id && edited.answers[2].id === q2.answers[1].id,
    'Retained answer IDs stable after reorder',
  );
  check(!edited.answers.some((answer) => answer.id === q2.answers[2].id), 'Removed answer omitted');
  check(
    !q2.answers.some((answer) => answer.id === edited.answers[1].id),
    'New answer assigned server ID',
  );
  fixture.checks.push('retained/new/deleted answer IDs and atomic reorder');
  await persist('PUT', q2path, () =>
    page.getByRole('button', { name: 'Lưu & tiếp →', exact: true }).click(),
  );
  await page.waitForURL((u) => u.pathname.endsWith('/questions/new'));
  check(
    (await page.locator('#question-questionText').inputValue()) === '',
    'Last Save & Next starts clean create',
  );
  await back();
  for (const [part, label] of [
    [b, 'T7 Q3'],
    [r, 'T7 Q4'],
    [l, 'T7 Q5'],
  ]) {
    await openNew(part);
    await addQuestion(part, label);
    await back();
  }
  await page.getByRole('button', { name: 'Sửa phiên thi T7 Language', exact: true }).click();
  await dialog().locator('#structure-timeLimitMinutes').fill('35');
  await persist('PUT', `${root}/sessions/${language.id}`, () =>
    dialog().getByRole('button', { name: 'Lưu thay đổi', exact: true }).click(),
  );
  await dialog().waitFor({ state: 'hidden' });
  await readyBuilder();
  await page.getByRole('button', { name: 'Sửa phần thi T7 Part A', exact: true }).click();
  await dialog().locator('#structure-instructions').fill('保存後の指示。\n画像と音声なしの検証。');
  await persist('PUT', `${root}/sessions/${language.id}/parts/${a.id}`, () =>
    dialog().getByRole('button', { name: 'Lưu thay đổi', exact: true }).click(),
  );
  await dialog().waitFor({ state: 'hidden' });
  await readyBuilder();
  await persist('PATCH', `${root}/sessions/reorder`, () =>
    page.getByRole('button', { name: 'Chuyển lên phiên thi T7 Reading', exact: true }).click(),
  );
  await readyBuilder();
  await persist('PATCH', `${root}/sessions/${language.id}/parts/reorder`, () =>
    page.getByRole('button', { name: 'Chuyển lên phần thi T7 Part B', exact: true }).click(),
  );
  await readyBuilder();
  await persist('PATCH', `${root}/sessions/${language.id}/parts/${a.id}/questions/reorder`, () =>
    page.getByRole('button', { name: `Chuyển lên câu hỏi #${q2.id}`, exact: true }).click(),
  );
  const reordered = JSON.stringify(
    fixture.detail.sessions.map((s) => ({
      id: s.id,
      parts: s.parts.map((p) => ({ id: p.id, questions: p.questions.map((q) => q.id) })),
    })),
  );
  const refresh = responseFor('GET', root);
  await page.reload();
  fixture.detail = (await (await refresh).json()).data;
  await readyBuilder();
  check(
    JSON.stringify(
      fixture.detail.sessions.map((s) => ({
        id: s.id,
        parts: s.parts.map((p) => ({ id: p.id, questions: p.questions.map((q) => q.id) })),
      })),
    ) === reordered,
    'Reorder persists after refresh',
  );
  check(
    fixture.detail.totalTimeMinutes === 95 &&
      fixture.detail.sessionCount === 3 &&
      fixture.detail.partCount === 4 &&
      fixture.detail.questionCount === 5,
    'Authoritative counts and derived duration',
  );
  fixture.checks.push(
    'session/part/question complete batch reorder and reload',
    'counts and derived duration',
  );
  // Cascade-delete a temporary subtree, with explicit verified counts in the dialog.
  const temporary = await addSession('T7 Temporary Delete', 'reading', 5);
  const temporaryPart = await addPart(temporary, 'T7 Temporary Part');
  await openNew(temporaryPart);
  await addQuestion(temporaryPart, 'T7 Temporary Question');
  await back();
  await page
    .getByRole('button', { name: 'Xóa phiên thi T7 Temporary Delete', exact: true })
    .click();
  const confirmation = page.getByRole('alertdialog');
  check(
    (await confirmation.innerText()).includes('1 phần thi, 1 câu hỏi, 3 đáp án'),
    'Accurate cascade confirmation',
  );
  await persist('DELETE', `${root}/sessions/${temporary.id}`, () =>
    confirmation.getByRole('button', { name: 'Xóa vĩnh viễn', exact: true }).click(),
  );
  await confirmation.waitFor({ state: 'hidden' });
  await readyBuilder();
  check(
    fixture.detail.sessionCount === 3 &&
      fixture.detail.partCount === 4 &&
      fixture.detail.questionCount === 5 &&
      fixture.detail.totalTimeMinutes === 95,
    'Cascade counts refreshed',
  );
  fixture.checks.push('confirmed session subtree deletion');
  await page.getByRole('button', { name: 'Kiểm tra độ sẵn sàng', exact: true }).click();
  await page.getByText('Dữ liệu đã lưu đủ điều kiện xuất bản', { exact: false }).waitFor();
  fixture.checks.push('live publish validation ready');
  return {
    examId: fixture.examId,
    title,
    sessions: fixture.detail.sessionCount,
    parts: fixture.detail.partCount,
    questions: fixture.detail.questionCount,
    minutes: fixture.detail.totalTimeMinutes,
    checks: fixture.checks,
  };
}
