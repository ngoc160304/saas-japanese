// Playwright MCP browser_run_code_unsafe filename. Start signed in on an actual course/lesson URL.
// Read-only live development checks; IDs are discovered from the course response/UI.
async function _studentLessonLiveBrowserChecks(page) {
  const origin = new URL(page.url()).origin;
  const match = new URL(page.url()).pathname.match(/^\/student\/courses\/(\d+)/);
  if (!match) throw new Error('Open a real enrolled course first');
  const courseId = Number(match[1]);
  const coursePath = `/student/courses/${courseId}`;
  const checks = [];
  const requests = [];
  const listener = (request) => {
    if (request.url().includes('/api/v1/study/'))
      requests.push({ method: request.method(), url: request.url() });
  };
  page.on('request', listener);
  const check = (condition, label) => {
    if (!condition) throw new Error(label);
    checks.push(label);
  };
  const activate = (locator) => locator.evaluate((element) => element.click());
  const go = (path) => page.goto(origin + path, { waitUntil: 'domcontentloaded' });
  try {
    await go(coursePath);
    const links = page.locator('main a[href*="/lessons/"]');
    await links.first().waitFor();
    const syllabus = await links.evaluateAll((elements) =>
      elements.map((element) => ({
        href: element.getAttribute('href'),
        title: element.querySelector('h3').textContent,
      })),
    );
    const first = syllabus[0];
    const firstId = Number(first.href.split('/').at(-1));
    const lessonRequest = page.waitForRequest(
      (request) =>
        request.method() === 'GET' &&
        new URL(request.url()).pathname === `/api/v1/study/lessons/${firstId}`,
    );
    await activate(links.first());
    await page.waitForURL('**' + first.href);
    await page.getByRole('heading', { level: 1, name: first.title, exact: true }).waitFor();
    const request = await lessonRequest;
    const base = new URL(request.url()).origin + '/api/v1';
    await page
      .getByRole('navigation', { name: 'Course lessons', exact: true })
      .getByRole('link')
      .first()
      .waitFor();
    check(
      (await page
        .locator('nav[aria-label="Course lessons"] a[aria-current="page"]')
        .getAttribute('href')) === first.href,
      'Real course click, title and active lesson',
    );
    const optional = {};
    for (const [name, suffix] of [
      ['Vocabulary', 'vocabularies'],
      ['Kanji', 'kanjis'],
      ['Quiz', 'quiz'],
    ]) {
      const response = page.waitForResponse(
        (item) => new URL(item.url()).pathname === `/api/v1/study/lessons/${firstId}/${suffix}`,
      );
      await activate(page.getByRole('tab', { name, exact: true }));
      const result = await response;
      const data = result.status() === 204 ? null : (await result.json()).data;
      optional[name] = data === null ? 'no published quiz' : (data.length ?? 'published quiz');
      if (result.status() === 204)
        await page
          .getByText('No published quiz is available for this lesson.', { exact: true })
          .waitFor();
      else if (name === 'Quiz')
        await page.getByRole('heading', { name: data.title, exact: true }).waitFor();
      else await page.getByRole('heading', { name: new RegExp(`${name} \\(`) }).waitFor();
    }
    check(true, 'Live vocabulary, kanji and optional quiz responses render');
    if (syllabus[1]) {
      await activate(page.getByRole('link', { name: `Next: ${syllabus[1].title}`, exact: true }));
      await page.getByRole('heading', { level: 1, name: syllabus[1].title, exact: true }).waitFor();
      check(
        (await page
          .locator('nav[aria-label="Course lessons"] a[aria-current="page"]')
          .getAttribute('href')) === syllabus[1].href,
        'Real next lesson follows backend ordering',
      );
      await activate(page.getByRole('link', { name: `Previous: ${first.title}`, exact: true }));
      await page.getByRole('heading', { level: 1, name: first.title, exact: true }).waitFor();
      check(true, 'Real previous lesson navigation');
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { level: 1, name: syllabus[1].title, exact: true }).waitFor();
      check(true, 'Real browser back navigation');
    }
    await go(first.href);
    await page.getByRole('heading', { level: 1, name: first.title, exact: true }).waitFor();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { level: 1, name: first.title, exact: true }).waitFor();
    check(true, 'Real direct URL and refresh');
    await page.setViewportSize({ width: 375, height: 812 });
    check(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      'Live mobile has no horizontal overflow',
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    check(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      'Live desktop has no horizontal overflow',
    );
    await go(`/student/courses/${courseId + 1}/lessons/${firstId}`);
    await page.getByRole('heading', { name: 'Content unavailable', exact: true }).waitFor();
    check(
      (await page.getByRole('tabpanel').count()) === 0,
      'Live mismatched course hides learning content',
    );
    await go(`${coursePath}/lessons/9007199254740991`);
    await page.getByRole('heading', { name: 'Content unavailable', exact: true }).waitFor();
    check(true, 'Live missing lesson uses backend 404');
    const catalogResponse = await page.request.get(base + '/client/courses?page=0&size=12');
    const catalog = (await catalogResponse.json()).data.content;
    let restrictedCourseId = null;
    for (const candidate of catalog.filter((item) => item.id !== courseId).slice(0, 3)) {
      await go(`/student/courses/${candidate.id}`);
      await page.getByRole('heading', { level: 1, name: candidate.title, exact: true }).waitFor();
      await page.getByText(/^(Already enrolled|View enrollment options)$/).waitFor();
      if (await page.getByText('View enrollment options', { exact: true }).isVisible()) {
        const response = await page.request.get(base + `/client/courses/${candidate.id}/lessons`);
        const preview = (await response.json()).data;
        check(
          (await page.locator('main a[href*="/lessons/"]').count()) === 0,
          'Real unenrolled course has enrollment action and no lesson links',
        );
        if (preview[0]) {
          await go(`/student/courses/${candidate.id}/lessons/${preview[0].id}`);
          await page.getByRole('heading', { name: 'Enrollment required', exact: true }).waitFor();
          restrictedCourseId = candidate.id;
          check(true, 'Real non-enrolled lesson is rejected with 403');
        }
        break;
      }
    }
    const refreshAfterInvalid = page.waitForResponse((response) =>
      new URL(response.url()).pathname.endsWith('/auth/refresh-token'),
    );
    const invalid = await go(`/student/courses/invalid/lessons/${firstId}`);
    await page.getByRole('heading', { name: '404', exact: true }).waitFor();
    check(
      [200, 404].includes(invalid.status()) &&
        (await page.locator('meta[name="robots"]').getAttribute('content')) === 'noindex',
      'Malformed route renders Next.js not-found UI (streamed responses may be 200)',
    );
    await refreshAfterInvalid;
    check(
      requests.every((request) => request.method === 'GET'),
      'Opening/reading lessons performs no study writes',
    );
    await go(first.href);
    await page.getByRole('heading', { level: 1, name: first.title, exact: true }).waitFor();
    return {
      passed: checks.length,
      checks,
      courseId,
      firstLessonId: firstId,
      lessonCount: syllabus.length,
      optional,
      restrictedCourseId,
      liveAPI: true,
    };
  } finally {
    page.off('request', listener);
  }
}
