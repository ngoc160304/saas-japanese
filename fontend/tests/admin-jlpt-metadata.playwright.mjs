// Playwright supplies page; no new dependency or live backend writes.
// A Playwright runner can import this callback. For MCP's VM, read this file,
// remove "export default " and pass the source to browser_run_code_unsafe.
export default async function runAdminJlptMetadataSmoke(page, origin = 'http://localhost:3001') {
  await page.unroute('**/api/v1/**');
  const setup = async (page) => {
    const template = {
      id: 1,
      level: 'N3',
      title: 'JLPT N3 Metadata Draft',
      description: 'Mô tả đầy đủ từ API',
      totalTimeMinutes: 30,
      status: 'DRAFT',
      hasAttempts: false,
      contentLocked: false,
      sessionCount: 1,
      partCount: 1,
      questionCount: 4,
      passingScore: 95,
      createdAt: '2026-10-15T00:00:00Z',
      updatedAt: '2026-10-15T00:00:00Z',
      sessions: [],
    };
    const s = (page.__jlptTask2 = {
      requests: [],
      errors: [],
      mode: 'admin',
      saveFailure: null,
      saveDelay: 0,
      statsDelay: 0,
      nextId: 50,
      exams: [
        template,
        {
          ...template,
          id: 2,
          title: 'JLPT N2 Published',
          level: 'N2',
          status: 'PUBLISHED',
          contentLocked: true,
        },
        { ...template, id: 3, title: 'JLPT N3 Attempted', hasAttempts: true, contentLocked: true },
        { ...template, id: 4, title: 'JLPT N5 Archived', status: 'ARCHIVED', contentLocked: true },
      ],
    });
    page.on('pageerror', (e) => s.errors.push(e.message));
    await page.route('**/api/v1/**', async (route) => {
      const request = route.request(),
        url = new URL(request.url()),
        p = url.pathname,
        method = request.method();
      s.requests.push({
        p,
        method,
        params: Object.fromEntries(url.searchParams),
        body: request.postDataJSON(),
      });
      const ok = (data) =>
        route.fulfill({ status: 200, json: { statusCode: 200, error: null, message: 'OK', data } });
      const fail = (status, message, fieldErrors = {}) =>
        route.fulfill({
          status,
          json: { status, message, fieldErrors, timestamp: '2026-10-15T00:00:00Z' },
        });
      if (p.endsWith('/csrf')) return ok({ token: 'synthetic', headerName: 'X-XSRF-TOKEN' });
      if (p.endsWith('/refresh-token'))
        return s.mode === 'anonymous'
          ? fail(401, 'Authentication required')
          : ok({
              access_token: 'synthetic',
              tokenType: 'Bearer',
              expiresIn: 600,
              user: { id: 1, email: 'test@example.test', name: 'Test' },
            });
      if (s.mode === 'denied') return fail(403, 'Access denied');
      const match = (x) =>
        (!url.searchParams.get('search') ||
          (x.title + ' ' + x.description)
            .toLowerCase()
            .includes(url.searchParams.get('search').toLowerCase())) &&
        (!url.searchParams.get('level') || x.level === url.searchParams.get('level'));
      if (p.endsWith('/stats')) {
        if (s.statsDelay) await new Promise((r) => setTimeout(r, s.statsDelay));
        if (s.mode === 'stats-error') return fail(500, 'Internal server error');
        const rows = s.exams.filter(match);
        return ok({
          totalExams: rows.length,
          publishedExams: rows.filter((x) => x.status === 'PUBLISHED').length,
          draftExams: rows.filter((x) => x.status === 'DRAFT').length,
          archivedExams: rows.filter((x) => x.status === 'ARCHIVED').length,
        });
      }
      if (p.endsWith('/validation'))
        return ok({
          examId: 1,
          status: 'DRAFT',
          contentValid: false,
          canPublish: false,
          hasAttempts: false,
          contentLocked: false,
          totalTimeMinutes: 30,
          issues: [],
        });
      if (p.endsWith('/admin/jlpt-exams') && method === 'GET') {
        if (s.mode === 'list-error') return fail(500, 'Internal server error');
        const rows = s.exams
          .filter(match)
          .filter((x) =>
            url.searchParams.get('status')
              ? x.status === url.searchParams.get('status')
              : x.status !== 'ARCHIVED',
          );
        const number = Number(url.searchParams.get('page') || 0),
          size = Number(url.searchParams.get('size') || 10),
          content = rows.slice(number * size, (number + 1) * size).map(({ sessions: _sessions, ...x }) => x);
        return ok({
          content,
          number,
          size,
          totalElements: rows.length,
          totalPages: Math.ceil(rows.length / size),
          numberOfElements: content.length,
          first: number === 0,
          last: (number + 1) * size >= rows.length,
          empty: !content.length,
          pageable: {},
          sort: {},
        });
      }
      if (p.includes('/admin/jlpt-exams') && (method === 'POST' || method === 'PUT')) {
        if (s.saveDelay) await new Promise((r) => setTimeout(r, s.saveDelay));
        if (s.saveFailure) {
          const failure = s.saveFailure;
          s.saveFailure = null;
          if (failure === 409) {
            const record = s.exams.find((x) => x.id === Number(p.split('/').pop()));
            record.hasAttempts = true;
            record.contentLocked = true;
          }
          return fail(
            failure,
            failure === 409
              ? 'An exam with attempts is immutable; create a new revision instead'
              : failure === 403
                ? 'Access denied'
                : 'Validation failed',
            failure === 400 ? { title: 'Tiêu đề bị backend từ chối' } : {},
          );
        }
        const body = request.postDataJSON();
        if (method === 'POST') {
          const created = {
            ...template,
            ...body,
            id: s.nextId++,
            totalTimeMinutes: 0,
            questionCount: 0,
            sessionCount: 0,
            partCount: 0,
          };
          s.exams.push(created);
          return route.fulfill({
            status: 201,
            json: { statusCode: 201, error: null, message: 'Created', data: created },
          });
        }
        const id = Number(p.split('/').pop()),
          record = s.exams.find((x) => x.id === id);
        Object.assign(record, body);
        return ok(record);
      }
      if (/\/admin\/jlpt-exams\/\d+$/.test(p) && method === 'GET') {
        const x = s.exams.find((x) => x.id === Number(p.split('/').pop()));
        return x ? ok(x) : fail(404, 'JLPT exam not found');
      }
      s.errors.push('Unexpected ' + method + ' ' + p);
      return fail(404, 'Unexpected API');
    });
    await page.goto(origin + '/admin/exams?tab=keep');
    await page.getByRole('button', { name: 'Thêm đề thi', exact: true }).waitFor();
    return {
      url: page.url(),
      body: (await page.locator('main').innerText()).slice(-2000),
      requests: s.requests.map((x) => x.p),
    };
  };
  const create = async (page) => {
    const s = page.__jlptTask2;
    const check = (v, m) => {
      if (!v) throw new Error(m);
    };
    const form = page.getByRole('dialog');
    await form.getByLabel('Tiêu đề').fill('Tạo mới từ kiểm thử');
    await form.getByLabel('Mô tả', { exact: true }).fill('Mô tả chưa lưu');
    s.saveFailure = 400;
    await page.getByRole('button', { name: 'Tạo đề thi', exact: true }).click();
    await page.getByText('Tiêu đề bị backend từ chối', { exact: true }).waitFor();
    check(
      (await form.getByLabel('Tiêu đề').inputValue()) === 'Tạo mới từ kiểm thử',
      '400 lost title',
    );
    check(
      (await form.getByLabel('Mô tả', { exact: true }).inputValue()) === 'Mô tả chưa lưu',
      '400 lost description',
    );
    await page.getByRole('button', { name: 'Hủy', exact: true }).click();
    await page.getByRole('alertdialog').waitFor();
    await page.getByRole('button', { name: 'Tiếp tục chỉnh sửa', exact: true }).click();
    check(
      (await form.getByLabel('Tiêu đề').inputValue()) === 'Tạo mới từ kiểm thử',
      'Discard cancellation lost input',
    );
    s.saveDelay = 600;
    const before = s.requests.filter(
      (x) => x.method === 'POST' && x.p.endsWith('/admin/jlpt-exams'),
    ).length;
    await page.getByRole('button', { name: 'Tạo đề thi', exact: true }).dblclick();
    await form.waitFor({ state: 'hidden' });
    s.saveDelay = 0;
    check(
      s.requests.filter((x) => x.method === 'POST' && x.p.endsWith('/admin/jlpt-exams')).length ===
        before + 1,
      'Duplicate submit',
    );
    await page.getByRole('article', { name: 'Tạo mới từ kiểm thử', exact: true }).waitFor();
    await page
      .getByRole('button', { name: 'Sửa metadata: JLPT N3 Metadata Draft', exact: true })
      .click();
    await form.getByLabel('Tiêu đề').waitFor();
    check(
      (await form.getByLabel('Mô tả', { exact: true }).inputValue()) === 'Mô tả đầy đủ từ API',
      'Authoritative edit metadata missing',
    );
    await form.getByLabel('Tiêu đề').fill('Đã sửa metadata');
    await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await form.waitFor({ state: 'hidden' });
    await page.getByRole('article', { name: 'Đã sửa metadata', exact: true }).waitFor();
    return {
      pass: 'create validation/400 preserve/dirty confirm/duplicate submit/success/edit detail/success',
      errors: s.errors,
      writes: s.requests
        .filter((x) => ['POST', 'PUT'].includes(x.method) && x.p.includes('/admin/jlpt-exams'))
        .map((x) => ({ method: x.method, body: x.body })),
    };
  };
  const filters = async (page) => {
    const s = page.__jlptTask2,
      check = (v, m) => {
        if (!v) throw new Error(m);
      };
    s.statsDelay = 1800;
    await page.goto(origin + '/admin/exams?tab=keep');
    await page.getByRole('article', { name: 'Đã sửa metadata', exact: true }).waitFor();
    check(
      (await page.getByText('Đang tải…', { exact: true }).count()) > 0,
      'Statistics loading blocked list',
    );
    s.statsDelay = 0;
    await page.getByText('Gồm cả đề đã lưu trữ', { exact: true }).waitFor();
    const levelStats = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname.endsWith('/stats') &&
        new URL(r.url()).searchParams.get('level') === 'N3',
    );
    await page.getByRole('combobox', { name: 'Cấp độ JLPT', exact: true }).selectOption('N3');
    await page.waitForURL(/level=N3/);
    await levelStats;
    const statsBefore = s.requests.filter((x) => x.p.endsWith('/stats')).length;
    await page.getByRole('combobox', { name: 'Trạng thái', exact: true }).selectOption('DRAFT');
    await page.waitForURL(/status=DRAFT/);
    await page.getByRole('combobox', { name: 'Số đề mỗi trang', exact: true }).selectOption('1');
    await page.waitForURL(/size=1/);
    await page.getByRole('button', { name: 'Next page', exact: true }).click();
    await page.waitForURL(/page=2/);
    check(
      s.requests.filter((x) => x.p.endsWith('/stats')).length === statsBefore,
      'Page/status/size changed stats query',
    );
    await page.goBack();
    await page.waitForURL((url) => !url.searchParams.has('page'));
    await page.goForward();
    await page.waitForURL(/page=2/);
    await page.reload();
    await page.getByRole('combobox', { name: 'Số đề mỗi trang', exact: true }).waitFor();
    check(
      (await page.getByRole('combobox', { name: 'Số đề mỗi trang', exact: true }).inputValue()) ===
        '1',
      'Reload lost page size',
    );
    await page.getByPlaceholder('Tìm theo tiêu đề hoặc mô tả…').fill('nonexistent');
    await page.waitForURL(/search=nonexistent/);
    await page.getByText('Không tìm thấy đề thi phù hợp', { exact: true }).waitFor();
    check(!new URL(page.url()).searchParams.has('page'), 'Search did not reset page');
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.getByRole('article', { name: 'Đã sửa metadata', exact: true }).waitFor();
    check(new URL(page.url()).searchParams.get('tab') === 'keep', 'Reset lost unrelated URL');
    await page.getByPlaceholder('Tìm theo tiêu đề hoặc mô tả…').fill('stale-search');
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.waitForTimeout(500);
    check(!new URL(page.url()).searchParams.has('search'), 'Pending debounce undid reset');
    s.mode = 'stats-error';
    await page.reload();
    await page.getByRole('article', { name: 'Đã sửa metadata', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Thử lại thống kê', exact: true }).waitFor();
    check(
      await page.getByRole('button', { name: 'Thêm đề thi', exact: true }).isEnabled(),
      'Stats error disabled list action',
    );
    s.mode = 'admin';
    await page.getByRole('button', { name: 'Thử lại thống kê', exact: true }).click();
    await page.getByText('Gồm cả đề đã lưu trữ', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Sửa metadata: Đã sửa metadata', exact: true }).click();
    const form = page.getByRole('dialog');
    await form.getByLabel('Tiêu đề').waitFor();
    await form.getByLabel('Tiêu đề').fill('Unsaved conflict title');
    s.saveFailure = 409;
    await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await page
      .getByText(/Metadata bị khóa kể cả sau khi hủy xuất bản/)
      .last()
      .waitFor();
    check(
      (await form.getByLabel('Tiêu đề').inputValue()) === 'Unsaved conflict title',
      '409 discarded input',
    );
    check(
      await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).isDisabled(),
      '409 attempt lock did not disable save',
    );
    await page.getByRole('button', { name: 'Hủy', exact: true }).click();
    await page.getByRole('button', { name: 'Bỏ thay đổi', exact: true }).click();
    await form.waitFor({ state: 'hidden' });
    return {
      pass: 'independent stats loading/error; URL filters/page/size/back/forward/reload; debounce/reset; conflict preserves input+locks',
      errors: s.errors,
      url: page.url(),
    };
  };
  const extras = async (page) => {
    const s = page.__jlptTask2,
      check = (v, m) => {
        if (!v) throw new Error(m);
      };
    await page.getByRole('button', { name: 'Thêm đề thi', exact: true }).click();
    const form = page.getByRole('dialog');
    await form.getByLabel('Tiêu đề').waitFor();
    check(
      (await page.evaluate(() => document.activeElement.id)) === 'jlpt-title',
      'Create title was not focused',
    );
    await page.keyboard.press('Escape');
    await form.waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Thêm đề thi', exact: true }).click();
    await form.getByLabel('Tiêu đề').fill('Discard with keyboard');
    await page.keyboard.press('Escape');
    await page.getByRole('alertdialog').waitFor();
    await page.getByRole('button', { name: 'Bỏ thay đổi', exact: true }).click();
    await form.waitFor({ state: 'hidden' });
    await page.getByRole('combobox', { name: 'Trạng thái', exact: true }).selectOption('ARCHIVED');
    await page.getByRole('article', { name: 'JLPT N5 Archived', exact: true }).waitFor();
    check(
      await page
        .getByRole('button', { name: 'Sửa metadata: JLPT N5 Archived', exact: true })
        .isDisabled(),
      'Archived metadata editable',
    );
    s.mode = 'list-error';
    await page.getByPlaceholder('Tìm theo tiêu đề hoặc mô tả…').fill('failed-filter');
    await page.getByText('Chưa thể tải dữ liệu đề thi', { exact: true }).waitFor();
    check((await page.getByRole('article').count()) === 0, 'Failed filter showed previous records');
    s.mode = 'admin';
    await page.goto(origin + '/admin/exams?tab=keep&page=999&size=1');
    await page.waitForURL((url) => url.searchParams.get('page') === '4');
    await page.getByRole('article').first().waitFor();
    await page.goto(origin + '/admin/exams?tab=keep&page=bad&size=99&status=BAD&level=N6');
    await page.waitForURL((url) => url.searchParams.toString() === 'tab=keep');
    await page.getByRole('article').first().waitFor();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
      check(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        'List overflow ' + width,
      );
      await page.getByRole('button', { name: 'Thêm đề thi', exact: true }).click();
      await form.getByLabel('Tiêu đề').waitFor();
      check(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        'Dialog overflow ' + width,
      );
      await page.keyboard.press('Escape');
      await form.waitFor({ state: 'hidden' });
    }
    const keep = s.exams;
    s.exams = [];
    await page.reload();
    await page.getByText('Thư viện chưa có đề thi', { exact: true }).waitFor();
    s.exams = keep;
    s.mode = 'denied';
    await page.reload();
    await page.getByText('Không có quyền truy cập', { exact: true }).waitFor();
    check((await page.getByRole('article').count()) === 0, '403 showed records');
    s.mode = 'anonymous';
    await page.reload();
    await page.waitForURL((url) => url.pathname === '/login');
    s.mode = 'admin';
    await page.goto(origin + '/admin/exams');
    await page.getByRole('article').first().waitFor();
    check(s.errors.length === 0, JSON.stringify(s.errors));
    return {
      pass: 'keyboard focus/Escape/dirty close; archived read-only; failed filter hides stale cards; invalid and out-of-range URLs; empty library; 403/anonymous; mobile/desktop no overflow',
      errors: s.errors,
    };
  };
  try {
    await setup(page);
    if (page.__jlptTask2.requests.some((x) => /jlpt-exams\/\d+$/.test(x.p)))
      throw new Error('Grid fetched per-card detail');
    await page.getByRole('button', { name: 'Thêm đề thi', exact: true }).click();
    await page.getByRole('button', { name: 'Tạo đề thi', exact: true }).click();
    await page.getByText('Nhập tiêu đề đề thi.', { exact: true }).waitFor();
    return [await create(page), await filters(page), await extras(page)];
  } finally {
    await page.unroute('**/api/v1/**');
  }
}
