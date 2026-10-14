# Student lesson learning

Route: `/student/courses/[id]/lessons/[lessonId]`. The server page validates positive safe integer IDs.
The inherited student layout supplies AuthGuard, StudentSidebar and AdminShell. The feature validates
the returned lesson's ID and course ID before mounting content, optional queries or progress tracking.

Design reference: `UI/user/source.html`, source detail/lesson curriculum and four content modules.
The requested dedicated page replaces the reference's inline accordion with course navigation and four
accessible tabs. It retains the existing rounded cards, navy/sky palette and semantic module tints.
Mock audio, writing tools, scores and attempt history from the HTML are omitted because APIs do not supply them.

`apis/study/study.api.ts` uses the existing authorized Axios instance and `RestResponse.data` wrappers.
Existing study helpers in `apis/lessons/lesson-content.api.ts` delegate to this module; quiz types are
re-exported there for the existing admin preview. The quiz helper now accurately returns `null` for HTTP 204.
Quiz HTTP 204 becomes `null`; access/network errors remain errors. Query keys contain authenticated user,
course and lesson IDs. Optional queries run when their section is opened. Successful progress writes update
the relevant lesson cache and invalidate course lessons/progress and enrollment/dashboard query prefixes.
GETs use TanStack Query's cancellation signal. Mutations have no automatic retry.

The backend's `LessonServiceImpl` sanitizes grammar on create/PUT/PATCH using `GrammarHtmlSanitizer`'s
Jsoup allowlist, removing scripts, style attributes, unsafe URLs and embedded content. This page only renders
grammar from that protected response. CSS-module typography and content containment constrain its layout.

Native `<video controls playsInline>` follows the existing player convention. No playback position is stored
or restored. `watchDuration` is cumulative real playback seconds, initialized from saved progress; seeking,
paused time and buffering do not add watch time. Fractional watched seconds are floored and actual metadata
runtime is rounded up to whole seconds to satisfy the integer API without crediting unwatched fractions.
Estimated lesson minutes are never used as video runtime.

Saves happen after 15 additional watched seconds, on pause/end, when the page is hidden and on unmount.
Writes serialize/coalesce by lesson, stop after an error until explicit retry, and use captured lesson IDs.
Navigation flushes only that lesson's dirty progress; late responses update only its user/course/lesson cache.
Session revision checks prevent queued work crossing a logout/login. Browser shutdown delivery is best effort.
Server responses determine completion; neither opening content nor answering quiz questions completes a lesson.
Text-only lessons have no invented duration or completion action.

Only `SINGLE_CHOICE` has interactive answer controls. Legacy other types can be read without sending an
unsupported answer shape. Feedback uses only `correct`, `correctOptionId`, `message`; there are no explanations,
final score or persisted attempts in this API. Vocabulary/kanji have no media URLs, so no audio/image controls
are fabricated. The backend contract is described in `doc/api/student-learning.md`.

Focused checks: `node --test tests/student-lessons.test.mjs`; `pnpm lint`; `pnpm build`.

Browser regression scripts run through Playwright MCP's `browser_run_code_unsafe` with `filename`:
`fontend/tests/student-lessons.browser.mjs` creates an isolated context, intercepts all API calls, and
exercises playback with an in-memory PCM fixture. Start on a local application URL. It never writes to the
development backend. `fontend/tests/student-lessons.live.browser.mjs` starts signed in on an enrolled course
or lesson URL, discovers real lesson IDs, and performs only study GETs. Credentials are supplied in the
browser session and never stored in these scripts.

Verified locally: 10 new focused tests and six related existing tests, 29 isolated browser checks and
14 live API/browser checks passed.
Live course 20 has ten lessons, no video URLs and no published quizzes, so playback/progress writes and quiz
answers were verified with intercepted contract responses rather than live mutations. Desktop (1440px) and
mobile (375px) screenshots and overflow checks were inspected. The full production build passes; full lint
still fails on the pre-existing `components/common/card/CardItem.tsx:42` equality error (six existing warnings).
