# Admin JLPT exams: verified API contract

Verified against the local `feature/course-client` implementation on 2026-10-15.
This describes implemented behavior. Deferred work is listed separately below.

Frontend handoff: use the endpoint inventory and the **Frontend follow-up contract**
below. The importable [Postman collection](admin-jlpt-exams.postman_collection.json)
contains an ordered, disposable authoring-to-attempt workflow. Its JSON, variable
references, request bodies and test-script syntax have been validated; the
collection has **not** been executed in Postman. Verification uses automated
Spring/H2 integration tests, with external upload providers mocked.

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
| GET | B`/stats` | `AdminJlptExamStatsQuery` | `AdminJlptExamStatsResponse` | 200 |
| GET | E | None | `AdminJlptExamDetailResponse` | 200 |
| GET | E`/validation` | None | `AdminJlptExamValidationResponse` | 200 |
| POST | B | `ReqAdminJlptExam` | `AdminJlptExamDetailResponse` | 201 |
| PUT | E | `ReqAdminJlptExam` | `AdminJlptExamDetailResponse` | 200 |
| DELETE | E | None | No body; archive exam | 204 |
| POST | E`/publish` | None | `AdminJlptExamDetailResponse` | 200 |
| POST | E`/unpublish` | None | `AdminJlptExamDetailResponse` | 200 |
| GET | S | None | `SessionResponse` | 200 |
| POST | E`/sessions` | `ReqAdminJlptSession` | `SessionResponse` | 201 |
| PATCH | E`/sessions/reorder` | `ReqJlptReorder` | `SessionResponse[]` | 200 |
| PUT | S | `ReqAdminJlptSession` | `SessionResponse` | 200 |
| PATCH | S`/sort-order` | `ReqJlptSortOrder` | `SessionResponse` | 200 |
| DELETE | S | None | No body | 204 |
| GET | P | None | `PartResponse` | 200 |
| POST | S`/parts` | `ReqAdminJlptPart` | `PartResponse` | 201 |
| PATCH | S`/parts/reorder` | `ReqJlptReorder` | `PartResponse[]` | 200 |
| PUT | P | `ReqAdminJlptPart` | `PartResponse` | 200 |
| PATCH | P`/sort-order` | `ReqJlptSortOrder` | `PartResponse` | 200 |
| DELETE | P | None | No body | 204 |
| GET | Q | None | `QuestionResponse` | 200 |
| POST | P`/questions` | `ReqAdminJlptQuestion` | `QuestionResponse` | 201 |
| POST | P`/questions/with-answers` | `ReqSaveAdminJlptQuestion` | `QuestionResponse` with complete answers | 201 |
| PUT | Q`/with-answers` | `ReqSaveAdminJlptQuestion` | `QuestionResponse` with complete answers | 200 |
| PATCH | P`/questions/reorder` | `ReqJlptReorder` | `QuestionResponse[]` | 200 |
| PUT | Q | `ReqAdminJlptQuestion` | `QuestionResponse` | 200 |
| PATCH | Q`/sort-order` | `ReqJlptSortOrder` | `QuestionResponse` | 200 |
| DELETE | Q | None | No body | 204 |
| GET | A | None | `AnswerResponse` | 200 |
| POST | Q`/answers` | `ReqAdminJlptAnswer` | `AnswerResponse` | 201 |
| PATCH | Q`/answers/reorder` | `ReqJlptReorder` | `AnswerResponse[]` | 200 |
| PUT | A | `ReqAdminJlptAnswer` | `AnswerResponse` | 200 |
| PATCH | A`/sort-order` | `ReqJlptSortOrder` | `AnswerResponse` | 200 |
| DELETE | A | None | No body | 204 |

`SessionResponse`, `PartResponse`, `QuestionResponse`, `AnswerResponse` and
`MediaSummaryResponse` are nested DTOs in `AdminJlptExamDetailResponse`. There are
no separate nested collection GET endpoints; exam detail returns the hierarchy.

Audio upload is a separate **ADMIN-only** endpoint:
`POST /api/v1/upload/audios` (multipart form field `file`), returning 200 with
`RestResponse<MediaResponse>`. The specific authorization matcher precedes broader
API permissions. Existing image/video upload routes and permissions are unchanged.

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
alphabetical status label. Every non-ID sort adds `id` in the same direction as
the primary sort, including the default `updatedAt DESC, id DESC`.

List `data` is the existing Spring Data Page serialization, including `content`,
`number`, `size`, `totalElements`, `totalPages`, `first`, `last`, `numberOfElements`,
`empty`, `pageable` and `sort`. Each content item has:
`id`, `level`, `title`, `description`, `totalTimeMinutes`, `status`, `hasAttempts`,
`contentLocked`, `sessionCount`, `partCount`, `questionCount`, `passingScore`,
`createdAt`, `updatedAt`. The same fields are present in detail, which additionally
contains `sessions[]`.

Counts include every descendant at the corresponding level, including empty
sessions and parts. Answers do not multiply question counts. An empty exam has
zero counts and zero duration. `hasAttempts` means any persisted attempt, regardless
of completion state. `contentLocked` is true when the exam is published, archived,
or has any attempts; otherwise false. This flag describes metadata/content editing;
publish, unpublish and archive retain their separate rules below.

`totalTimeMinutes` is the sum of session `timeLimitMinutes`. Session writes maintain
the stored total, and admin reads derive it from session durations. It cannot be
edited independently. `passingScore` is a JSON number from
`JlptScoringRule.forLevel(level).getOverallPassScore()`:

| Level | Passing score |
| --- | --- |
| N1 | 100 |
| N2 | 90 |
| N3 | 95 |
| N4 | 90 |
| N5 | 80 |

This is the overall threshold only. Learner full-exam scoring also requires the
existing section thresholds. No maximum score is inferred from this value, and
learner scoring and session-practice semantics are unchanged.

Example summary inside the existing Page `content` array:

```json
{"id":1,"level":"N3","title":"N3 Practice","description":"Practice exam","totalTimeMinutes":60,"status":"DRAFT","hasAttempts":false,"contentLocked":false,"sessionCount":1,"partCount":2,"questionCount":8,"passingScore":95,"createdAt":"2026-10-15T03:00:00Z","updatedAt":"2026-10-15T03:00:00Z"}
```

## Statistics

