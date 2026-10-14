# Admin lesson workspace logic audit

Scope: `/admin/courses/:courseId/lessons/:lessonId`, its tabs, curriculum links,
metadata editing, publication, media and preview. Investigated on 2026-10-13 and verified on 2026-10-14.
No schema migration, deployment, authentication-policy change or UI redesign.

## Sources of truth and request flow

The route renders `LessonGrammarPage`, which loads the course and lesson and checks
their IDs/association before mounting a keyed `LessonContentWorkspace`. Requests use
the existing authorized Axios instance and unwrap `RestResponse.data`; list APIs
return `PageResponse`. UI pages are one-based; HTTP pagination is zero-based.

| Feature | Frontend state / client | Backend / persisted source |
| --- | --- | --- |
| Title, duration, publication | Lesson detail query, `LessonForm`, `lessonAPI` | `LessonController` → `LessonServiceImpl` → `LessonRepository` → `Lesson` |
| Grammar | Workspace reducer with draft/baseline/server values; `lessonAPI.updateGrammar` | Sanitized `Lesson.grammar` HTML |
| Add Grammar Point | Dialog appends heading/content to the local grammar draft; separate Save persists it | **No separate grammar-point entity, table or endpoint exists in the runtime implementation.** This dialog is not a structured-record CRUD interface. |
| Curriculum | Complete paginated lesson collection, ID ascending, filtered locally | Lessons belonging to the course; no persisted lesson sort order or drag/reorder endpoint |
| Vocabulary | Lesson-scoped query, content mutation hook, `vocabularyAPI` | `VocabularyController` → `VocabularyServiceImpl` → repository; `Vocabulary.lesson` and `deletedAt` |
| Kanji | Lesson-scoped query, content mutation hook, `kanjiAPI` | `KanjiController` → `KanjiServiceImpl` → repository; `Kanji.lesson` and `deletedAt`; existing global active-character uniqueness rule |
| Video | File/upload/attachment phases in `useLessonVideo`; upload then attach | Upload service/provider creates `Media`; lesson service atomically changes `Lesson.videoMedia` and `Media.isUsed` |
| Quiz | `useAdminLessonQuiz`, `adminQuizAPI`; server response is authoritative | Lesson quiz service/repositories: quiz → questions → options; persisted question/option sort order; separate quiz publication |
| Preview | Fresh saved lesson and admin child queries; no progress write | Same saved records as the workspace; correct-answer fields omitted from displayed quiz projection |
| Student read | Existing `/study` APIs | Same persisted lesson/content/quiz entities, published visibility and existing access checks; student quiz response omits answer keys |

Tab changes update `?tab=`. Grammar drafts survive tab changes and are cached by
course/lesson in the session query cache when the workspace unmounts. Explicit
discard clears the draft. In-app navigation guards and `beforeunload` remain;
draft caching also protects history navigation. Session changes clear the existing
application query cache. Video files remain local until upload; failed attachment
can reuse uploaded media without uploading twice.

## Confirmed defects and fixes

1. **Quiz GET 500:** the supplied Spring trace identifies unnamed `Long` handler
   arguments in an IDE build without parameter-name metadata. Quiz path variables
   now explicitly name each route parameter. Vocabulary path variables had the
   same dependency and now name `id` explicitly.
2. **Destructive metadata contract:** PUT always assigned grammar, so an omitted
   property erased saved HTML. The metadata UI also labeled that same field as
   notes and coerced unknown duration to zero. PUT now distinguishes omitted
   grammar from explicit null/empty, preserves omissions, accepts nullable
   duration, validates title/publication/course, and rejects a wrong course.
   Metadata editing sends metadata only and links to the existing grammar editor.
3. **Child ownership race:** vocabulary/Kanji UI checked ownership with GET, then
   used generic PUT/DELETE that could operate on a reassigned record. The workspace
   now sends expected `lessonId` on GET/PUT/DELETE. Services check it while holding
   a write lock for mutations; attempts to move a scoped record fail. The optional
   context preserves generic content-management reassignment semantics.
4. **Invalid list queries / hidden parents:** missing/deleted parents were treated
   as empty lists; size zero reached paging and failed internally. Scoped lists
   validate parent and pagination. Lesson reads/writes, quiz reads and student
   reads reject lessons under deleted courses.
5. **Kanji update bypassed create uniqueness:** updates now exclude their own ID
   when checking active duplicates and return conflict. Stored character trimming
   matches the existing uniqueness lookup.
