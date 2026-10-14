# Student learning API

All URLs below include the `/api/v1` prefix supplied by `WebConfiguration`.
The existing `StudyController` / `StudyService` own this contract.
IDs in examples are illustrative; use IDs returned by the API.

## Authentication and visibility

Every `/api/v1/study/**` request requires `Authorization: Bearer {accessToken}` using the existing
access-token/session flow. Refresh/logout behavior is unchanged. An active, verified authenticated user
must be enrolled in the lesson's course, including for vocabulary, kanji, quiz, answers and progress.
There is no student-supplied `userId` in this contract. Ownership always comes from the security context.

Both course and lesson must be published, `isDeleted = false`, and `deletedAt = null`.
Missing/unavailable parents return 404 before checking enrollment. Available resources without enrollment
return 403. Admin authority does not bypass enrollment on study endpoints.
Public storefront summaries remain at `GET /api/v1/client/courses/{courseId}/lessons`;
they contain no protected learning content or personalized progress. No storefront contract is changed here.
Admin content reads under `/api/v1/lessons`, `/api/v1/vocabularies`, `/api/v1/kanjis` (including nested paths)
require `ROLE_ADMIN`; students use the study endpoints so those routes cannot bypass enrollment.

Successful 200 responses use the existing envelope:

```json
{
  "statusCode": 200,
  "error": null,
  "message": "CALL API SUCCESS !",
  "data": {}
}
```

Examples below show the value of `data`. A 204 response has no body or envelope.
Dates are UTC ISO-8601 instants; optional dates/content are JSON `null`.

## Endpoints

| Method | URL | Success |
| --- | --- | --- |
| GET | `/api/v1/study/courses/{courseId}/lessons` | 200, ordered lesson summaries |
| GET | `/api/v1/study/lessons/{lessonId}` | 200, lesson learning content |
| GET | `/api/v1/study/lessons/{lessonId}/vocabularies` | 200, vocabulary array |
| GET | `/api/v1/study/lessons/{lessonId}/kanjis` | 200, kanji array |
| GET | `/api/v1/study/lessons/{lessonId}/quiz` | 200, published quiz; 204 when absent |
| POST | `/api/v1/study/lessons/{lessonId}/quiz/{quizId}/questions/{questionId}/answer?optionId={optionId}` | 200, answer feedback |
| GET | `/api/v1/study/lessons/{lessonId}/progress` | 200, current user's progress |
| POST | `/api/v1/study/lessons/{lessonId}/progress` | 200, updated current-user progress |
| GET | `/api/v1/study/courses/{courseId}/progress` | 200, current user's course progress |

### Course lesson list

```http
GET /api/v1/study/courses/42/lessons
Authorization: Bearer {accessToken}
```

```json
[
  {
    "id": 108,
    "courseId": 42,
    "title": "Introductions",
    "slug": "introductions",
    "durationMinutes": 10,
    "watchDuration": 80,
    "videoDuration": 100,
    "progressPercent": 80.00,
    "isCompleted": true,
    "lastWatchedAt": "2026-10-14T10:00:00Z",
    "completedAt": "2026-10-14T10:00:00Z"
  }
]
```

The existing array contract is retained, without pagination/filter/sort parameters. Only available lessons
are returned, ordered by ascending persisted lesson ID. `Lesson` has no persisted `sortOrder`.
The query projects summary/progress fields together and does not load grammar, media or per-lesson relations.
No lessons returns `data: []`. No progress row returns zero durations/percentage, `isCompleted: false`,
and null timestamps. These defaults are synthesized without saving a row.

### Lesson detail

```http
GET /api/v1/study/lessons/108
Authorization: Bearer {accessToken}
```

```json
{
  "id": 108,
  "courseId": 42,
  "title": "Introductions",
  "slug": "introductions",
  "grammar": "<p>Published grammar content</p>",
  "durationMinutes": 10,
  "videoUrl": "https://example.test/lesson.mp4"
}
```

`grammar` is the saved lesson HTML. Null/blank grammar becomes `null`. `videoUrl` is `null` when no active
video is attached, the media is deleted, or its URL is blank. Both may be absent at the same time;
the valid lesson still returns 200. Vocabulary/kanji/quiz are fetched separately.

`durationMinutes` is the nullable **estimated study duration in minutes**, also used on summaries.
It is not the precise video runtime. Neither `Lesson` nor `Media` persists a precise video runtime;
the player obtains that from video metadata for progress submissions. No duration is fabricated for
text-only lessons, and no conversion of the study estimate into video seconds is performed.

### Vocabulary and kanji

```http
GET /api/v1/study/lessons/108/vocabularies
GET /api/v1/study/lessons/108/kanjis
```

Vocabulary `data` example (the existing DTO is retained):