```http
GET /api/v1/admin/jlpt-exams/stats?search=practice&level=N3
Authorization: Bearer <access-token>
```

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Fetch admin JLPT exam statistics",
  "data": {"totalExams":12,"draftExams":5,"publishedExams":4,"archivedExams":3}
}
```

`AdminJlptExamStatsQuery` accepts only `search` and `level`, with the same matching,
trimming, blank handling and enum binding as list. Unknown query parameters,
including `status`, `page`, `size`, `sortKey` and `sortType`, are ignored. A list's
selected status therefore never limits statistics. Invalid nonblank `level` is
400; authorization errors are 401/403 as above.

`totalExams` includes active and archived exams after applying search and level.
Archived means `isDeleted=true` and takes precedence over publication. Active
published exams enter `publishedExams`; active unpublished exams enter `draftExams`.
Each exam enters exactly one bucket, so total always equals the three buckets'
sum. An empty catalog or a filter with no matches returns four zeros. Statistics
use a single database aggregate with no pagination and no loaded exam entities.
The literal `/stats` route takes precedence over `/{examId}`.

List enrichment uses page-scoped aggregates for session count/duration and
part/question counts, plus one batched attempt lookup. It does not fetch a full
hierarchy per row. Detail uses batched hierarchy/media queries and orders every
sibling collection by `sortOrder ASC, id ASC`, including drafts with tied orders.

## Request bodies and validation

Create and PUT share each resource's DTO. PUT requires the required fields again.
Exam POST/PUT support only `level`, `title` and `description`. Surrounding whitespace
is trimmed and blank optional description becomes null. Extra JSON fields retain
the existing ignore behavior: sending `status`, publication/archive flags,
`totalTimeMinutes`, counts or `passingScore` cannot change those values. Use the
dedicated lifecycle routes and session duration fields instead.
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
| `ReqJlptReorder` | `ids`: non-null array of positive integer IDs; all siblings exactly once | Empty array allowed only for an empty collection |

Text lengths are checked before trimming. Required text is trimmed; blank optional
text becomes null. Media IDs are references to existing, undeleted, unused media:
audio requires AUDIO and image requires IMAGE. Missing/deleted media is 404, wrong
type is 400, and attaching media already used elsewhere is 409. Keeping the same
media ID is allowed. Omitting or setting media to null on PUT removes the old
reference and releases its `isUsed` flag only when no other valid reference remains.
Attaching/replacing media updates usage. Claims also check persisted references,
so a stale `isUsed=false` flag cannot allow duplicate ownership. Legacy shared media
is retained while any other JLPT reference (including archived content), active
course thumbnail, active category image, or active lesson video still needs it.

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

## Atomic Save Question

Use these routes for a complete question and answer set:

```http
POST /api/v1/admin/jlpt-exams/{examId}/sessions/{sessionId}/parts/{partId}/questions/with-answers
PUT /api/v1/admin/jlpt-exams/{examId}/sessions/{sessionId}/parts/{partId}/questions/{questionId}/with-answers
Authorization: Bearer <access-token>
Content-Type: application/json
```

Create example (201):

```json
{
  "questionText":"<strong>正しい答えを選んでください。</strong>",
  "passageText":"<p>日本語の文章。</p>",
  "questionType":"single_choice",
  "explanation":"<em>答えの説明。</em>",
  "points":1.00,
  "sortOrder":0,
  "imageMediaId":43,
  "answers":[
    {"answerText":"はい","isCorrect":true,"sortOrder":0},
    {"answerText":"いいえ","isCorrect":false,"sortOrder":1}
  ]
}
```

The same question fields and length/numeric bounds as `ReqAdminJlptQuestion` apply.
`answers` is required, cannot contain null entries and needs at least two nonblank
answers, each no longer than 500 characters, with exactly one `isCorrect: true`.
Only `single_choice` is supported. Each answer requires `answerText` and boolean
`isCorrect`; `id` and `sortOrder` are optional. IDs, if supplied, must be positive
JSON integers. Strict scalar/enum/number validation also applies to nested answers.

Array order sets answer positions to 0..N-1. An explicit answer `sortOrder` must
equal its array index; null/omitted order uses the index. This follows complete
batch-reorder semantics, rather than applying separate moves during the save.
Question `sortOrder` uses Task 3 insertion/movement bounds and shifts siblings.

Update example (200), retaining answer 51, creating another and deleting any
previous answer omitted from the complete array:

```json
{
  "questionText":"更新した質問",
  "passageText":null,
  "questionType":"single_choice",
  "explanation":"説明",
  "points":2.00,
  "sortOrder":1,
  "imageMediaId":null,
  "answers":[
    {"id":51,"answerText":"以前の答えを更新","isCorrect":false},
    {"answerText":"新しい正解","isCorrect":true}
  ]
}
```

- On create, answer IDs must be omitted/null. On update, IDs update only existing
  answers of that exact question. Retained answers keep their IDs. New entries
  without IDs receive IDs; omitted existing answers are physically deleted.
- Duplicate, unknown, or foreign answer IDs return 400 before changes. A wrong
  exam/session/part/question path returns 404. Normal 401/403 authorization and
  published/attempted 409 or archived 404 restrictions still apply.
- Required text must remain visibly nonblank after sanitization. Aggregate text
  fields reuse `GrammarHtmlSanitizer` for safe HTML: Japanese text and allowed
  formatting such as strong/emphasis are retained; scripts, handlers, inline images
  and unsafe links are stripped. Post-sanitization lengths are also checked.
  Image rendering uses the resolved media DTO. Legacy question-only/answer routes
  retain their existing text handling.
- The complete body, answer membership, correctness and positions are validated
  before changing entities/media flags. A single READ_COMMITTED service transaction
  under the existing exam-row lock persists question fields, shifted siblings,
  answer updates/inserts/deletes, and image-reference flags. Failure rolls all of
  them back; the question is updated in place, never deleted/recreated.
- Keeping, replacing and removing images use active `FileTypeEnum.IMAGE` records
  and the existing ownership checks. Keeping an ID still validates active/type
  status. Null/omitted `imageMediaId` removes the reference on PUT. Release occurs
  only after unlinking and only when no valid reference remains.
- The rest of the exam may remain structurally incomplete and DRAFT. There is no
  separate question publication state. Whole-exam readiness is described below.
- Legacy POST/PUT question-only endpoints and individual answer endpoints remain.
  A question-only PUT without an answers array leaves all answers untouched; even
  an extra `answers` property on that legacy DTO does not invoke replacement.

The saved response uses the existing `QuestionResponse`, for example:

```json
{
  "statusCode":200,
  "error":null,
  "message":"Update JLPT question with answers",
  "data":{
    "id":9,"questionText":"更新した質問","passageText":null,
    "questionType":"single_choice","explanation":"説明","points":2.00,"sortOrder":1,"image":null,
    "answers":[
      {"id":51,"answerText":"以前の答えを更新","isCorrect":false,"sortOrder":0},
      {"id":53,"answerText":"新しい正解","isCorrect":true,"sortOrder":1}
    ]
  }
}
```

## Image and listening-part audio workflow

1. Reuse `POST /api/v1/upload/images` with multipart `file` for images. Its existing
   response exposes `data.id` and `data.secureUrl`; submit the ID as `imageMediaId`.
2. Upload audio using the new ADMIN route, then submit its ID as the part's
   `audioMediaId` through existing POST/PUT part operations. Playback uses `secureUrl`.
3. Keeping, replacing and removing part audio follows the same active/type/ownership
   rules as images. AUDIO is required; IMAGE/VIDEO is rejected with 400, missing or
   deleted media with 404, and an already claimed foreign reference with 409.
   Null/omitted audio on part PUT removes it. Shared legacy/archived references
   keep `isUsed=true` until their last valid reference is removed.

Image upload accepts `.jpeg` / `image/jpeg`, `.png` / `image/png`, `.webp` /
`image/webp`, and `.gif` / `image/gif`, up to **10 MiB (10,485,760 bytes)**.
Extensions and MIME types are case insensitive; MIME parameters are accepted.
A nonblank filename of at most 255 characters, matching MIME and image signature
are required. Empty, oversized, unreadable or obviously disguised files return
400 before the provider is called. These are signature checks, not a full image
decode. The existing `.jpeg` convention remains; `.jpg` is not supported.
The image route retains its existing permissions and wrapped Media response;
use ADMIN authentication in the builder and consume only `data.id` / `secureUrl`.

```http
POST /api/v1/upload/audios
Authorization: Bearer <access-token>
Content-Type: multipart/form-data; boundary=<boundary>