6. **Stale frontend state:** full lesson mutation responses could replace unrelated
   fields, an unmounted grammar save skipped cache reconciliation, and lesson
   create/edit/delete missed the curriculum cache. Reads now support cancellation;
   grammar/publication/video reconcile their own fields and originating caches,
   even after navigation, subject to session checks. Metadata forms are keyed by
   route identity; duplicate submissions and late redirects are guarded.
7. **Stale parent errors:** workspace validation previously accepted retained data
   even after a parent refetch failed. Error states now take precedence, while the
   grammar draft remains recoverable in the session cache.

Backend regressions were run red before the fixes: omitted grammar, validation,
scoped vocabulary, scoped Kanji, invalid list queries and deleted parents failed.
The uniqueness regression was then corrected to use a valid-length fixture and
verified with the fixed implementation.

## API inventory

All paths below have `/api/v1` prefix. `L` = lesson, `C` = course, `Q` = quiz,
`I` = content record, `N` = question. Existing access policy remains authoritative:
writes require admin; generic content reads retain their established policy;
admin quiz endpoints require admin for reads and writes.

| Action | Method/path | Failure evidence | Final implementation status |
| --- | --- | --- | --- |
| Load course/lesson | `GET /courses/C`, `GET /lessons/L` | Stale cached parent accepted; deleted course did not hide lesson | Error gating, association checks, active parent checks |
| Curriculum/navigation | `GET /lessons?courseId=C&page=0&size=12&sortKey=id&sortType=ASC` | Create/edit/delete omitted curriculum invalidation | Complete pagination retained; cache refreshed; navigation keeps identity |
| Create lesson | `POST /lessons` | Curriculum cache missed new lesson | Existing validated persistence retained; invalidate curriculum |
| Metadata | `PUT /lessons/L` | Regression: omitted HTML cleared, invalid input reached service, wrong course accepted | Validated, scoped, omitted grammar preserved, nullable duration |
| Save grammar | `PATCH /lessons/L/grammar` | Full response/cache races and unmount skipped reconciliation | Field-specific merge, cancellable reads, draft preservation |
| Publish/hide lesson | `PATCH /lessons/L/publication` | Same full-response cache risk | Merge publication only; refresh curriculum/public reads |
| Delete lesson | `DELETE /lessons/L` | Retained detail/curriculum/admin cache entries | Existing soft delete retained; originating caches cleared/refreshed |
| List content | `GET /vocabularies?lessonId=L`, `GET /kanjis?lessonId=L` | Invalid parent returned empty success; size zero invalid | Parent and paging validation; all pages read |
| Create content | `POST /vocabularies`, `POST /kanjis` (body `lessonId`) | Deleted course parent accepted | Active parent required; existing DTO validation retained |
| Read/edit/delete content | `GET/PUT/DELETE /vocabularies/I?lessonId=L`, same for `/kanjis/I` | Wrong parent ignored; frontend-only preflight race | Server ownership check; locked writes; Kanji duplicate conflict |
| Upload/attach/replace/detach | `POST /upload/videos`; `PATCH/DELETE /lessons/L/video` | No confirmed persistence defect in existing media transaction; late read cache risk | Existing usage transaction/retry retained; cache cancellation added |
| Read/create quiz | `GET/POST /admin/lessons/L/quiz` | Reported argument-binding 500 | Explicit path names; valid absence remains 204 |
| Quiz metadata/publication/delete | `PUT/DELETE /admin/lessons/L/quiz/Q`; `PATCH .../Q/publication` | Same unnamed route arguments | Explicit names; existing ownership/transaction rules retained |
| Question CRUD/order | `POST .../Q/questions`; `PUT/DELETE .../Q/questions/N`; `PUT .../Q/questions/order` | Same unnamed route arguments | Explicit names; existing full-order validation retained |
| Preview | Fresh lesson + content + admin quiz GETs above | No additional persistence defect confirmed | Saved-record projection, error/retry and unsaved-draft guard retained |
| Student content | `GET /study/lessons/L`, `.../vocabularies`, `.../kanjis`, `.../quiz` | Deleted-course lesson remained readable | Active parent checks; shared saved source and answer-key omission retained |

## Verification

