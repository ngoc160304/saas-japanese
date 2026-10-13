# Admin lesson Quiz API — phase 5 / phase 6 handoff

## Routes and authorization

`WebConfiguration` adds `/api/v1` to controllers. The controller mapping itself is
`/admin/lessons/{lessonId}/quiz`; do not add the prefix a second time in the configured Axios client.
All admin routes below require a valid access token with `ROLE_ADMIN`, including reads.
Use the existing authorized Axios instance, refresh/session handling, and error handling.
No authentication or CSRF strategy changed.

Let **B** = `/api/v1/admin/lessons/{lessonId}/quiz`:

| Method | Full route relative to B | Body | Success |
| --- | --- | --- | --- |
| GET | B | — | 200 with current Quiz; **204 with no body** if none |
| POST | B | Metadata | 201 with new draft Quiz |
| PUT | B`/{quizId}` | Metadata | 200 with updated Quiz |
| PATCH | B`/{quizId}/publication` | `{"isPublished":true}` or `false` | 200 with Quiz |
| DELETE | B`/{quizId}` | — | 204, empty body |
| POST | B`/{quizId}/questions` | Question and complete options | 201 with full Quiz |
| PUT | B`/{quizId}/questions/{questionId}` | Question and complete options | 200 with full Quiz |
| DELETE | B`/{quizId}/questions/{questionId}` | — | 204, empty body |
| PUT | B`/{quizId}/questions/order` | `{"questionIds":[102,101]}` | 200 with full Quiz |

All path IDs must be positive. Every operation validates the active lesson; writes also
validate the active Quiz under that lesson and the active question under that Quiz.
Associations cannot be reassigned. A foreign option ID or duplicate option ID is rejected.

**Empty versus missing:** GET B returns 204 only for an existing, non-deleted lesson with
no active Quiz. An absent/deleted lesson returns 404. A mutation addressing an absent,
deleted, replaced, or foreign Quiz/question returns 404. Do not parse 204 as JSON.

## Request examples and validation

Create/update metadata:

```json
{"title":"Bài 1 — Luyện tập","description":"Chọn đáp án đúng."}
```

- `title`: required nonblank string, at most 200 Java string characters.
- `description`: required non-null string, at most 500 characters; `""` is allowed.
- Surrounding whitespace is stripped. Internal text/newlines are preserved.
- Metadata updates change only these fields, never lesson association, questions or publication.
- Creation always creates a draft. An empty draft is valid.

Create question:

```json
{
  "questionText":"「学校」の読み方は？",
  "questionType":"SINGLE_CHOICE",
  "options":[
    {"optionText":"がっこう","isCorrect":true},
    {"optionText":"がくせい","isCorrect":false}
  ]
}
```

Update question (retain option 301, remove omitted old options, append a new option):

```json
{
  "questionText":"「学校」の読み方を選んでください。",
  "questionType":"SINGLE_CHOICE",
  "options":[
    {"id":301,"optionText":"がっこう","isCorrect":true},
    {"optionText":"せんせい","isCorrect":false}
  ]
}
```

- `questionText`: required, nonblank plain text, at most **65,535 UTF-8 bytes** (MySQL `TEXT`).
  This is a byte limit, not a Kanji-only or single-code-unit restriction.
- `questionType`: required; authoring accepts **SINGLE_CHOICE only**.
- `options`: required full array with at least two non-null elements, each with nonblank
  `optionText` (max 500 characters) and an explicit non-null Boolean `isCorrect`.
- Exactly one option must be correct, including on draft question writes.
- New options have no ID or `id:null`. Creation rejects all supplied option IDs.
- On update, existing option IDs must belong to this question and occur once at most.
  Supplied IDs are retained; missing/null IDs insert new rows. Omitted old options are removed.
  The entire replacement is atomic; validation/conflict leaves all old data intact.
- Options have no `deletedAt`. Removal checks database FK references first, including legacy
  `ON DELETE SET NULL` references, and returns 409 if referenced. Restrictive FK conflicts also
  roll back as 409. No lesson Quiz attempt entities exist in the current runtime model.
- All option ordering comes from array position (`sortOrder` 0, 1, …). Do not submit a separate
  option `sortOrder`. Surrounding text whitespace is stripped; Japanese text and line breaks stay intact.
- Text is plain text. Render it as text in phase 6; do not interpret strings as HTML.

## Response examples

Successful non-empty responses use the existing `RestResponse` envelope:

```json
{
  "statusCode":200,
  "error":null,
  "message":"Fetch admin lesson quiz",
  "data":{
    "id":20,
    "lessonId":7,
    "title":"Bài 1 — Luyện tập",
    "description":"Chọn đáp án đúng.",
    "isPublished":false,
    "createdAt":"2026-10-13T05:00:00Z",
    "updatedAt":"2026-10-13T05:02:00Z",
    "questions":[{
      "id":101,
      "questionType":"SINGLE_CHOICE",
      "questionText":"「学校」の読み方は？",
      "sortOrder":0,
      "authoringSupported":true,
      "createdAt":"2026-10-13T05:02:00Z",
      "updatedAt":"2026-10-13T05:02:00Z",
      "options":[
        {"id":301,"optionText":"がっこう","sortOrder":0,"isCorrect":true},
        {"id":302,"optionText":"がくせい","sortOrder":1,"isCorrect":false}
      ]
    }]
  }
}
```

Create responses have `statusCode:201`. Mutation messages are operation-specific. Use status
and data rather than comparing success messages. Question writes return the full aggregate,
which can replace only the originating admin Quiz cache.

Errors use the existing **unwrapped** `ErrorResponse`, for example:

```json
{
  "status":409,
  "message":"This lesson already has an active quiz",
  "fieldErrors":{},
  "timestamp":"2026-10-13T05:03:00Z"
}
```

| Status | Meaning |
| --- | --- |
| 400 | Bean validation, invalid enum/ID, unsupported requested type, invalid correct-answer count, foreign/duplicate option IDs, invalid reorder |
| 401 | Anonymous/invalid authentication |
| 403 | Authenticated without ADMIN authority |
| 404 | Missing/deleted parent or record, or Quiz/question outside requested parent |
| 409 | Duplicate active Quiz, inconsistent existing data, invalid publication, unsupported legacy mutation, referenced option removal |

Bean validation supplies paths such as `title`, `description`, `options`, `options[0].optionText`
in `fieldErrors`. Service business-rule errors supply a form-level `message` and empty field errors.

## Ordering, publication, deletion, concurrency

- Questions and options are returned in ascending `sortOrder`, then ID to resolve legacy ties.
  Options are fetched in a batch, not once per question.
- New questions append after the maximum active order. Deletion may leave gaps. Reorder
  normalizes to zero-based contiguous order, using **every active question ID exactly once**.
  Empty order is valid only for an empty draft. Missing, duplicate, foreign and deleted IDs fail.
- Publishing validates persisted metadata and every active question. There must be at least
  one question, every type must be SINGLE_CHOICE, and every question needs two valid options
  and exactly one correct answer.
- Quiz publication is independent of lesson publication; admins may prepare/publish a Quiz
  on a draft lesson. Student lesson eligibility checks remain in place.
- Writes to a published Quiz must leave the whole Quiz publishable. Deleting the final
  question or editing an invalid legacy published aggregate returns 409; **unpublish first**.
  A failed write never silently unpublishes. Unpublish changes publication and its timestamp only.
- Legacy MULTIPLE_CHOICE is returned with `authoringSupported:false`. It cannot be edited,
  converted, individually deleted, or included in a reorder in phase 5. It blocks publication.
  Existing data/publication is not rewritten automatically. Whole-Quiz archival keeps these rows intact.
- Quiz deletion sets Quiz `deletedAt`; question deletion sets question `deletedAt`. Neither
  hard-deletes its children. Nested admin and student paths always validate the active parent.
  Archiving a Quiz permits a new draft Quiz for that lesson.
- Every admin write locks the existing active **lesson** row with `PESSIMISTIC_WRITE` first,
  then reads/locks active Quizzes. This serializes concurrent create, publish, reorder and
  question/option writes without schema changes. Student answer evaluation uses the same
  parent lock. These guarantees cover these application APIs, not arbitrary external SQL writers.
- At most one active Quiz per lesson. If legacy duplicates exist, admin and student Quiz
  lookups return controlled 409; no row is selected/deleted arbitrarily. An operator must audit
  relationships/history and resolve duplicates with an explicitly approved data repair.
- Writes are serialized but there is no ETag/version-based stale-editor conflict contract.
  Phase 6 should capture lesson/Quiz/question/session identity and prevent duplicate submissions.

## Student compatibility

Existing paths stay:

- GET `/api/v1/study/lessons/{lessonId}/quiz`
- POST `/api/v1/study/lessons/{lessonId}/quiz/{quizId}/questions/{questionId}/answer?optionId=301`

Student delivery still uses `QuizResponse`/`QuizQuestionResponse`/`QuizOptionResponse`.
It never uses the admin DTO and never exposes `isCorrect` or an answer key initially.
A legitimate answer response retains `correct`, `correctOptionId`, and `message`.
Answer submission now explicitly requires authentication and rejects unpublished/deleted Quizzes.
Removed options, deleted questions and foreign IDs cannot be answered.