file: <listening.mp3 bytes>
```

```json
{"statusCode":200,"error":null,"message":"Upload audio","data":{"id":42,"originalName":"listening.mp3","publicId":"audios/example","secureUrl":"https://example.test/listening.mp3"}}
```

Supported formats and validation:

| Format | Extension and MIME | Content checks |
| --- | --- | --- |
| MP3 | `.mp3`, `audio/mpeg` | Two complete consecutive MPEG Layer III frames with matching version/sample rate; optional ID3v2 header; invalid/truncated headers rejected |
| PCM/float WAV | `.wav`, `audio/wav`, `audio/x-wav`, or `audio/wave` | RIFF/WAVE length and chunk bounds; consistent format, sample rate, byte rate and alignment; nonempty whole sample frames |

The limit is **20 MiB (20,971,520 bytes)**, enforced on declared and actual bytes.
WAV supports mono/stereo, 8–192 kHz, PCM 8/16/24/32-bit or 32-bit IEEE float.
Extensions are case insensitive; MIME parameters are allowed and stripped from
stored MIME metadata. A nonblank filename of at most 255 characters is required.
Empty files, mismatched extension/MIME/content and oversized audio return 400;
missing `file` returns 400, wrong request content type 415, and exceeding the
existing global multipart limit returns 413 in the existing error envelope.
Content checks reject obvious mismatches and are not a full MP3 decode/transcode.

The existing Cloudinary uploader is reused (audio uses its `video` resource type),
while the database record is `FileTypeEnum.AUDIO`, active and initially unused.
Upload runs outside caller database transactions; the media metadata is saved in
its own repository transaction. Remote upload is separate from exam attachment:
a later failed save does not undo the remote object or the committed unused media
record. A remote object can also remain if metadata persistence itself fails;
remote cleanup/reconciliation is a separate concern. No arbitrary audio URLs or
question-level audio fields are added.

## Hierarchy ordering and batch reorder

All 35 admin JLPT endpoints, including these four PATCH routes, require ADMIN:

| Collection | Exact path after `/api/v1/admin/jlpt-exams` | Response `data` |
| --- | --- | --- |
| Sessions | `/{examId}/sessions/reorder` | Ordered `SessionResponse[]`, including parts/questions/answers |
| Parts | `/{examId}/sessions/{sessionId}/parts/reorder` | Ordered `PartResponse[]`, including questions/answers |
| Questions | `/{examId}/sessions/{sessionId}/parts/{partId}/questions/reorder` | Ordered `QuestionResponse[]`, including answers |
| Answers | `/{examId}/sessions/{sessionId}/parts/{partId}/questions/{questionId}/answers/reorder` | Ordered `AnswerResponse[]` |

Each accepts the complete ordered sibling ID list. Array position becomes the
zero-based `sortOrder`:

```http
PATCH /api/v1/admin/jlpt-exams/1/sessions/reorder
Authorization: Bearer <access-token>
Content-Type: application/json