```json
[
  {
    "id": 301,
    "lessonId": 108,
    "word": "学生",
    "reading": "がくせい",
    "meaningVi": "Học sinh",
    "exampleSentenceJp": "私は学生です。",
    "exampleSentenceVi": "Tôi là học sinh.",
    "partOfSpeech": "noun",
    "createdAt": "2026-10-14T09:00:00Z",
    "updatedAt": "2026-10-14T09:00:00Z"
  }
]
```

Kanji `data` example:

```json
[
  {
    "id": 401,
    "lessonId": 108,
    "kanji": "学",
    "onyomi": "ガク",
    "kunyomi": "まなぶ",
    "meaningVi": "Học",
    "strokeCount": 8,
    "exampleWords": "学生",
    "createdAt": "2026-10-14T09:00:00Z",
    "updatedAt": "2026-10-14T09:00:00Z"
  }
]
```

Both endpoints return 200 with `data: []` when no active items exist; deleted items are excluded.
Nullable item fields remain null. These arrays have no guaranteed author-defined ordering.

### Quiz and answers

```http
GET /api/v1/study/lessons/108/quiz
```

```json
{
  "id": 501,
  "title": "Practice",
  "description": "Choose an answer",
  "questions": [
    {
      "id": 601,
      "questionText": "Choose the reading of 学生",
      "questionType": "SINGLE_CHOICE",
      "sortOrder": 0,
      "options": [
        { "id": 701, "optionText": "がくせい", "sortOrder": 0 },
        { "id": 702, "optionText": "せんせい", "sortOrder": 1 }
      ]
    }
  ]
}
```

Questions and options are ordered by `sortOrder`, then ID. Deleted questions are excluded.
Initial payloads never include `isCorrect`, correct option IDs or answer keys.

For an accessible lesson with no active published quiz (missing, draft or deleted), GET returns
**204 No Content**. Treat this as an absent optional quiz tab. It is distinct from 401/403/404 for an
inaccessible lesson. Multiple active legacy quizzes retain the existing 409 response requiring admin repair.

```http
POST /api/v1/study/lessons/108/quiz/501/questions/601/answer?optionId=701
Authorization: Bearer {accessToken}
```

There is no request body. The existing single-option answer contract is retained:

```json
{
  "correct": true,
  "correctOptionId": 701,
  "message": "Chính xác!"
}
```

Incorrect choices return `correct: false`, the correct option ID, and `"Đáp án chưa chính xác!"`.
The complete lesson → published quiz → active question → option relationship is validated before feedback.
A foreign quiz returns 404; a question belonging to another quiz or option belonging to another question
returns 400, preserving the existing mismatch semantics. Missing/deleted IDs return 404.
No published quiz returns 404 for an answer submission, since there is no answerable resource.
The endpoint evaluates an answer without recording an attempt or completing the lesson.

### Lesson progress

```http
POST /api/v1/study/lessons/108/progress
Authorization: Bearer {accessToken}
Content-Type: application/json

{"watchDuration":80,"videoDuration":100}
```

Both fields are required JSON integers in **whole seconds**:

- `watchDuration >= 0`: cumulative watched duration reported by the player; not an incremental delta.
- `videoDuration > 0`: actual player-reported runtime; do not use `durationMinutes` as a substitute.

The same response shape is used by `GET /api/v1/study/lessons/{lessonId}/progress`:

```json
{
  "lessonId": 108,
  "watchDuration": 80,
  "videoDuration": 100,
  "progressPercent": 80.00,
  "isCompleted": true,
  "lastWatchedAt": "2026-10-14T10:00:00Z",
  "completedAt": "2026-10-14T10:00:00Z",
  "courseProgressPercent": 50.00
}
```

Watched seconds retain the greatest reported cumulative value and are capped at the submitted runtime.
The runtime is updated from each valid submission. Percentage is watched/runtime × 100, rounded to two
decimal places and bounded to 0–100. Completion uses the existing **at least 80% watched** rule, evaluated
before display rounding. Once completed, it remains completed and the original completion timestamp is
preserved. Replays/lower reports do not reset it. `lastWatchedAt` records an explicit progress submission.

Updates lock the existing user/course enrollment row, so concurrent first inserts cannot create duplicate
progress and concurrent updates to different lessons do not lose enrollment totals. The existing unique
user/lesson constraint remains. Writes use READ_COMMITTED so reads after waiting on that lock see committed
updates on MySQL. No schema changes are required.

An available video is required for video-progress POSTs. A lesson without one returns 400 for this POST;
its learning content and zero/default progress remain readable. This API does not add a separate manual
completion rule for text-only lessons. Opening a lesson, loading any tab, or answering a quiz never invents
watch time or marks completion. The client must submit progress only from actual player activity.