Existing Quiz study methods check active lesson and lesson publication; they do **not** currently
call the enrollment check used by lesson-detail/progress methods. This phase preserves that
eligibility behavior and does not redesign enrollment/course access. Existing legacy multiple-choice
delivery/grading behavior is not extended; new authoring/publication supports SINGLE_CHOICE only.

## Phase 6 frontend checklist

1. Replace the read-only `QuizSection` study lookup with this admin lookup after validated
   course/lesson context exists. Handle 204 distinctly from errors and 404.
2. Add endpoint-specific request/admin-response types beside the existing lesson API module,
   reuse authorized Axios and unwrap `response.data.data` only for non-empty responses.
3. Follow the existing admin content query convention with **new** key
   `['admin','lessons',lessonId,'quiz']`. The current read-only Quiz tab uses the existing key
   `['study','lessons',lessonId,'quiz']`; invalidate that exact originating key after mutations too.
4. Update/invalidate only the originating Quiz caches. Do not invalidate lesson metadata/grammar
   queries or reset grammar drafts, TinyMCE, video, publication, vocabulary or Kanji state.
5. Build metadata, question/options, publication and delete forms with field/form errors,
   retry, dirty-dismissal protection and one pending request per action.
6. Preserve option IDs on edits, send the complete options array and complete reorder ID list.
   Disable authoring for `authoringSupported:false`; explain publication conflicts.
7. Capture validated lesson/Quiz/question and session identities. Ignore misleading late UI
   success after navigation/account changes; safely reconcile only the originating cache.
8. Test draft CRUD, persisted refresh, empty/404/409 states, reorder, answer confidentiality,
   single-choice student flow and preservation of the other workspace tabs.

No frontend forms, dependencies, database migrations or attempt/history system are part of phase 5.

## Phase 6 implementation and verification

The workspace now uses `fontend/apis/lessons/admin-quiz.api.ts` and
`useAdminLessonQuiz` for this contract. Metadata and question dialogs save independently
of grammar. Question field-array identities are local; only persisted option IDs enter
requests. Failed writes retain input. Unsupported question types remain read-only.
Mutation results reconcile only the originating Quiz caches, with session/navigation guards.

`LessonPreviewDialog` is an authenticated admin panel within the validated workspace.
It reads saved lesson data, all vocabulary/Kanji pages and the admin Quiz. Its learner-style
question projection strips answer keys. It never calls study, answer, enrollment or progress
endpoints. Dirty grammar offers cancel, save, discard, or preview-saved while retaining the
draft; active Quiz forms must first be saved or dismissed through their discard guard.
No API contract or student access-policy change was needed for phase 6.

Verification commands (Windows, repository wrappers/tools):

```powershell
# fontend/
node --experimental-strip-types --test tests/lesson-quiz-validation.test.mjs tests/lesson-content-validation.test.mjs tests/lesson-grammar-draft.test.mjs tests/lesson-video-validation.test.mjs
pnpm lint
pnpm build
# Run the browser scripts against a local Next server; all API traffic is mocked.
$env:LESSON_TEST_ORIGIN='http://localhost:3001'
node tests/lesson-quiz-phase6.browser.mjs
node tests/lesson-workspace-phase2.browser.mjs
node tests/lesson-content-phase4.browser.mjs

# backend/, Java 17
.\gradlew.bat test --tests '*AdminLessonQuizIntegrationTest' --tests '*LessonContentIntegrationTest' --tests '*UploadServiceVideoValidationTest' --tests '*LessonIntegrationTest.video*' --tests '*LessonIntegrationTest.adminVideo*' --tests '*LessonIntegrationTest.adminPatches*'
.\gradlew.bat check bootJar --continue
```

The focused backend suite passes 27 tests with real Spring services, security, persistence
and MockMvc against isolated H2; external integrations use test doubles. It includes draft
preview reads without progress/enrollment/attempt creation and newly authored student Quiz
delivery/answer submission without initial answer leakage. Frontend schema/draft tests pass
10 tests. Browser suites cover CRUD, persisted mock refresh, ordering conflicts, preview,
failed saves, dirty grammar, parent/session races, and regression of earlier content/video flows.
Desktop/mobile preview was inspected in Chrome. Preview video decoding and playback were
verified using a small locally generated WebM response in place of the external provider.

Full application checks still have pre-existing failures: frontend lint 12 errors/18 warnings;
backend 6 failures in 138 tests (AdminJlptExamIntegrationTest, AuthIntegrationTest,
LessonIntegrationTest), Checkstyle 66 main/1 test violations, and SpotBugs violations outside
the new Quiz classes. Focused frontend lint and production build pass; bootJar succeeds.
Browser API mocks and H2 integration are separate verification layers: a browser-to-live-MySQL
authoring run with an isolated admin/student dataset and real media delivery has **not** been
verified. CSV import and Resources remain outside this phase.