{"ids":[12,8,15]}
```

The same request format is used for parts, questions and answers. For example,
reordering an existing question's two answers with `{"ids":[7,5]}` returns:

```json
{
  "statusCode":200,
  "error":null,
  "message":"Reorder JLPT exam answers",
  "data":[
    {"id":7,"answerText":"Other answer","isCorrect":false,"sortOrder":0},
    {"id":5,"answerText":"Correct answer","isCorrect":true,"sortOrder":1}
  ]
}
```

- Include every current sibling exactly once. Duplicate, missing, additional,
  unknown, foreign-parent, null, nonpositive, quoted or fractional IDs return 400.
  A missing/null `ids` or malformed body also returns 400. `{"ids":[]}` succeeds
  only when that collection is empty and returns `data: []`.
- Complete parent ownership is checked at every depth. Missing resources or
  mismatched path ancestors return 404; invalid sibling membership in an otherwise
  valid collection returns 400. Failed writes leave both parents unchanged.
- Repeating the current sequence succeeds without changing content. No answer
  correctness, explanations, media, hierarchy counts or duration are changed by
  reorder. Existing sort-order endpoints and their individual DTO responses remain.
- For POST, explicit `sortOrder` is an insertion position in **0..N**, where N is
  the current sibling count. Existing siblings at/after the position shift right.
  `N` appends. For PUT and single-item PATCH `/sort-order`, it is a move position
  in **0..N-1**, and intervening siblings shift without changing relative order.
  Out-of-range positions return 400. Session/question/answer order remains required;
  omitted part order retains its existing default of 0 (insertion/move to the start),
  and explicit null remains invalid.
- Deletion closes the gap. Successful insertion, movement, deletion or batch
  reorder leaves only that sibling collection contiguous and unique, starting at
  zero. Reads use `sortOrder ASC, id ASC` for legacy ties/gaps. A write normalizes
  its affected collection; it does not rewrite other collections or exams.
- Published or attempted content is locked (409); archived mutations return 404.
  Archived detail/nested reads remain available. These rules apply equally to POST,
  PUT, DELETE, single-item sort and batch reorder.

Hierarchy/lifecycle writes use one service transaction and a pessimistic database
write lock on the active exam row before reading membership. Learner attempt
creation takes the same lock, preventing a new attempt from racing with content
edits or publication changes. Operations on one exam serialize across database
connections/processes. Concurrent complete reorders use the last serialized order;
if membership changed while a request waited, its stale ID list fails validation
against the current siblings. There is no optimistic version token in this API.

Admin write transactions use READ_COMMITTED so membership and media-reference
checks after waiting for locks see committed changes. Media rows are locked in ID
order for claim/release. Database lock/deadlock failures map to the existing 409
error envelope; the client should refetch before deciding whether to retry.

Nested deletes remove answer rows before cascading question/part/session removal;
exam deletion remains soft archive. Media is checked for remaining references
after detachment/deletion is flushed. Child deletion, sibling compaction, session
duration recalculation and media flags commit or roll back together.

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
    "sessionCount": 0,
    "partCount": 0,
    "questionCount": 0,
    "passingScore": 95,
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
| 409 | Published/attempted content is locked, media already used, database lock contention, or data conflict |
| 413 | Request exceeds the configured multipart upload limit |
| 415 | Unsupported request content type |
| 500 | Unexpected server error; invalid input should not reach this status |

## Publish readiness and lifecycle

`GET /api/v1/admin/jlpt-exams/{examId}/validation` requires ADMIN and returns a
read-only snapshot. Existing archived exams remain inspectable; a missing exam is
404. No state, cached duration, ordering, timestamps, or media usage flags are
repaired by inspection. Example of a draft with incomplete content:

```json
{
  "statusCode": 200,
  "error": null,
  "message": "Validate JLPT exam readiness",
  "data": {
    "examId": 12,
    "status": "DRAFT",
    "contentValid": false,
    "canPublish": false,
    "hasAttempts": false,
    "contentLocked": false,
    "totalTimeMinutes": 30,
    "issues": [
      {
        "code": "CORRECT_ANSWER_COUNT",
        "message": "Each single-choice question must have exactly one correct answer",
        "path": "sessions[21].parts[31].questions[41].answers",
        "category": "CONTENT",
        "resourceIds": {"examId":12,"sessionId":21,"partId":31,"questionId":41}
      }
    ]
  }
}
```

The response fields above are the complete readiness DTO. `issues` is an array of
typed issues with stable `code`, readable `message`, `path`, `category`, and
`resourceIds`. Bracket values in paths are resource IDs, **not array indices**.
IDs include all known ancestors, the affected answer where applicable, and
`mediaId` for a media problem. Multiple issues can share a path.

`contentValid` considers only content checks. `canPublish` also requires an active
exam. A structurally valid archived exam has `contentValid: true`,
`canPublish: false`, and an `EXAM_ARCHIVED` issue at `status` with category
`LIFECYCLE`. Valid active published exams have `canPublish: true` because repeated
publish is supported. Attempts set `hasAttempts`/`contentLocked` but do not prevent
publication. `totalTimeMinutes` is the sum of persisted session durations, even
when the cached exam duration differs. Invalid session times are reported, not
silently normalized.

The same service validator collects all detected issues during inspection and
publication, including legacy persisted records:

| Codes | Requirement |
| --- | --- |
| `EXAM_LEVEL_REQUIRED` | Supported existing JLPT level |
| `TEXT_REQUIRED`, `TEXT_TOO_LONG` | Required title/session/part/question/answer text and existing field length limits; HTML-only/blank question and answer content is empty |
| `COLLECTION_EMPTY` | At least one session, part per session, and question per part |
| `SESSION_TYPE_UNSUPPORTED`, `SESSION_DURATION_INVALID` | Existing session enum and 1–180 minutes |
| `QUESTION_TYPE_UNSUPPORTED`, `QUESTION_POINTS_INVALID` | `single_choice`; points 0.01–999.99 with at most two decimal places |
| `ANSWERS_TOO_FEW`, `CORRECT_ANSWER_COUNT`, `ANSWER_CORRECTNESS_REQUIRED` | At least two nonblank answers, exactly one correct, and explicit correctness |
| `SORT_ORDER_INVALID` | Unique contiguous zero-based sibling positions at all four levels |
| `MEDIA_UNAVAILABLE`, `MEDIA_TYPE_INVALID` | Attached media exists, is active, and is IMAGE for questions or AUDIO for parts |
| `EXAM_DURATION_INVALID` | Combined duration fits the existing stored integer range |
| `EXAM_ARCHIVED` | Lifecycle restriction, distinct from content validity |

There is no required official question count, exactly-four-answer rule, or
mandatory audio rule. Passing thresholds and learner scoring are unchanged.

`POST /api/v1/admin/jlpt-exams/12/publish` takes no body. It locks the active exam,
loads the latest persisted hierarchy, and validates inside the transaction that
sets PUBLISHED. Success returns the existing wrapped detail DTO and synchronizes
the stored duration with the session sum. A failed publication makes no changes
and returns **400**, preserving the usual error fields and adding `issues`:

```json
{
  "status": 400,
  "message": "JLPT exam is not ready for publication",
  "fieldErrors": {
    "sessions[21].parts[31].questions[41].answers": "Each single-choice question must have exactly one correct answer"
  },
  "timestamp": "2026-10-15T05:00:00Z",
  "issues": [
    {
      "code": "CORRECT_ANSWER_COUNT",
      "message": "Each single-choice question must have exactly one correct answer",
      "path": "sessions[21].parts[31].questions[41].answers",
      "category": "CONTENT",
      "resourceIds": {"examId":12,"sessionId":21,"partId":31,"questionId":41}
    }
  ]
}
```

`fieldErrors` combines messages when several issues share a path; `issues` retains
every individual code and location. Other errors retain their previous envelope.

| Starting state | Operation | Result |
| --- | --- | --- |
| DRAFT | publish | PUBLISHED / 200 if ready, otherwise 400 without changes |
| PUBLISHED | publish | PUBLISHED / 200 if ready; revalidated, no content changes |
| DRAFT or PUBLISHED | unpublish | DRAFT / 200, including repeated unpublish |
| DRAFT or PUBLISHED | archive (DELETE) | ARCHIVED / 204; clears publication and sets deletedAt |
| ARCHIVED | publish, unpublish, archive, or content write | 404, including repeated archive |

Attempts prohibit **content** changes even after unpublishing; they do not
prohibit unpublish, valid republish, or archive. Every admin content/lifecycle
writer and learner start-attempt takes a pessimistic write lock on the same exam
row before checking state. Admin writes use READ_COMMITTED so waiting operations
check current attempt membership after acquiring the lock. No JVM mutex or schema
change is involved. Readiness uses a read-only REPEATABLE_READ snapshot and does
not lock rows for editing; callers must handle changes between inspection and save.

Learner catalog, exam/detail/session reads, and starting new attempts require an
active published exam. After unpublish/archive, new starts return 404. Existing
in-progress attempts remain answerable and submittable under the existing attempt
status and ownership checks. Submitted answers, scores, results, completed-owner
reviews, hierarchy and referenced media survive both transitions. Review/result
require a completed attempt and its owner; correctness and explanations remain
absent from catalog/detail/start/save-answer responses before completion.

## Existing business restrictions

- New exams are drafts. Session create/update/delete recalculates total duration.
- Metadata and all nested create/update/delete/sort operations require an active,
  unpublished exam with **no attempts**. Published content returns 409 until
  unpublished. Any attempt locks content even after unpublishing (409).
- Publish uses the readiness rules and structured 400 issues documented above.
- Publish/unpublish require an active exam; they do not check the attempt lock.
  Archiving is also allowed with attempts and preserves attempt history.
- Archiving sets `isDeleted`, `deletedAt`, and unpublishes the exam. Repeated
  archive, publish/unpublish, and content mutations on archived exams return 404.
  Admin detail and nested reads remain available for archived exams.
- Nested deletion is existing physical deletion, including descendants and media
  release; exam deletion is soft deletion. This task does not change deletion semantics.
- API content writes maintain contiguous unique sibling positions. Legacy inconsistent
  orders are read deterministically; readiness/publication reject gaps and duplicates
  without rewriting them.

## Frontend follow-up contract

Admin exam summary/detail types need numeric `sessionCount`, `partCount`,
`questionCount`, `passingScore` and boolean `contentLocked` (detail already had the
flag). Preserve `hasAttempts` and the existing Page/error wrappers. Fetch statistics
with a separate query keyed by search/level; pagination and selected status belong
only to the list query. Duration and passing score are display fields. No frontend
files are changed by these backend tasks.

The builder should send the full sibling ID sequence to the collection's PATCH
`/reorder` route and consume the returned DTO array. Refetch on 400 (stale membership)
or 409 (locked content/contention). Existing insert/move forms must send positions
within the current collection bounds and refresh shifted siblings, counts and
duration after mutations. A sort-order response still contains only the moved
resource and its descendants, so it does not enumerate the shifted siblings.

Save Question should call the aggregate route once with the full answer array and
retained answer IDs, then use returned IDs/order/media metadata for subsequent edits.
Do not orchestrate separate answer mutations for this action. Keep legacy routes
for callers that intentionally edit individual resources. Upload media first and
attach by ID in a later save; clear local upload progress separately from save
state, and refresh detail/counts after success. Audio pickers should enforce the
documented format/size limits and use the playback `secureUrl`.

Fetch readiness when displaying the publish action and after authoring changes.
Render issues by resource ID/path and retain the full issue array when publication
returns 400. Distinguish `contentLocked` from `canPublish`: an exam with attempts
can still be unpublished, republished if valid, and archived. Invalidate list,
detail, statistics and readiness queries after lifecycle mutations. A successful
GET report is advisory; publication always validates again under the database lock.

## Learner workflow used for final verification

These existing routes are included in the Postman workflow. They retain the
`RestResponse` wrapper; learner successes use the default message
`CALL API SUCCESS !`. Use the learner's access token. Start requires `userId`
matching the authenticated account (obtain `data.id` from
`GET /api/v1/auth/myProfile`). Another user's attempts cannot be answered,
submitted, read as results, or reviewed (403).

| Method | Path after `/api/v1/jlpt-exams` | Request / response `data` |
| --- | --- | --- |
| GET | empty path | Existing Page of published active exams; `search`, `jlptLevel`, `title`, `page`, `size`, `sortKey`, `sortType` |
| GET | `/{examId}` | Exam metadata (`jlptLevel`, not admin `level`) |
| GET | `/{examId}/detail` | Session/part summaries, counts and `audioMediaId`; no solutions |
| GET | `/{examId}/sessions/{sessionId}` | One session summary; no solutions |
| POST | `/{examId}/attempts` | `{"userId":7,"mode":"full"}` or `{"userId":7,"mode":"session","sessionId":12}`; returns `attemptId` and `sessions[].attemptSessionId` / `parts[].questions[].questionId` / `answers[].answerId` |
| PUT | `/attempts/{attemptId}/sessions/{attemptSessionId}/answers` | `{"questionId":31,"answerId":53}`; saved selection/timestamp, no correctness |
| POST | `/attempts/{attemptId}/submit` | No body; completed scores/counts/session results |
| GET | `/attempts/{attemptId}/result` | Completed owner's score, existing section thresholds and full-exam pass result |
| GET | `/attempts/{attemptId}/review` | Completed owner's selected/correct answer IDs, correctness and explanations |
| GET | `/attempts/history` | Owner's existing Page, zero-based pagination, stable `startedAt DESC, id DESC` |

Learner catalog pagination now validates the same `page >= 0`, `size = 1..12`
bounds/defaults and rejects explicit empty values with 400. Invalid start modes
or contradictory session fields return 400; a missing session returns 404, and
a foreign session returns 400. Invalid starts do not create attempt rows.
Result/review before completion returns 400. Published/active requirements apply
to new starts and catalog/detail reads; existing attempts continue independently
after unpublish/archive, as described in the lifecycle section.

Submission persists the pass flag using the **existing** overall and section
threshold calculation. History computes that same result from stored scores and
batched attempt sessions, so legacy stale flags do not cause disagreement with
the result API. History GET does not rewrite those legacy database flags. Session
practice still omits an overall pass result. No thresholds, point totals, or
learner scoring formulas are changed.

Existing learner limitations: mode is inferred from the number of attempted
sessions in result/history (one means `session`, including a full start on a
one-session exam). The learner start DTO currently exposes question text/options
but not passage text, image metadata, part audio playback URLs, or session time
limits; detail exposes the audio media ID. This admin handoff does not add a
learner delivery/media API or change the existing timing rules. A richer learner
player needs a separate contract extension; do not substitute the admin detail
endpoint, which intentionally exposes solutions.

## Postman setup and frontend checklist

Import [admin-jlpt-exams.postman_collection.json](admin-jlpt-exams.postman_collection.json).
Use a disposable local/test database and upload provider configuration. Set
`baseUrl` to the server origin (default `http://localhost:8080`, no `/api/v1` or
trailing slash). Authenticate using the existing login/CSRF/cookie flow and paste
access tokens into `adminToken` and `studentToken`; both are empty in the file.
No credentials are stored. Tokens may need manual refresh during a run.