Before the first submission, GET returns zero durations/percentage, false completion, null timestamps,
and the derived course percentage. Here `videoDuration: 0` means **no recorded progress runtime**; it is
not the actual runtime of the video. Every GET is read-only and creates/modifies no progress or enrollment.

### Course progress

```http
GET /api/v1/study/courses/42/progress
```

```json
{
  "courseId": 42,
  "courseTitle": "Japanese basics",
  "totalLessons": 2,
  "completedLessons": 1,
  "progressPercent": 50.00,
  "completedAt": null
}
```

Totals and completed counts use the same published, non-deleted lesson set as the study list, scoped
to this course and current user. Draft/deleted lessons and other users' progress do not contribute.
Course percentage is completedLessons/totalLessons × 100, rounded to two places and bounded to 0–100;
an empty available syllabus yields zero totals and 0%.

Progress POSTs update the stored enrollment percentage and set its completion timestamp the first time
it reaches 100%. Lesson and enrollment completion timestamps are preserved on subsequent updates.
GET derives current totals without updating stored enrollment fields. Course `completedAt` is the stored
historical timestamp; changing the published syllabus can change current totals without resetting it.

## Errors

Errors use the existing unwrapped error envelope:

```json
{
  "status": 403,
  "message": "Access denied",
  "fieldErrors": {},
  "timestamp": "2026-10-14T10:00:00Z"
}
```

| Status | Meaning |
| --- | --- |
| 400 | Invalid JSON/types, missing `optionId`, invalid progress fields, no video for video progress, or question/option parent mismatch |
| 401 | No valid access token/session, expired/revoked token, or authenticated user unavailable/inactive/unverified |
| 403 | Available course/lesson, but current user is not enrolled |
| 404 | Course/lesson missing, unpublished or deleted; missing/deleted quiz/question/option; quiz outside the lesson; no published quiz for an answer |
| 409 | Multiple active legacy quizzes; administrator repair required |

For Bean Validation failures, `message` is `"Validation failed"` and `fieldErrors` maps fields to messages.
`401` includes `WWW-Authenticate: Bearer`. Never interpret the optional-quiz 204 as an access error.

## Frontend lesson-click contract

1. Use real `courseId` and lesson `id` from course/study lesson responses to link to
   `/student/courses/{courseId}/lessons/{lessonId}`. No fixed course/lesson/user IDs are needed.
2. On that route, request `GET /api/v1/study/lessons/{lessonId}` with the authenticated session's access token.
   Check the returned `courseId` against the route's course ID before rendering course navigation.
3. Load vocabulary, kanji, optional quiz and current progress from the separate endpoints above, as tabs need them.
   Hide empty optional sections, handle 204 quiz without parsing JSON, and handle 401/403/404 separately.
4. Use estimated minutes for syllabus labels. Use real video metadata/activity to submit whole-second progress.
   Fetch the protected study list and course progress for personalized sidebar/progress displays.
5. After a progress POST, refresh/invalidate lesson progress, study lesson list and course progress caches
   (and any enrollment/dashboard views displaying stored progress). GET alone never starts progress.

Frontend click/navigation wiring is intentionally left for the next task. No frontend, UI or AI-service
files are changed by this backend task.

## Deliberate contract changes

- Study lesson list/detail use student DTOs. Existing `id`, `courseId`, `title`, `slug`, `durationMinutes`
  names are retained. Detail retains `grammar` and `videoUrl`; the list now adds current-user progress and
  omits content. Admin-only `isPublished`, `isDeleted`, `videoMediaId`, `createdAt`, `updatedAt` are omitted.
  Admin lesson DTOs/endpoints are unchanged. Vocabulary/kanji and quiz payloads are retained.
- All study endpoints now require enrollment; non-enrollment is 403, unavailable parents are 404.
- Admin lesson/vocabulary/kanji GETs now require admin authority, closing alternative content-access paths.
- An accessible lesson's absent/draft/deleted quiz GET changes from 404 to 204; quiz answer absence stays 404.
- Video-progress POSTs reject lessons without available video rather than accepting fabricated durations.
- Course-progress GET no longer saves enrollment. Counts and percentages now consistently exclude unavailable lessons.
- The 80% completion boundary is evaluated before percentage rounding, preventing 79.995% from completing early.

## Regression verification

`StudentLearningIntegrationTest` covers the endpoint access matrix, availability, optional content,
initial answer secrecy, parent ownership, validation, user ownership, exact completion boundaries,
repeated/concurrent writes, consistent totals, and unchanged database rows across every GET.
`AdminLessonQuizIntegrationTest` retains the administration/answer regressions with real enrolled student fixtures.
Tests use the existing H2 MySQL-mode infrastructure and mock Brevo; they do not call external paid services.
