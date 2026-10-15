# Admin JLPT exams: verified API contract

Verified against the local `feature/course-client` implementation on 2026-10-15.
This describes implemented behavior. Deferred work is listed separately below.

## Routing and authorization

Base path **B** = `/api/v1/admin/jlpt-exams`. `WebConfiguration` supplies `/api/v1`;
the controller mapping remains `/admin/jlpt-exams`.

Every HTTP method on B and B/** requires `ROLE_ADMIN`. The specific matcher runs
before the existing broader admin rule. Authentication uses the existing bearer
token/session validation and the `permission` claim, mapped without adding an
authority prefix (for example, `["ROLE_ADMIN"]`).

- No authentication, invalid token, expired token or revoked session: **401** with
  `WWW-Authenticate: Bearer`.
- Authenticated without `ROLE_ADMIN`: **403**.
- ADMIN reaches controller validation and the normal service rules.

No authentication strategy, token storage, CORS, CSRF or other endpoint permissions
are changed by this task.

## Endpoint inventory

Path aliases below expand recursively to full URLs:

- **E** = B`/{examId}`
- **S** = E`/sessions/{sessionId}`
- **P** = S`/parts/{partId}`
- **Q** = P`/questions/{questionId}`
- **A** = Q`/answers/{answerId}`

All path IDs are positive signed 64-bit integers. Missing resources or a child
belonging to another parent produce **404**. Successful bodies are wrapped as
`RestResponse<T>`; DTO names in the response column identify `data`.

| Method | Path | Request DTO/body | Response data | Status |
| --- | --- | --- | --- | --- |
| GET | B | `AdminJlptExamQuery` | `Page<AdminJlptExamSummaryResponse>` | 200 |
| GET | E | None | `AdminJlptExamDetailResponse` | 200 |
| POST | B | `ReqAdminJlptExam` | `AdminJlptExamDetailResponse` | 201 |
| PUT | E | `ReqAdminJlptExam` | `AdminJlptExamDetailResponse` | 200 |
| DELETE | E | None | No body; archive exam | 204 |
| POST | E`/publish` | None | `AdminJlptExamDetailResponse` | 200 |
| POST | E`/unpublish` | None | `AdminJlptExamDetailResponse` | 200 |
| GET | S | None | `SessionResponse` | 200 |
| POST | E`/sessions` | `ReqAdminJlptSession` | `SessionResponse` | 201 |
| PUT | S | `ReqAdminJlptSession` | `SessionResponse` | 200 |
| PATCH | S`/sort-order` | `ReqJlptSortOrder` | `SessionResponse` | 200 |
| DELETE | S | None | No body | 204 |
| GET | P | None | `PartResponse` | 200 |
| POST | S`/parts` | `ReqAdminJlptPart` | `PartResponse` | 201 |
| PUT | P | `ReqAdminJlptPart` | `PartResponse` | 200 |
| PATCH | P`/sort-order` | `ReqJlptSortOrder` | `PartResponse` | 200 |
| DELETE | P | None | No body | 204 |
| GET | Q | None | `QuestionResponse` | 200 |
| POST | P`/questions` | `ReqAdminJlptQuestion` | `QuestionResponse` | 201 |
| PUT | Q | `ReqAdminJlptQuestion` | `QuestionResponse` | 200 |
| PATCH | Q`/sort-order` | `ReqJlptSortOrder` | `QuestionResponse` | 200 |
| DELETE | Q | None | No body | 204 |
| GET | A | None | `AnswerResponse` | 200 |
| POST | Q`/answers` | `ReqAdminJlptAnswer` | `AnswerResponse` | 201 |
| PUT | A | `ReqAdminJlptAnswer` | `AnswerResponse` | 200 |
| PATCH | A`/sort-order` | `ReqJlptSortOrder` | `AnswerResponse` | 200 |
| DELETE | A | None | No body | 204 |

`SessionResponse`, `PartResponse`, `QuestionResponse`, `AnswerResponse` and
`MediaSummaryResponse` are nested DTOs in `AdminJlptExamDetailResponse`. There are
no separate nested collection GET endpoints; exam detail returns the hierarchy.

## List query

Example:

```http
GET /api/v1/admin/jlpt-exams?search=practice&level=N3&status=DRAFT&page=0&size=12&sortKey=title&sortType=ASC
Authorization: Bearer <access-token>
```

| Parameter | Implemented behavior |
| --- | --- |
| `page` | Zero based, default 0, nonnegative integer; empty or malformed input is 400 |
| `size` | Default 10, integer from 1 to 12; 0, negative, oversized or empty input is 400 |
| `search` | Trimmed, case insensitive substring match on title OR description; blank ignored |
| `level` | Optional `N1`, `N2`, `N3`, `N4`, `N5`; invalid nonblank value is 400 |
| `status` | Optional `DRAFT`, `PUBLISHED`, `ARCHIVED`; invalid nonblank value is 400 |
| `sortKey` | Allowlist: `id`, `title`, `level`, `totalTimeMinutes`, `status`, `createdAt`, `updatedAt` |
| `sortType` | ASC or DESC, case insensitive; default DESC |

An absent/blank level or status applies no corresponding filter. Without status,
the list excludes archived exams. `ARCHIVED` explicitly includes deleted exams;
`DRAFT` and `PUBLISHED` select active exams with that publication state.
Unknown/blank sort keys fall back to `updatedAt`; invalid/blank sort directions
fall back to DESC. `status` sorts by the stored `isPublished` flag, not by the
alphabetical status label. There is no additional guaranteed tie breaker.

List `data` is the existing Spring Data Page serialization, including `content`,
`number`, `size`, `totalElements`, `totalPages`, `first`, `last`, `numberOfElements`,
`empty`, `pageable` and `sort`. Each content item has:
`id`, `level`, `title`, `description`, `totalTimeMinutes`, `status`, `hasAttempts`,
`createdAt`, `updatedAt`.

## Request bodies and validation

Create and PUT share each resource's DTO. PUT requires the required fields again.
Use JSON strings for text/enums, JSON integers for IDs/order/duration, JSON numbers
for points, and JSON booleans for correctness. Admin JLPT DTOs reject scalar type
coercion, enum ordinals (including quoted ordinals) and fractional integer fields.
Malformed JSON, wrong field types and numeric overflow return 400.

| DTO | Required fields and bounds | Optional fields/defaults |
| --- | --- | --- |
| `ReqAdminJlptExam` | `level`: N1-N5; `title`: nonblank, max 200 | `description`: max 500 |
| `ReqAdminJlptSession` | `name`: nonblank, max 150; `sessionType`: `language_knowledge`, `reading`, `listening`; `timeLimitMinutes`: 1-180; `sortOrder`: integer >= 0 | None |
| `ReqAdminJlptPart` | `name`: nonblank, max 150; explicit `sortOrder` cannot be null or negative | `sortOrder`: defaults to 0 when omitted; `instructions`: max 10000; `audioMediaId`: positive or null |
| `ReqAdminJlptQuestion` | `questionText`: nonblank, max 20000; `questionType`: `single_choice`; `points`: 0.01-999.99, max 2 fractional digits; `sortOrder`: integer >= 0 | `passageText`: max 50000; `explanation`: max 20000; `imageMediaId`: positive or null |
| `ReqAdminJlptAnswer` | `answerText`: nonblank, max 500; `isCorrect`: boolean; `sortOrder`: integer >= 0 | None |
| `ReqJlptSortOrder` | `sortOrder`: integer >= 0, not null | None |

Text lengths are checked before trimming. Required text is trimmed; blank optional
text becomes null. Media IDs are references to existing, undeleted, unused media:
audio requires AUDIO and image requires IMAGE. Missing/deleted media is 404, wrong
type is 400, and attaching media already used elsewhere is 409. Keeping the same
media ID is allowed. Omitting or setting media to null on PUT removes the old
reference and releases its `isUsed` flag. Attaching/replacing media updates usage.

Request examples (POST or PUT at the corresponding inventory path):

```json
{"level":"N3","title":"N3 Practice","description":"Practice exam"}
```

```json
{"name":"Reading","sessionType":"reading","timeLimitMinutes":60,"sortOrder":0}
```

```json
{"name":"Part 1","instructions":"Read the passage","sortOrder":0,"audioMediaId":42}
```

```json
{"questionText":"Choose the answer","passageText":"Passage","questionType":"single_choice","explanation":"Explanation","points":1.00,"sortOrder":0,"imageMediaId":43}
```

```json
{"answerText":"Correct answer","isCorrect":true,"sortOrder":0}
```

All four sort-order endpoints accept:

```json
{"sortOrder":2}
```

## Responses and errors

Example exam creation response (201):

```json
{
  "statusCode": 201,
  "error": null,
  "message": "Create JLPT exam",
  "data": {
    "id": 1,
    "level": "N3",
    "title": "N3 Practice",
    "description": "Practice exam",
    "totalTimeMinutes": 0,
    "status": "DRAFT",
    "hasAttempts": false,
    "contentLocked": false,
    "createdAt": "2026-10-15T03:00:00Z",
    "updatedAt": "2026-10-15T03:00:00Z",
    "sessions": []
  }
}
```

Detail includes correctness and explanations and is admin only. Nested resource
responses contain their descendants, ordered by `sortOrder`:

| DTO | Fields |
| --- | --- |
| `SessionResponse` | `id`, `name`, `sessionType`, `timeLimitMinutes`, `sortOrder`, `parts[]` |
| `PartResponse` | `id`, `name`, `instructions`, `sortOrder`, `audio` (nullable), `questions[]` |
| `QuestionResponse` | `id`, `questionText`, `passageText`, `questionType`, `explanation`, `points`, `sortOrder`, `image` (nullable), `answers[]` |
| `AnswerResponse` | `id`, `answerText`, `isCorrect`, `sortOrder` |
| `MediaSummaryResponse` | `id`, `originalName`, `secureUrl`, `fileType` |

For example, answer GET (200):

```json
{"statusCode":200,"error":null,"message":"Fetch JLPT exam answer","data":{"id":5,"answerText":"Correct answer","isCorrect":true,"sortOrder":0}}
```

DELETE returns 204 with no body. Errors are unwrapped `ErrorResponse`, not
`RestResponse`. Example missing required fields (400):

```json
{
  "status": 400,
  "message": "Validation failed",
  "fieldErrors": {"title":"Title is required","level":"JLPT level is required"},
  "timestamp": "2026-10-15T03:00:00Z"
}
```

Binding/Bean Validation errors include field messages. Malformed JSON, path type
errors and path constraint violations use `message: "Invalid request"` with empty
`fieldErrors`. Security errors use the same fields with `Authentication required`
(401) or `Access denied` (403). Internal exception details are not returned.

| Status | Meaning |
| --- | --- |
| 400 | Invalid input or failed publish/media-type validation |
| 401 | Authentication required or bearer token/session rejected |
| 403 | Authenticated caller lacks ADMIN authority |
| 404 | Missing resource, wrong parent, or archived exam requested for mutation |
| 405 | Unsupported HTTP method on a mapped route |
| 409 | Published/attempted content is locked, media already used, or data conflict |
| 415 | Unsupported request content type |
| 500 | Unexpected server error; invalid input should not reach this status |

## Existing business restrictions

- New exams are drafts. Session create/update/delete recalculates total duration.
- Metadata and all nested create/update/delete/sort operations require an active,
  unpublished exam with **no attempts**. Published content returns 409 until
  unpublished. Any attempt locks content even after unpublishing (409).
- Publish requires at least one session, a positive duration for every session,
  at least one part per session and one question per part. Each single-choice
  question needs at least two answers and exactly one correct answer. Sibling
  sort orders must be unique at every level. Failure is 400 with a business message.
- Publish/unpublish require an active exam; they do not check the attempt lock.
  Archiving is also allowed with attempts and preserves attempt history.
- Archiving sets `isDeleted`, `deletedAt`, and unpublishes the exam. Repeated
  archive, publish/unpublish, and content mutations on archived exams return 404.
  Admin detail and nested reads remain available for archived exams.
- Nested deletion is existing physical deletion, including descendants and media
  release; exam deletion is soft deletion. This task does not change deletion semantics.
- Reordering updates one sibling's order. Drafts may have duplicate orders; the
  uniqueness check happens at publish time.

## Deferred behavior (not implemented by Task 1)

- Existing role-provisioning security gap: `User` initializes role to `admin` and
  its pre-persist callback also assigns `admin` for null roles. Public
  `AuthServiceImpl.register` does not override this default. Consequently, a newly
  registered and verified account receives ADMIN authority. The JLPT matcher
  enforces the persisted authority correctly, but this separate auth issue needs
  a follow-up; Task 1 does not change role provisioning or existing accounts.
- Atomic question-and-answer saving; current writes use separate requests.
- Batch/transactional sibling reordering and automatic renumbering.
- JLPT audio upload workflow; current API only attaches existing media IDs.
- Cloning and revision creation. The attempt-lock error suggests a new revision,
  but no revision/clone endpoint exists.
- Additional authoring features and any broader publication/concurrency changes.

## Verification record

Before edits, `gradlew.bat test --tests com.mycompany.saas_japanese.AdminJlptExamIntegrationTest`
ran 4 tests with 3 failures: anonymous list returned 200 instead of 401; student
detail returned 200 instead of 403; a learner request used stale `/jlptExams`
routing and returned 404 instead of 403. The local learner mapping is
`/api/v1/jlpt-exams`; test URLs now follow it.

Expanded regression coverage exercises all 27 endpoints for anonymous/non-admin
denial, real signed bearer authority/session validation, ADMIN hierarchy CRUD and
sort operations, publish/unpublish, path/query/body validation, media rules,
parent ownership, archived/attempted locks and persisted-state preservation after
failed requests. It also covers valid optional media: mapping an empty media lookup
previously caused a null-key 500; nullable references now map safely.

Shared pagination validation retains the existing defaults and maximum. All 10
`BaseQuery` subclasses are covered by `BaseQueryValidationTest`. Existing routes
without `@Valid` do not gain controller validation from this change; broadening
unrelated controllers is outside this task.

The related `AuthIntegrationTest` learner fixture now explicitly assigns STUDENT,
so the login-role and non-admin rejection assertions exercise the intended actor
instead of the existing ADMIN entity default. Production role defaults are unchanged.

Final checks used Java 17 and the Windows Gradle Wrapper with the existing H2
test configuration; no production database or paid provider was called.

| Check | Result |
| --- | --- |
| Focused JLPT integration tests | 19 passed, 0 failed (baseline: 4 tests, 3 failed) |
| Directly affected tests | 127 passed: JLPT admin/service, BaseQuery, auth, error handling, client course and course category |
| `gradlew.bat test` | 205 total: 203 passed, 1 failed, 1 skipped |
| `gradlew.bat check --continue` | Failed on the same lesson test, 65 production Checkstyle violations, and existing SpotBugs findings; Checkstyle test sources passed |
| `git diff --check` | Passed |

The remaining suite failure is
`LessonIntegrationTest.courseDeletionIsScopedAndRetainsPreviouslyDeletedTimestamp`
(line 137). `LessonServiceImpl.deleteByCourseId` is still an existing empty
implementation. The failure and both original auth-fixture failures were
reproduced against an isolated copy of the pre-task local HEAD under `build/`,
with dummy payment configuration for context startup. No original source was
temporarily replaced in the working tree.

All 65 production Checkstyle violations occur in untouched files. Comparing
SpotBugs reports against that same baseline gave identical findings: 226 in main
and 13 in tests, with no additions or removals. The skipped test is the existing
`AdminLessonWorkspaceBrowserTest`, which requires `LESSON_LIVE_BROWSER=true` and
a running frontend/browser environment; it is outside this backend-only run.