Select actual local files in the two **SELECT LOCAL FILE** multipart requests;
Postman supplies the boundary. Run folders 00–06 in order, once per new exam.
Scripts capture profile, media, hierarchy, answer, attempt and attempt-session IDs.
The workflow contains expected 400/401/403/404 responses and two attempts for the
same learner, one submitted before archive and another after archive. All writes
change data; physical draft-content deletion and soft archive are explicitly
labeled. Archive has no restore API. JSON/variable/body/script validation is
separate from executing the requests; this collection was **not executed**.

| Frontend surface | Required integration |
| --- | --- |
| List | Existing Page wrapper, zero-based pages, size 1–12, enum filters, allowed sort keys; stats keyed only by search/level |
| Builder | Ordered hierarchy and counts; duration/passing score are derived; preserve all sibling IDs when reordering; refresh shifted siblings after writes |
| Question editor | One aggregate save with the complete answer array, retained IDs, at least two visible answers and exactly one correct; use returned IDs/order |
| Uploads | Validate supported format/size locally, upload first, attach by media ID, retain existing IDs on PUT or send null to detach; failed attach does not undo upload |
| Lifecycle | Fetch readiness, display every located issue, handle fresh publication errors, distinguish content lock from lifecycle permissions; refresh detail/list/stats/readiness |
| Errors/auth | Bearer ADMIN access; preserve `fieldErrors` and publication `issues`; handle 401/403/400/404/409/413/415 without assuming every error has `data` |