Focused backend coverage: all 8 tests in `AdminLessonWorkspaceIntegrationTest`,
6 in `LessonContentIntegrationTest`, 14 in `AdminLessonQuizIntegrationTest`, and
2 in `UploadServiceVideoValidationTest` passed. Frontend draft/schema/video tests:
10 passed. Existing browser suites
`lesson-workspace-phase2`, `lesson-content-phase4`, `lesson-quiz-phase6` passed;
these simulate API responses for failure/race coverage.

The opt-in `AdminLessonWorkspaceBrowserTest` starts a real backend on port 18080
with disposable H2 records and generated credentials. Chrome loads the existing
Next server on port 3000 and routes API requests to that test backend. It does not
mock successful API responses or write to local MySQL. One deliberately failed
grammar request verifies error/input retention. The test requires Chrome and Node.

```powershell
# Start the usual frontend on localhost:3000, then from backend/:
$env:LESSON_LIVE_BROWSER = 'true'
.\gradlew.bat test --tests '*AdminLessonWorkspaceBrowserTest'
Remove-Item Env:LESSON_LIVE_BROWSER
```

The real-backend browser test passed on 2026-10-14. It verified real login/CSRF,
grammar save and full reload, a deliberately failed save with retained input,
metadata preservation and nullable duration, publication, vocabulary and Kanji
CRUD plus wrong-parent rejection, quiz creation/questions/order/publication/delete,
student content projections without answer keys, saved preview, and grammar draft
restoration through browser back/forward between two different lessons. Java then
re-read the persisted lesson and asserted its HTML, title, duration and publication.

`pnpm build` passed, including production compilation, TypeScript and static page
generation. The separate TypeScript check also passed.

Focused ESLint over all changed frontend implementation files and the new browser
test passed. Full frontend lint reports the established 12 errors / 18 warnings
in unrelated files. No lesson-workspace files appear in those diagnostics.

`gradlew.bat check --continue --max-workers=1` compiled Java 17 and ran 147 tests:
140 passed, 6 failed, 1 skipped (the opt-in browser test was run separately).
The six failures match the documented baseline: three in `AdminJlptExamIntegrationTest`,
two in `AuthIntegrationTest`, and
`LessonIntegrationTest.courseDeletionIsScopedAndRetainsPreviouslyDeletedTimestamp`.
That last test targets the pre-existing unimplemented bulk course-lesson deletion
endpoint, which is not called by this workspace. Checkstyle remains at 66 main / 1
test violations; existing SpotBugs findings also prevent a clean application check.
After narrowing the browser test's checked exceptions, `spotbugsTest` was rerun:
13 existing findings remain, with none in the new workspace tests.

Remaining limits: the browser/database test uses disposable H2, not the existing
MySQL lesson 44. External Cloudinary upload was not exercised against a paid/live
provider; media validation, attachment usage and retries are covered by existing
backend tests and simulated browser requests. No local business records were
changed. Rebuild/restart any IDE backend still using old class files to apply the
explicit path-variable fix.

## Changed-file map

- Backend HTTP/contracts: `AdminLessonQuizController.java`, `LessonController.java`,
  `VocabularyController.java`, `KanjiController.java`, `ReqUpdateLesson.java`,
  `VocabularyQuery.java`, `KanjiQuery.java`.
- Backend persistence/ownership: `LessonRepository.java`, `VocabularyRepository.java`,
  `KanjiRepository.java`, `LessonSpecs.java`, vocabulary/Kanji service interfaces and
  implementations, `LessonServiceImpl.java`, `AdminLessonQuizServiceImpl.java`,
  `StudyServiceImpl.java`, `KanjiMapper.java`.
- Frontend contracts: `apis/lessons/lessons.api.ts`, `lessons.type.ts`,
  `lesson-content.api.ts`.
- Frontend state: `useLessonWorkspaceActions.ts`, `useLessonContentMutation.ts`,
  `useLessonVideo.ts`.
- Frontend composition/forms/navigation: `LessonGrammarPage.tsx`,
  `LessonContentWorkspace.tsx`, `LessonForm.tsx`, `LessonEditPage.tsx`,
  `LessonCreatePage.tsx`, `LessonDeleteDialog.tsx`.
- Regression coverage: `AdminLessonWorkspaceIntegrationTest.java`,
  `AdminLessonWorkspaceBrowserTest.java`, `tests/lesson-workspace-live.browser.mjs`.

Pre-existing changes to `GrammarPointDialog.tsx` and
`lesson-workspace-phase2.browser.mjs` were preserved.
