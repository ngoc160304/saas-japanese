// Run with Playwright MCP browser_run_code_unsafe, filename: fontend/tests/student-lessons.browser.mjs.
// An isolated browser context intercepts every API call. No development user or lesson is modified.
// DOM activation is used because this Windows MCP session drops native pointer/key input events.
async function _studentLessonBrowserChecks(page) {
  const context = await page
    .context()
    .browser()
    .newContext({ viewport: { width: 1440, height: 1000 } });
  const browserPage = await context.newPage();
  const origin = new URL(page.url()).origin;
  const courseId = 9741;
  const lessonIds = [17801, 17805];
  const checks = [];
  const calls = [];
  let enrolled = true;
  let session = true;
  let accessStatus = 200;
  let quizMode = 'published';
  let failAnswer = true;
  let failProgress = true;
  let progressDelay = 0;
  const completed = new Map();
  const course = {
    id: courseId,
    title: 'Contract learning course',
    slug: 'contract-course',
    description: null,
    categoryName: null,
    lessonCount: 2,
    price: 0,
    thumnailURL: null,
    totalDurationMinutes: 12,
    updatedAt: '2026-10-14T10:00:00Z',
  };
  const lessons = lessonIds.map((id, index) => ({
    id,
    courseId,
    title: index === 0 ? 'Reading and video A' : 'Optional content B',
    slug: `contract-${id}`,
    grammar: index === 0 ? '<h2>Real response heading</h2><p>Grammar fixture A</p>' : null,
    durationMinutes: index === 0 ? 12 : null,
    videoUrl: index === 0 ? `${origin}/__lesson-test.wav` : null,
  }));
  const zero = (id) => ({
    lessonId: id,
    watchDuration: 0,
    videoDuration: 0,
    progressPercent: 0,
    isCompleted: false,
    completedAt: null,
    lastWatchedAt: null,
    courseProgressPercent: 0,
  });
  const progressFor = (id) => completed.get(id) ?? zero(id);
  const courseProgress = () => {
    const count = [...completed.values()].filter((item) => item.isCompleted).length;
    return {
      courseId,
      courseTitle: course.title,
      totalLessons: 2,
      completedLessons: count,
      progressPercent: count * 50,
      completedAt: count === 2 ? '2026-10-14T10:00:00Z' : null,
    };
  };
  const summaries = () =>
    lessons.map(({ grammar: _grammar, videoUrl: _video, ...lesson }) => {
      const {
        lessonId: _id,
        courseProgressPercent: _percent,
        ...progress
      } = progressFor(lesson.id);
      return { ...lesson, ...progress };
    });
  const quiz = {
    id: 24001,
    title: 'Published practice',
    description: 'Choose one reading.',
    questions: [
      {
        id: 25001,
        questionType: 'SINGLE_CHOICE',
        questionText: 'Reading of 学生?',
        sortOrder: 0,
        options: [
          { id: 26001, optionText: 'がくせい', sortOrder: 0 },
          { id: 26002, optionText: 'せんせい', sortOrder: 1 },
        ],
      },
      {
        id: 25002,
        questionType: 'MULTIPLE_CHOICE',
        questionText: 'Legacy question',
        sortOrder: 1,
        options: [{ id: 26003, optionText: 'Legacy option', sortOrder: 0 }],
      },
    ],
  };
  // A short PCM media fixture exercises real HTMLVideoElement timing without external media traffic.
  const samples = 8 * 8000;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(samples * 2, 40);
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
    checks.push(message);
  };
  const activate = async (locator) => {
    await locator.waitFor({ state: 'visible' });
    await locator.evaluate((el) => el.click());
  };
  const route = (id = lessonIds[0], parent = courseId) =>
    `/student/courses/${parent}/lessons/${id}`;
  const go = (path) => browserPage.goto(origin + path, { waitUntil: 'domcontentloaded' });
  const waitHeading = (text) =>
    browserPage.getByRole('heading', { level: 1, name: text, exact: true }).waitFor();
  const studyPosts = (suffix) =>
    calls.filter(
      (call) =>
        call.method === 'POST' && call.path.includes('/study/') && call.path.endsWith(suffix),
    );
  const settled = async (predicate) => {
    for (let i = 0; i < 200; i++) {
      if (predicate()) return;
      await browserPage.waitForTimeout(25);
    }
    throw new Error('Request did not settle');
  };
  await context.route('**/*', async (intercept) => {
    const request = intercept.request();
    const url = new URL(request.url());
    if (url.pathname === '/__lesson-test.wav')
      return intercept.fulfill({ status: 200, contentType: 'audio/wav', body: wav });
    if (!url.pathname.startsWith('/api/v1/')) return intercept.continue();
    const path = url.pathname.slice('/api/v1'.length);
    const method = request.method();
    calls.push({
      path,
      method,
      body: request.postData(),
      optionId: url.searchParams.get('optionId'),
    });
    const send = (data, status = 200) =>
      intercept.fulfill({
        status,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-XSRF-TOKEN',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
        body:
          status === 204
            ? ''
            : JSON.stringify(
                status >= 400
                  ? { status, message: 'Fixture error', fieldErrors: {} }
                  : { statusCode: status, error: null, message: 'CALL API SUCCESS !', data },
              ),
      });
    if (method === 'OPTIONS') return send(null, 204);
    if (path === '/auth/csrf')
      return send({ token: 'contract-test-only', headerName: 'X-XSRF-TOKEN' });
    if (path === '/auth/refresh-token')
      return session
        ? send({
            access_token: 'contract-test-only',
            tokenType: 'Bearer',
            expiresIn: 600,
            user: { id: 8741, email: 'fixture@example.test', name: 'Fixture Student' },
          })
        : send(null, 401);
    if (path === `/client/courses/${courseId}`) return send(course);
    if (path === `/client/courses/${courseId}/lessons`)
      return send(
        lessons.map(({ id, title, slug, durationMinutes }) => ({
          id,
          title,
          slug,
          durationMinutes,
        })),
      );
    if (path === '/courses/my-courses')
      return send({
        content: enrolled
          ? [
              {
                Id: 7741,
                userId: 8741,
                courseId,
                courseTitle: course.title,
                progressPercent: 0,
                enrollAt: '2026-10-14T10:00:00Z',
                completedAt: null,
              },
            ]
          : [],
        totalPages: 1,
        totalElements: enrolled ? 1 : 0,
      });
    if (path.startsWith('/study/')) {
      if (!enrolled || accessStatus !== 200) return send(null, enrolled ? accessStatus : 403);
      if (path === `/study/courses/${courseId}/lessons`) return send(summaries());
      if (path === `/study/courses/${courseId}/progress`) return send(courseProgress());
      const id = Number(path.split('/')[3]);
      const lesson = lessons.find((item) => item.id === id);
      if (!lesson) return send(null, 404);
      if (path.endsWith('/answer')) {
        await browserPage.waitForTimeout(250);
        if (failAnswer) return send(null, 500);
        const correct = url.searchParams.get('optionId') === '26001';
        return send({
          correct,
          correctOptionId: 26001,
          message: correct ? 'Well done.' : 'Keep practicing.',
        });
      }
      if (path.endsWith('/progress')) {
        if (method === 'GET')
          return send({
            ...progressFor(id),
            courseProgressPercent: courseProgress().progressPercent,
          });
        if (progressDelay) await browserPage.waitForTimeout(progressDelay);
        if (failProgress) return send(null, 500);
        const data = request.postDataJSON();
        const watched = Math.max(
          progressFor(id).watchDuration,
          Math.min(data.watchDuration, data.videoDuration),
        );
        const isCompleted = watched / data.videoDuration >= 0.8 || progressFor(id).isCompleted;
        completed.set(id, {
          ...zero(id),
          ...data,
          watchDuration: watched,
          progressPercent: Math.round((watched / data.videoDuration) * 10000) / 100,
          isCompleted,
          lastWatchedAt: '2026-10-14T10:00:00Z',
          completedAt: isCompleted ? '2026-10-14T10:00:00Z' : null,
        });
        return send({
          ...progressFor(id),
          courseProgressPercent: courseProgress().progressPercent,
        });
      }
      if (path.endsWith('/vocabularies'))
        return send(
          id === lessonIds[0]
            ? [
                {
                  id: 29001,
                  lessonId: id,
                  word: '学生',
                  reading: 'がくせい',
                  meaningVi: 'Học sinh',
                  partOfSpeech: null,
                  exampleSentenceJp: '私は学生です。',
                  exampleSentenceVi: null,
                },
              ]
            : [],
        );
      if (path.endsWith('/kanjis'))
        return send(
          id === lessonIds[0]
            ? [
                {
                  id: 29002,
                  lessonId: id,
                  kanji: '学',
                  onyomi: 'ガク',
                  kunyomi: null,
                  meaningVi: 'Học',
                  strokeCount: 8,
                  exampleWords: null,
                },
              ]
            : [],
        );
      if (path.endsWith('/quiz'))
        return quizMode === 'error'
          ? send(null, 500)
          : quizMode === 'empty' || id === lessonIds[1]
            ? send(null, 204)
            : send(quiz);
      return send(lesson);
    }
    return send(null, 404);
  });
  try {
    await go(`/student/courses/${courseId}`);
    await waitHeading(course.title);
    const first = browserPage.locator(`main a[href="${route()}"]`);
    await activate(first);
    await browserPage.waitForURL('**' + route());
    await waitHeading(lessons[0].title);
    await browserPage.getByRole('progressbar', { name: 'Lesson progress', exact: true }).waitFor();
    check(
      (await browserPage
        .locator('nav[aria-label="Course lessons"] a[aria-current="page"]')
        .getAttribute('href')) === route(),
      'Course click and active lesson',
    );
    check(studyPosts('/progress').length === 0, 'Opening creates no progress writes');
    check(
      !calls.some((call) => /vocabularies|kanjis|\/quiz$/.test(call.path)),
      'Optional sections are lazy',
    );
    const nativeVideo = browserPage.locator('video');
    await nativeVideo.evaluate((video) => {
      video.muted = true;
    });
    await browserPage.waitForFunction(() =>
      Number.isFinite(document.querySelector('video')?.duration),
    );
    await nativeVideo.evaluate((video) => video.play());
    await browserPage.waitForTimeout(2300);
    check(studyPosts('/progress').length === 0, 'Time updates are throttled');
    await nativeVideo.evaluate((video) => video.pause());
    await browserPage
      .getByText('Your latest viewing progress could not be saved.', { exact: true })
      .waitFor();
    const failedPosts = studyPosts('/progress').length;
    await browserPage.waitForTimeout(400);
    check(
      studyPosts('/progress').length === failedPosts,
      'Failed saves do not automatically retry',
    );
    failProgress = false;
    await activate(browserPage.getByRole('button', { name: 'Retry save', exact: true }));
    await browserPage.getByText('Progress saved.', { exact: true }).waitFor();
    check(studyPosts('/progress').length === failedPosts + 1, 'Explicit progress retry');
    await nativeVideo.evaluate((video) => video.play());
    await browserPage.waitForFunction(() => document.querySelector('video')?.ended === true);
    await settled(() => progressFor(lessonIds[0]).isCompleted);
    await browserPage.waitForFunction(
      () => Number(document.querySelector('progress[aria-label="Course progress"]')?.value) === 50,
    );
    check(
      progressFor(lessonIds[0]).isCompleted,
      'Native playback/end uses server completion response',
    );
    check(
      studyPosts('/progress').every((call) => {
        const body = JSON.parse(call.body);
        return (
          Number.isInteger(body.watchDuration) && body.videoDuration === 8 && !('userId' in body)
        );
      }),
      'Progress seconds and ownership contract',
    );
    for (const name of ['Vocabulary', 'Kanji']) {
      await activate(browserPage.getByRole('tab', { name, exact: true }));
      await browserPage.getByRole('heading', { name: new RegExp(`${name} \\(`) }).waitFor();
    }
    check(
      (await browserPage.getByText('学', { exact: true }).count()) === 1,
      'Actual kanji fields render',
    );
    await browserPage
      .getByRole('tab', { name: 'Kanji', exact: true })
      .dispatchEvent('keydown', { key: 'ArrowRight', bubbles: true });
    await browserPage.getByRole('heading', { name: quiz.title, exact: true }).waitFor();
    check(
      (await browserPage.getByText('Correct answer', { exact: true }).count()) === 0 &&
        (await browserPage.getByText(/^(Correct\.|Incorrect\.)/).count()) === 0,
      'Initial quiz displays no answer feedback',
    );
    check(
      await browserPage.evaluate(() => document.activeElement?.id === 'study-tab-quiz'),
      'Arrow-key tabs and focus',
    );
    const answerForm = browserPage.locator('form').filter({ hasText: 'Reading of 学生?' });
    await activate(answerForm.getByRole('radio', { name: 'せんせい', exact: true }));
    await answerForm
      .getByRole('button', { name: 'Check answer', exact: true })
      .evaluate((button) => {
        button.click();
        button.click();
      });
    await answerForm.getByRole('alert').waitFor();
    check(studyPosts('/answer').length === 1, 'Duplicate pending answers are prevented');
    failAnswer = false;
    await activate(answerForm.getByRole('button', { name: 'Check answer', exact: true }));
    await answerForm.getByText('Incorrect. Keep practicing.', { exact: true }).waitFor();
    check(
      studyPosts('/answer').at(-1).optionId === '26002',
      'Answer uses query optionId and actual feedback',
    );
    check(
      (await browserPage
        .getByText('Interactive answers are unavailable for this question type.')
        .count()) === 1,
      'Unsupported question types are read-only',
    );
    await browserPage.setViewportSize({ width: 375, height: 812 });
    check(
      await browserPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      'Mobile has no horizontal overflow',
    );
    await browserPage.setViewportSize({ width: 1440, height: 1000 });
    check(
      await browserPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      'Desktop has no horizontal overflow',
    );
    await activate(
      browserPage.getByRole('link', { name: `Next: ${lessons[1].title}`, exact: true }),
    );
    await waitHeading(lessons[1].title);
    await browserPage
      .getByText('No grammar content has been published for this lesson.', { exact: true })
      .waitFor();
    check(
      (await browserPage.locator('video').count()) === 0,
      'Switching lessons clears old video and grammar',
    );
    check(
      (await browserPage
        .locator('nav[aria-label="Course lessons"] a[aria-current="page"]')
        .getAttribute('href')) === route(lessonIds[1]),
      'Next follows response ordering',
    );
    for (const [name, message] of [
      ['Vocabulary', 'No vocabulary has been added to this lesson.'],
      ['Kanji', 'No kanji have been added to this lesson.'],
      ['Quiz', 'No published quiz is available for this lesson.'],
    ]) {
      await activate(browserPage.getByRole('tab', { name, exact: true }));
      await browserPage.getByText(message, { exact: true }).waitFor();
    }
    check(true, 'Dedicated empty states for all optional sections');
    await browserPage
      .getByText('No published quiz is available for this lesson.', { exact: true })
      .waitFor();
    await browserPage.goBack({ waitUntil: 'domcontentloaded' });
    await waitHeading(lessons[0].title);
    await browserPage.reload({ waitUntil: 'domcontentloaded' });
    await waitHeading(lessons[0].title);
    check(true, 'Back, direct URL and refresh preserve the lesson route');
    await activate(browserPage.getByRole('tab', { name: 'Quiz', exact: true }));
    await browserPage.getByRole('heading', { name: quiz.title, exact: true }).waitFor();
    const correctForm = browserPage.locator('form').filter({ hasText: 'Reading of 学生?' });
    await activate(correctForm.getByRole('radio', { name: 'がくせい', exact: true }));
    await activate(correctForm.getByRole('button', { name: 'Check answer', exact: true }));
    await correctForm.getByText('Correct. Well done.', { exact: true }).waitFor();
    check(true, 'Correct answer feedback is server supplied');
    quizMode = 'error';
    await go(route());
    await waitHeading(lessons[0].title);
    await activate(browserPage.getByRole('tab', { name: 'Quiz', exact: true }));
    await browserPage
      .getByRole('heading', { name: 'Could not load this section', exact: true })
      .waitFor();
    quizMode = 'empty';
    await activate(
      browserPage
        .getByRole('tabpanel', { name: 'Quiz', exact: true })
        .getByRole('button', { name: 'Retry', exact: true }),
    );
    await browserPage
      .getByText('No published quiz is available for this lesson.', { exact: true })
      .waitFor();
    await activate(browserPage.getByRole('tab', { name: 'Grammar + Video', exact: true }));
    check(
      await browserPage.getByText('Grammar fixture A', { exact: true }).isVisible(),
      'Quiz failure and 204 do not block grammar',
    );
    await browserPage.locator('video').dispatchEvent('error');
    await browserPage
      .getByText('This video could not be played. You can continue with the other lesson sections.')
      .waitFor();
    check(
      await browserPage.getByText('Grammar fixture A', { exact: true }).isVisible(),
      'Video errors leave grammar readable',
    );
    await activate(browserPage.getByRole('button', { name: 'Reload video', exact: true }));
    completed.clear();
    progressDelay = 1000;
    await go(route());
    await waitHeading(lessons[0].title);
    await browserPage.waitForFunction(
      () =>
        Number.isFinite(document.querySelector('video')?.duration) &&
        document.querySelector('progress[aria-label="Lesson progress"]')?.value === 0,
    );
    await browserPage.locator('video').evaluate((video) => {
      video.muted = true;
      return video.play();
    });
    await browserPage.waitForTimeout(1600);
    const beforeNavigation = studyPosts('/progress').length;
    await browserPage.locator('video').evaluate((video) => video.pause());
    await settled(() => studyPosts('/progress').length > beforeNavigation);
    await activate(
      browserPage.getByRole('link', { name: `Next: ${lessons[1].title}`, exact: true }),
    );
    await waitHeading(lessons[1].title);
    await browserPage.waitForTimeout(1200);
    check(
      (await browserPage
        .getByRole('progressbar', { name: 'Lesson progress', exact: true })
        .getAttribute('value')) === '0',
      'Late progress responses do not overwrite the next lesson',
    );
    for (const status of [403, 404]) {
      accessStatus = status;
      await go(route());
      await browserPage
        .getByRole('heading', {
          name: status === 403 ? 'Enrollment required' : 'Content unavailable',
          exact: true,
        })
        .waitFor();
      check(
        (await browserPage.getByText('Grammar fixture A', { exact: true }).count()) === 0,
        `HTTP ${status} hides content`,
      );
    }
    accessStatus = 200;
    await go(route(lessonIds[0], courseId + 1));
    await browserPage.getByRole('heading', { name: 'Content unavailable', exact: true }).waitFor();
    check(
      (await browserPage.getByText('Grammar fixture A', { exact: true }).count()) === 0,
      'Mismatched course/lesson never displays content',
    );
    enrolled = false;
    await go(`/student/courses/${courseId}`);
    await browserPage.getByRole('button', { name: 'Enroll for free', exact: true }).waitFor();
    check(
      (await browserPage.locator('main a[href*="/lessons/"]').count()) === 0,
      'Unenrolled students see enrollment instead of lesson links',
    );
    enrolled = true;
    accessStatus = 401;
    session = false;
    await go(route());
    await browserPage.waitForURL('**/login?next=**');
    check(true, 'Expired authentication returns to login');
    return {
      passed: checks.length,
      checks,
      studyWrites: studyPosts('/progress').length,
      answers: studyPosts('/answer').length,
      liveAPI: false,
    };
  } finally {
    await context.close();
  }
}