## Known limitations and deferred behavior

- Existing role-provisioning security gap: `User` initializes role to `admin` and
  its pre-persist callback also assigns `admin` for null roles. Public
  `AuthServiceImpl.register` does not override this default. Consequently, a newly
  registered and verified account receives ADMIN authority. The JLPT matcher
  enforces the persisted authority correctly, but this separate auth issue needs
  a follow-up; Task 1 does not change role provisioning or existing accounts.
- Cloning and revision creation. The attempt-lock error suggests a new revision,
  but no revision/clone endpoint exists.
- MySQL-specific locking behavior remains unverified: all transaction regression
  tests use disposable H2 in MySQL compatibility mode. No production/shared
  database or real paid upload provider was called.
- Additional authoring features outside the documented API.

## Task 1 verification record

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

## Task 2 verification record

The local working tree was clean at the start. Before Task 2 edits, all 19
`AdminJlptExamIntegrationTest` cases passed and the specific ADMIN matcher covered
the exact base path and all nested routes. Existing create/update/archive and
publication restrictions were reused, with no security configuration change.

The expanded integration class has 32 passing cases. Coverage includes metadata
normalization and read-only field protection; all five passing scores; empty
catalogs/exams; search/level/status combinations; status-independent statistics;
stable pagination for every allowed sort; hierarchy counts and ordering; flags;
duration changes; and archive preservation of a completed learner attempt's saved
answer, result, review, history, content and media. All 28 endpoints, including
statistics, participate in the anonymous/non-admin authorization matrix.

Measured query counts remain bounded as catalog/hierarchy sizes grow: at most
five queries per populated list page, seven for a full detail with media, and one
aggregate for statistics with no loaded entities. Page enrichment uses two
aggregates rather than loading hierarchies or issuing per-exam counts.

Commands used the Windows Gradle Wrapper and Java 17:

```powershell
.\gradlew.bat test --tests com.mycompany.saas_japanese.AdminJlptExamIntegrationTest
.\gradlew.bat test --tests com.mycompany.saas_japanese.AdminJlptExamIntegrationTest --tests com.mycompany.saas_japanese.service.impl.JlptExamServiceImplTest --tests com.mycompany.saas_japanese.BaseQueryValidationTest --tests com.mycompany.saas_japanese.ErrorHandlingTest
.\gradlew.bat checkstyleMain checkstyleTest --continue
.\gradlew.bat check --continue
```

| Check | Final result |
| --- | --- |
| Admin JLPT integration tests | 32 passed, 0 failed (pre-task baseline: 19 passed) |
| Directly affected tests | 75 passed: admin JLPT 32, learner scoring/service 29, BaseQuery 10, error handling 4 |
| Full backend suite, run by `check --continue` | 218 total: 216 passed, 1 failed, 1 skipped |
| Checkstyle | Test sources passed; main retains 65 existing violations |
| SpotBugs | Main 226, test 13; warning descriptions identical to the retained pre-task reports |
| `git diff --check` | Passed |

The full check remains blocked by the same existing
`LessonIntegrationTest.courseDeletionIsScopedAndRetainsPreviouslyDeletedTimestamp`
failure at line 137 (`LessonServiceImpl.deleteByCourseId` is still an empty TODO),
the existing main Checkstyle violations and existing SpotBugs findings. The one
skip remains the opt-in lesson browser test described above. No checks were
disabled. Tests used the existing H2/auth fixtures and mocked external integration;
no production database or paid service was called.

## Task 3 verification record

Task 2 changes were present and uncommitted at the start; they were preserved.
No JLPT batch reorder or atomic question-and-answer authoring implementation was
present. The pre-edit `AdminJlptExamIntegrationTest` baseline was 32 passed.

Two existing fixtures were adapted to the requested ordering semantics: a
single-item sort now uses position 0, and the deterministic legacy-tie read test
seeds duplicates directly rather than creating them through POST. The assertions
for permissions, hierarchy data and ID tie-breaking remain enabled.

`AdminJlptHierarchyIntegrationTest` adds 31 cases using actual request/service
transactions and H2, checking persisted IDs and positions as well as responses:
all four reorder levels; malformed/duplicate/missing/foreign/unknown ID lists;
empty/single/repeated orders; insert/move/delete bounds; complete ownership paths;
session/part CRUD and normalization; duration/counts; all lifecycle locks; ADMIN
permissions; populated subtree deletion; shared/archived media references;
stale media flags; and transaction rollback after deletion/reorder. Separate
database-connection tests verify that a concurrent insertion causes a waiting
stale reorder to fail, competing reorders serialize, and competing media claims
produce exactly one owner. No JVM-local lock coordinates production operations.

Final checks used Java 17 and the Windows Gradle Wrapper:

| Check | Result |
| --- | --- |
| Pre-edit focused admin baseline | 32 passed |
| Final focused admin/hierarchy/error tests | 68 passed: existing admin 32, hierarchy 31, error handling 5 |
| Affected tests, including BaseQuery, learner scoring/service and lesson integration | 120 total: 119 passed, only the existing lesson-deletion test failed |
| Full backend suite via `gradlew.bat check --continue` | 250 total: 248 passed, 1 existing failure, 1 existing browser skip |
| Final Checkstyle | Test sources passed; production retains 65 existing violations |
| Final SpotBugs | Main 226, test 13; warning descriptions identical to the retained pre-task reports |
| `git diff --check` | Passed |

The full run was followed by a focused/static rerun after adding defensive copies
to the reorder DTO's ID list and fixing test formatting. Those final focused tests
passed; the two new DTO SpotBugs warnings were removed without suppression. The
static command still fails on the existing production Checkstyle and main/test
SpotBugs findings. The full-suite failure remains
`LessonIntegrationTest.courseDeletionIsScopedAndRetainsPreviouslyDeletedTimestamp`
at line 137; its empty production implementation is unchanged. The skipped
`AdminLessonWorkspaceBrowserTest` still requires an opt-in running frontend/browser.
No checks were disabled, and no production database or paid service was used.

## Task 4 verification record

Existing Tasks 1–3 changes were uncommitted at the start and were preserved. No
aggregate JLPT question-save or audio-upload endpoint existed. The pre-edit focused
baseline passed 65 cases (admin exam 32, hierarchy 31, video validation 2).

`AdminJlptAuthoringIntegrationTest` adds 14 cases using real request transactions,
an isolated H2 database, the existing auth/Brevo fixtures and mocked Cloudinary.
Coverage includes complete question creation/update, retained/new/omitted answer
IDs, correct-answer changes, order, Japanese/safe HTML, invalid bodies/IDs/numbers,
ownership, ADMIN authorization, lifecycle locks, legacy question-only updates,
image/audio attachment/replacement/removal, shared image references, deleted media,
and failure rollback. Injecting an answer repository flush failure verifies that
question/answer changes, shifted siblings and media flags all roll back together.
The upload tests also assert that remote storage runs without an active database
transaction and that upload metadata survives a later caller rollback.

`UploadServiceAudioValidationTest` adds six cases covering MP3 and WAV MIME/extension
and content checks, ID3/truncated frames, invalid WAV structures, empty/unreadable
files, mismatches, declared/actual size and the exact 20 MiB limit. Error handling
also covers the existing multipart limit with a 413 envelope.

Checks used Java 17 and the Windows Gradle Wrapper:

| Check | Result |
| --- | --- |
| Pre-edit focused baseline | 65 passed |
| Final authoring/audio/error focused tests | 26 passed: authoring 14, audio validation 6, error handling 6 |
| Directly affected tests | 174 passed: all admin JLPT, audio/video validation, error handling, learner scoring/service, BaseQuery and auth |
| Full suite through `gradlew.bat check --continue` | 271 total: 269 passed, 1 existing failure, 1 existing browser skip |
| Checkstyle | Test sources passed; production retains 65 existing violations |
| SpotBugs | Main 226, test 13; final warning descriptions identical to the retained pre-task reports |
| `git diff --check` | Passed |

After the full run, the final focused/static rerun verified a test setup-method
rename to avoid joining an existing naming warning. No warnings were suppressed.
The full-check blockers remain the unchanged
`LessonIntegrationTest.courseDeletionIsScopedAndRetainsPreviouslyDeletedTimestamp`
failure at line 137, existing main Checkstyle findings, and existing main/test
SpotBugs findings. The browser test still requires its separate opt-in running
frontend/browser environment. No checks were disabled, no production database or
paid provider was used, and there were no frontend, dependency or schema changes.

## Task 5 verification record

The pre-edit local baseline passed 106 cases: admin exam 32, hierarchy 31,
aggregate authoring 14, and learner service/scoring 29. Existing root-row locks,
ADMIN matchers, content guards, archive semantics, learner ownership checks and
history queries were reused rather than replaced.

`AdminJlptLifecycleIntegrationTest` adds 36 cases and
`JlptExamPublishValidatorTest` adds 10. Coverage includes multiple located issues,
legacy persisted defects/null fields, read-only inspection, failed-publication
rollback, derived duration, repeated transitions, optional audio, authorization,
continued answering/submission after unpublish/archive, retained results/reviews
and media, and absence of premature solution fields. Existing hierarchy and
aggregate suites continue to exercise every content-write guard.

Nine concurrency cases use separate H2 transactions and a held database exam-row
lock: edit/publish in both directions, committed answer changes invalidating a
waiting publish, unpublish/start and archive/start in both directions, first
attempt followed by unpublish blocking a waiting edit, and edit/publish followed
by a waiting start seeing the updated exam. These tests do **not** verify MySQL
locking behavior. No MySQL instance or external provider was contacted.

Checks used Java 17 and the Windows Gradle Wrapper:

| Check | Actual result |
| --- | --- |
| Pre-edit focused baseline | 106 passed |
| Affected admin/learner/auth/upload/error tests | 209 passed; before the last added concurrency case |
| Final focused admin/readiness tests | 78 passed: admin exam 32, lifecycle 36, validator 10 |
| Full suite through `gradlew.bat check --continue` | 317 total: 315 passed, 1 existing failure, 1 existing browser skip |
| Final Checkstyle | Test sources passed; production retains 65 existing findings in 46 files |
| Final SpotBugs | Main 226, test 13; warning descriptions match retained pre-task reports |
| `git diff --check` | Passed |

The focused tests and static tasks were rerun after making issue data serializable
and a validator helper static, resolving both new SpotBugs findings without
suppressions. The aggregate Gradle check remains unsuccessful because of existing
main Checkstyle findings, existing main/test SpotBugs findings, and
`LessonIntegrationTest.courseDeletionIsScopedAndRetainsPreviouslyDeletedTimestamp`
at line 137. Its `LessonServiceImpl.deleteByCourseId` implementation is unchanged.
`AdminLessonWorkspaceBrowserTest` remains skipped without its opt-in running
frontend/browser environment. No checks were disabled. At that checkpoint Task 6
still retained full-flow handoff and MySQL verification; no frontend, dependency, schema, scoring,
upload, or revision changes were introduced by Task 5.

## Task 6 verification and handoff record

The local `feature/course-client` working tree was clean at the start. Tasks 1–5
were inspected locally; their implementation, tests and API compatibility were
preserved. No commits or pushes were made.

Corrections made during final verification:

- Learner catalog pagination now invokes Bean Validation, preventing invalid/empty
  page and size values from reaching `PageRequest` and rejecting oversized pages.
- Attempt-start mode/session errors use existing 400/404 domain exceptions rather
  than falling through to 500. Failed starts leave attempt data unchanged.
- Submission persists the existing calculated pass result; history derives that
  same result from stored scores and batched sessions, including older attempts
  whose stored pass flag is stale. No legacy rows are rewritten by a history GET,
  and no scoring formula or threshold changes.
- Image upload checks filename bounds, MIME and content signatures before remote
  upload; malformed images now produce validation errors instead of a null-name
  failure or accepting an obvious format mismatch. Existing supported extensions,
  response fields, upload permissions and the 10 MiB limit are preserved.

`AdminJlptWorkflowIntegrationTest` adds eight cases: seven pagination boundaries
and one complete HTTP workflow with independently committed service transactions.
The workflow authors three sessions, four parts and five aggregate questions,
uploads image/audio through mocked Cloudinary, retains/removes/adds answer IDs,
reorders all four levels, and verifies fresh persisted reads, media flags, counts,
duration, passing score and status-independent statistics. It resolves initial
readiness errors, publishes, takes and submits a passing full exam, and checks
result/history consistency and completed-owner review. A separate in-progress
attempt continues saving after unpublish and again after archive, then submits.
Failed writes, first-attempt content locking, ownership, premature solution
privacy, blocked new starts and retained history/media are asserted.

`UploadServiceImageValidationTest` adds three cases for supported signatures,
missing/oversized filenames, MIME/content mismatch, empty/oversized/unreadable
files and no provider/database calls on validation failure. Existing learner unit
tests now also verify stale history flags without mutating the attempt. New tests
first reproduced the relevant failures before fixes; an existing submit fixture
was supplied its required exam/level when pass persistence was added.

Existing suites cover the remaining authorization matrix, every hierarchy
ownership level, malformed inputs, incomplete/foreign/duplicate reorders,
aggregate answer rules/IDs, media ownership, subtree deletion, transaction
rollback, publication issues and content locks. Existing separate-transaction
H2 tests exercise membership/order/media contention and nine lifecycle/edit/start
interleavings. No JVM-local synchronization was added to production operations.

Commands ran from `backend/` with Java 17 and the Windows Gradle Wrapper:

```powershell
.\gradlew.bat test --tests '*AdminJlpt*Test' --tests '*JlptExamPublishValidatorTest' --tests '*JlptExamServiceImplTest' --tests '*UploadService*Test'
.\gradlew.bat test --tests '*AdminJlpt*Test' --tests '*JlptExamPublishValidatorTest' --tests '*JlptExamServiceImplTest' --tests '*UploadService*Test' --tests '*BaseQueryValidationTest' --tests '*ErrorHandlingTest' --tests '*Auth*Test' checkstyleTest --continue
.\gradlew.bat test --tests '*AdminJlptWorkflowIntegrationTest' --tests '*UploadServiceImageValidationTest' --tests '*JlptExamServiceImplTest'
.\gradlew.bat test check build --continue
```

The full command includes tests, Checkstyle, SpotBugs and packaging, with no
exclusions or disabled checks. It was repeated after correcting new test-only
SpotBugs findings (specific checked exception declarations and a stable local
cleanup ID instead of dereferencing nullable instance state in lambdas).

| Check | Final actual result |
| --- | --- |
| Pre-edit admin/learner/upload baseline | 160 passed |
| Focused admin, learner, upload, query, error and auth regression run | 231 passed; test Checkstyle passed |
| Final changed-test rerun after test-only static fixes | 40 passed: workflow 8, image validation 3, learner service 29 |
| Full backend suite, including final rerun | 328 total: 326 passed, 1 existing failure, 1 existing skip, 0 errors |
| Checkstyle | Main 65 existing findings in 46 files, no additions/removals; test sources 0 |
| SpotBugs | Main 224 (two existing findings removed), test 13 unchanged; no added warning descriptions |
| `bootJar`, `jar`, `assemble` | Packaging succeeded; final repeat up-to-date |
| Overall `test check build --continue` | Failed on the existing lesson test and static findings; **not a green backend build** |
| Contract route comparison, Postman JSON/body/variable/script validation, `git diff --check` | Passed |

The existing failure remains
`LessonIntegrationTest.courseDeletionIsScopedAndRetainsPreviouslyDeletedTimestamp`
at line 137: `LessonServiceImpl.deleteByCourseId` is still an empty TODO. That
unrelated implementation was not changed. `AdminLessonWorkspaceBrowserTest` is
still skipped without its opt-in running frontend/browser environment. The two
removed main SpotBugs descriptions concerned an intentional generic runtime
exception and the redundant image extension null check; all other retained
warning descriptions match the pre-task reports. Four new test-only warnings
were corrected without suppressions before the final full checks.

The admin workflow is verified on H2, but repository-wide verification remains
blocked by those baseline failures. The existing public-registration ADMIN
default described above remains a separate security release blocker; trusted role
provisioning must be addressed in the auth domain before deployment.

MySQL locking is **not verified**. The configured local Docker Desktop context
points to `npipe:////./pipe/dockerDesktopLinuxEngine`, but `docker info` failed
because that daemon pipe is unavailable. No disposable MySQL instance was started
and no production/shared database or real paid provider was contacted.

The Postman collection has 62 requests with empty admin/student token variables,
captured resource IDs, manual file-selection/authentication instructions, and
explicit destructive/soft-archive labels. JSON parsing, variable references,
substituted raw JSON bodies and JavaScript test-script syntax were checked.
All 35 implemented admin method/path pairs match the contract inventory exactly.
The collection was generated and validated, **not executed**.
