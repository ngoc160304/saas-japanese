# Admin JLPT Exam Management — bàn giao frontend task 1

Đối chiếu implementation local trên nhánh `feature/course-client`, ngày 2026-10-15.
Nguồn: `AdminJlptExamController`, `AdminJlptExamService`/implementation, DTO/query/enums,
mapper, validator, `SecurityConfiguration`, `WebConfiguration`, upload và error handler;
đối chiếu thêm [tài liệu backend](../../backend/docs/admin-jlpt-exams-api.md) và
[Postman collection](../../backend/docs/admin-jlpt-exams.postman_collection.json).
Không dùng GitHub hoặc HTML để suy ra API. Backend/UI chỉ được đọc.

## Ranh giới truy cập và điểm chênh lệch quan trọng

- `/admin/exams` giữ đúng URL sidebar hiện có; builder nền là `/admin/exams/[id]`.
- Admin layout hiện có `AuthGuard`: chờ bootstrap, refresh/session lỗi, chuyển đến
  `/login?next=...` khi chưa đăng nhập. Feature tiếp tục dùng chính boundary này.
- **User model chưa cung cấp role**: backend `ResLoginDTO.UserLogin` và frontend
  `AuthUser` chỉ có `id`, `email`, `name`. `/auth/myProfile` cũng không có role/permissions.
  Do đó chưa thể thực hiện check ADMIN trực tiếp từ authenticated user model.
  Không thêm role giả, không giải mã JWT, không sửa backend hoặc auth strategy.
- Foundation dùng GET stats không filter làm kiểm tra truy cập do backend quyết định:
  mọi endpoint admin JLPT đều yêu cầu `ROLE_ADMIN`, kể cả stats. Chỉ mount feature con
  khi request này thành công; 403 hiển thị trạng thái từ chối, 401 đi qua refresh và
  redirect sẵn có. Không request list/detail khi probe bị từ chối. Boundary kiểm tra
  lại khi mount, không cấp truy cập chỉ dựa vào cache stats cũ. Refetch stats nền sau
  khi đã kiểm tra quyền không unmount form/editor; 401/403 vẫn chặn ngay. Request nghiệp vụ cũng
  xử lý 401/403 và ưu tiên error hơn dữ liệu cache. Lỗi mạng/5xx cho phép thử lại.
- Đây là cách dùng contract đang hỗ trợ. Muốn check role từ user model ở task sau
  cần backend cung cấp role/authorities trong login/refresh hoặc một endpoint session
  được xác thực; chưa có contract đó để frontend sử dụng. Backend vẫn quyết định quyền.
- `AuthBootstrap` hiện có hủy/clear QueryClient khi user ID thay đổi. Cache admin dùng
  namespace riêng, không trộn đáp án đúng vào cache student và không thêm API state Redux.

## Contract matrix

URL server: `B = /api/v1/admin/jlpt-exams`.
`WebConfiguration` thêm `/api/v1`; Axios hiện có thêm `/${API_VERSION}` vào origin
`NEXT_PUBLIC_API_URL`. Module mới chỉ dùng `/admin/jlpt-exams`, không lặp prefix.

Alias giữ đủ ownership: `E=B/{examId}`;
`S=E/sessions/{sessionId}`; `P=S/parts/{partId}`;
`Q=P/questions/{questionId}`; `A=Q/answers/{answerId}`.

| Method | Path | Input | `data` / status |
| --- | --- | --- | --- |
| GET | B | ExamQuery | Spring Page<ExamSummary>, 200 |
| GET | B/stats | StatsQuery | ExamStats, 200 |
| GET | E | — | ExamDetail, 200 |
| GET | E/validation | — | ExamValidation, 200 |
| POST | B | ExamInput | ExamDetail, 201 |
| PUT | E | ExamInput | ExamDetail, 200 |
| DELETE | E | — | Không body, 204; archive mềm |
| POST | E/publish | Không body | ExamDetail, 200 |
| POST | E/unpublish | Không body | ExamDetail, 200 |
| GET | S | — | Session, 200 |
| POST | E/sessions | SessionInput | Session, 201 |
| PUT | S | SessionInput | Session, 200 |
| PATCH | S/sort-order | `{sortOrder}` | Session, 200 |
| DELETE | S | — | Không body, 204 |
| PATCH | E/sessions/reorder | `{ids}` | Session[], 200 |
| GET | P | — | Part, 200 |
| POST | S/parts | PartInput | Part, 201 |
| PUT | P | PartInput | Part, 200 |
| PATCH | P/sort-order | `{sortOrder}` | Part, 200 |
| DELETE | P | — | Không body, 204 |
| PATCH | S/parts/reorder | `{ids}` | Part[], 200 |
| GET | Q | — | Question, 200 |
| POST | P/questions | QuestionInput | Question, 201 |
| PUT | Q | QuestionInput | Question, 200 |
| POST | P/questions/with-answers | CreateQuestionWithAnswersInput | Question có đủ answers, 201 |
| PUT | Q/with-answers | UpdateQuestionWithAnswersInput | Question có đủ answers, 200 |
| PATCH | Q/sort-order | `{sortOrder}` | Question, 200 |
| DELETE | Q | — | Không body, 204 |
| PATCH | P/questions/reorder | `{ids}` | Question[], 200 |
| GET | A | — | Answer, 200 |
| POST | Q/answers | AnswerInput | Answer, 201 |
| PUT | A | AnswerInput | Answer, 200 |
| PATCH | A/sort-order | `{sortOrder}` | Answer, 200 |
| DELETE | A | — | Không body, 204 |
| PATCH | Q/answers/reorder | `{ids}` | Answer[], 200 |
| POST | /api/v1/upload/images | multipart `file` | Media record được wrap, 200 |
| POST | /api/v1/upload/audios | multipart `file` | MediaResponse, 200; ADMIN |

Không có endpoint GET collection session/part/question/answer riêng. Detail trả toàn
bộ hierarchy; API có nested GET nhưng không tạo query hook trùng dữ liệu detail.
ID backend là Long dương. Theo convention frontend, route chỉ chấp nhận chuỗi chữ số
và Number safe integer >0; ID vượt `Number.MAX_SAFE_INTEGER` chưa được hỗ trợ.

### Query và pagination

| Query | Contract |
| --- | --- |
| `page` | Zero based; mặc định 0; integer >=0 |
| `size` | Mặc định 10; integer 1–12 |
| `search` | Trim, không phân biệt hoa thường, substring title **hoặc description**; blank bỏ qua |
| `level` | N1, N2, N3, N4, N5; blank bỏ qua; giá trị sai 400 |
| `status` | DRAFT, PUBLISHED, ARCHIVED; blank/không truyền: loại archive; ARCHIVED lấy cả soft-deleted |
| `sortKey` | id, title, level, totalTimeMinutes, status, createdAt, updatedAt; sai/blank về updatedAt |
| `sortType` | ASC/DESC không phân biệt hoa thường, sai/blank về DESC |

Page/size rỗng, sai kiểu, vượt giới hạn: 400. Non-ID sort có tie-breaker ID cùng chiều.
Status sort dùng flag `isPublished`, không sort theo chữ của nhãn status.
Spring Page gồm `content`, `number`, `size`, `numberOfElements`, `totalElements`,
`totalPages`, `first`, `last`, `empty`, `pageable`, `sort`; reuse `PageResponse<T>`.
URL frontend dùng page one based, chuyển sang API zero based. Parser giữ default hợp
lệ khi URL malformed; sửa page vượt trang cuối bằng replace và giữ filter/sort.
Task 1 đọc filter/search/sort từ URL; toolbar chỉnh filter thuộc task sau.

StatsQuery chỉ có `search`, `level`. API layer và stats key chủ động loại bỏ status,
page, size, sort dù truyền list object vào. Stats gồm `totalExams`, `draftExams`,
`publishedExams`, `archivedExams`: tổng bao gồm archive, bằng tổng ba nhóm sau filter.
Không dùng số lượng item của trang hiện tại để tính stats.

### Payload, enums, nullable và validation

PUT dùng cùng DTO với POST, phải gửi lại field bắt buộc.

| Payload | Required | Optional / nullable |
| --- | --- | --- |
| ExamInput | `level`: N1–N5; `title`: nonblank <=200 | `description`: null hoặc <=500 |
| SessionInput | `name`: nonblank <=150; `sessionType`: language_knowledge/reading/listening; `timeLimitMinutes`: integer 1–180; `sortOrder`: integer >=0 | Không có description |
| PartInput | `name`: nonblank <=150 | `instructions`: null hoặc <=10000; `sortOrder` bỏ qua mặc định 0 nhưng explicit null không hợp lệ; `audioMediaId`: null hoặc ID dương |
| QuestionInput | `questionText`: nonblank <=20000; `questionType`: single_choice; `points`: 0.01–999.99, tối đa 2 số lẻ; `sortOrder`: integer >=0 | `passageText`: null hoặc <=50000; `explanation`: null hoặc <=20000; `imageMediaId`: null hoặc ID dương |
| AnswerInput | `answerText`: nonblank <=500; `isCorrect`: boolean; `sortOrder`: integer >=0 | — |
| Atomic answer | `answerText`, `isCorrect` như trên | `id`, `sortOrder`: null hoặc bỏ qua; explicit sortOrder phải bằng array index |

JSON strict: chuỗi cho text/enums, integer cho ID/order/duration, number cho points,
boolean cho correctness. Không ép kiểu string/number/boolean, không nhận ordinal enum,
fractional integer hoặc overflow. Extra JSON fields bị ignore, không tạo field editable.

Response Summary: `id`, `level`, `title`, `description`, `totalTimeMinutes`, `status`,
`hasAttempts`, `contentLocked`, `sessionCount`, `partCount`, `questionCount`,
`passingScore`, `createdAt`, `updatedAt`. Detail thêm `sessions[]`.
Session: `id/name/sessionType/timeLimitMinutes/sortOrder/parts[]`.
Part: `id/name/instructions/sortOrder/audio/questions[]`.
Question: `id/questionText/passageText/questionType/explanation/points/sortOrder/image/answers[]`.
Answer: `id/answerText/isCorrect/sortOrder`.
Media summary: `id/originalName/secureUrl/fileType` (IMAGE, AUDIO, VIDEO).
Nullable response fields: description, instructions, passageText, explanation, audio,
image. Arrays không null; timestamps là Instant ISO string; points/passingScore JSON number.
Detail/admin nested response chứa đáp án đúng và explanation, chỉ dùng cache admin.

Atomic save cần >=2 answers và đúng một đáp án đúng. Create không có answer ID cũ;
update nhận union answer mới (không ID/null) và answer cũ (ID bắt buộc). Answer ID phải
thuộc đúng question, không trùng; answer cũ vắng trong complete set bị xóa. Thứ tự array
trở thành 0..N-1. Text được sanitize bằng sanitizer backend, vẫn phải visibly nonblank.
Legacy question PUT không thay answers. Lưu aggregate là một transaction; không tách
thành nhiều mutation câu hỏi/đáp án ở editor sau này.

### Reorder, media và lifecycle

- Batch reorder phải gửi **toàn bộ** sibling IDs mỗi ID đúng một lần; array index
  là zero-based sortOrder. [] chỉ hợp lệ với collection đang rỗng. Duplicate, thiếu,
  thừa, foreign ID: 400; sai ancestor path: 404. Không suy ra reorder từ trang đã lọc.
- POST sortOrder chèn 0..N; PUT/PATCH di chuyển 0..N-1. Các sibling còn lại dịch vị trí;
  delete đóng gap. Reads dùng sortOrder ASC rồi id ASC. Display có thể cộng 1.
- Audio thuộc Part qua audioMediaId; ảnh thuộc Question qua imageMediaId. Gửi ID, không
  URL. PUT bỏ qua/null media ID sẽ tháo liên kết. Media phải active, đúng type; media
  bị dùng chỗ khác 409. Backend giữ isUsed; upload chưa đồng nghĩa đã attach.
- Reuse uploadAPI/client hiện có. Bổ sung `uploadAudio`, giữ return wrapper của
  `uploadImage` cho caller cũ; admin API unwrap media nhất quán. Image path chuyển
  sang relative `/upload/images` để dùng chính Axios base URL.
- Image: .jpeg/image/jpeg, .png/image/png, .webp/image/webp, .gif/image/gif; <=10 MiB;
  **.jpg chưa được backend hỗ trợ**. Audio: .mp3/audio/mpeg hoặc .wav/audio/wav,
  audio/x-wav, audio/wave; <=20 MiB. Tên nonblank <=255; tệp không rỗng; MIME/extension
  case insensitive, nhận MIME parameters. Validator frontend kiểm tra trước upload;
  backend kiểm tra signature/frame/chunk. Task 1 chưa có media controls/preview.
- Exam status DRAFT/PUBLISHED/ARCHIVED; không có question status. Exam mới là DRAFT.
- Duration bằng tổng timeLimitMinutes của sessions, không editable trên exam.
- PassingScore từ JlptScoringRule: N1=100, N2=90, N3=95, N4=90, N5=80. Không giả định
  max score từ response này; scoring còn section thresholds do backend quản lý.
- Content/metadata writes chỉ cho active unpublished exam không có bất kỳ attempt nào.
  PUBLISHED: 409, cần unpublish. Có attempt: vẫn 409 sau unpublish; tạo revision khác.
  ARCHIVED: content/lifecycle writes 404, reads vẫn giữ hierarchy/history.
- Publish/unpublish/archive được phép với attempts; publish vẫn cần nội dung hợp lệ.
  Publish/unpublish lặp lại trên active exam được hỗ trợ; archive lặp lại 404.
  Archive là DELETE mềm, tự unpublish và giữ lịch sử; không có restore endpoint.
- Không suy ra canPublish từ `!contentLocked`. `canPublish` từ validation có thể true
  với published hoặc attempted exam; archived luôn false.
- Backend transaction/root lock quyết định kết quả. Không có version token; stale
  membership/lock contention có thể 400/409: refetch rồi để người dùng quyết định retry.

### Envelopes và errors

Success JSON: `{statusCode,error:null,message,data}`; API unwrap một lần. DELETE 204
không parse body. Lỗi là `{status,message,fieldErrors,timestamp}`, không nằm trong data.
400 validation có map fieldErrors; malformed/path/type errors `Invalid request`, map rỗng.
Publish 400 thêm `issues[]`, giữ mọi issue kể cả trùng path. `getAdminJlptError` tái dùng
normalizer chung và giữ issues có type; API/hooks giữ nguyên Axios error để form xử lý.

Validation response gồm `examId/status/contentValid/canPublish/hasAttempts/contentLocked/
totalTimeMinutes/issues[]`. Mỗi issue có `code/message/path/category/resourceIds`;
category CONTENT hoặc LIFECYCLE. Brackets trong path là **resource IDs**, không phải
array indices. resourceIds có examId và ancestor/answerId/mediaId khi biết.
Codes hiện tại: EXAM_LEVEL_REQUIRED, TEXT_REQUIRED, TEXT_TOO_LONG, COLLECTION_EMPTY,
SESSION_TYPE_UNSUPPORTED, SESSION_DURATION_INVALID, QUESTION_TYPE_UNSUPPORTED,
QUESTION_POINTS_INVALID, ANSWERS_TOO_FEW, CORRECT_ANSWER_COUNT,
ANSWER_CORRECTNESS_REQUIRED, SORT_ORDER_INVALID, MEDIA_UNAVAILABLE,
MEDIA_TYPE_INVALID, EXAM_DURATION_INVALID, EXAM_ARCHIVED.

401: thiếu/hết hạn/revoked token, WWW-Authenticate Bearer; 403: không ADMIN.
404: thiếu resource/sai parent/archived write. 409: published/attempted lock, media
ownership hoặc DB conflict/lock. Upload có thể 413, 415; unsupported method 405;
5xx dùng thông báo an toàn từ normalizer chung. Không retry mutation tự động.

## Route/component map và reuse

| Layer | File/component | Trách nhiệm |
| --- | --- | --- |
| app/admin/exams/layout.tsx | AdminJlptAccessBoundary | Chờ session và server ADMIN check trước khi mount con |
| app/admin/exams/page.tsx | Suspense → AdminJlptExamListPage | Thin route; real stats, read-only list, pagination |
| app/admin/exams/[id]/page.tsx | parseAdminJlptExamId → AdminJlptExamDetailPage | Await params theo Next.js cài local, validate ID, notFound |
| app/admin/exams/loading/error/not-found.tsx | AdminJlptState | Route loading, recovery (Next 16.3 retry), invalid ID state |
| features/admin-jlpt-exams/components | List/Detail/Status/AccessBoundary/State | Orchestration, error/access/empty states; summary và session/part đọc |
| apis/admin-jlpt-exams | .api/.type/.keys + admin-jlpt-media | Contract, unwrap, ownership paths, read AbortSignal, media validation |
| features/admin-jlpt-exams/hooks | useAdminJlptExams | Query/mutation lifecycle |

Reuse: AdminShell/sidebar/AuthGuard/AuthBootstrap, authorized Axios/session refresh,
QueryProvider, getApiError, Header (showProfile=false), PageSection, StatCard,
DataTablePagination, Badge, Button, PageResponse/ApiResponse và uploadAPI.
Student JLPT được đọc để đối chiếu loading/pagination và cách dùng signal; không reuse
student DTO/query keys hoặc mock data. Không duplicate standalone header/sidebar HTML.

## Query keys và invalidation

Root `['admin-jlpt-exams']`; list `[root,'list',params]` gồm tất cả params ảnh hưởng
response; stats `[root,'stats',{search?,level?}]`; detail `[root,'detail',examId]`;
validation `[root,'validation',examId]`. Query hooks chỉ enabled khi auth initialized
và authenticated, đặt trong feature access boundary. Không tạo nested query hooks.

Create exam seed detail mới + invalidate mọi list/stats. Metadata, lifecycle và mọi
nested create/update/delete/sort/atomic/batch mutation invalidate tất cả list/stats
và detail/validation của exam bị tác động. Trên lỗi 400/404/409 cũng refetch các query
này để cập nhật snapshot/lock/membership. Không thay cache bằng nested response một
phần, không optimistic structural update. Upload độc lập chưa attach không invalidate.
Archive refetch detail để hiện archived thay vì xóa lịch sử trong cache.
Student query cache không bị mutation admin thay thế.

## UI references và phạm vi task tiếp theo

Đã đọc admin_jlpt_exam.html, admin_jlpt_exam_builder.html,
admin_jlpt_question_editor.html và fe_design_guidline.md.
Task 1 giữ hierarchy header → stats → list và overview → structure, dùng shell/style
hiện có. Theo phạm vi task, chủ động dùng danh sách đọc gọn, chưa triển khai full card
gallery/toolbar/forms/editor/actions/preview trong mockup.

Khác contract phải giữ cho tasks 2–7:

- Bỏ question status, audio URL tại question, image URL trực tiếp, editable exam
  duration/passing score, session description, part default points và select status
  trong metadata form. Không có các field đó trong DTO.
- Backend dùng uppercase exam status, lowercase session/question enum.
- Session duration 1–180 (mockup min 5); question points 0.01–999.99 (mockup 0.5–10).
- Không bắt đúng 4 đáp án, số câu JLPT cố định hoặc audio bắt buộc khi backend không yêu cầu.
- Search theo title/description; level là filter riêng. Không mặc định gồm archived.
- DELETE exam là archive có giữ lịch sử, khác nội dung cảnh báo xóa vĩnh viễn trong HTML.

Task 1 cung cấp API/types/hooks, quyền truy cập theo contract có thật, minimal routes,
đọc list/detail/stats, loading/error/empty/not-found/access-denied, tài liệu và tests.
Task 2 tiếp tục list gallery, search/filter/sort toolbar và metadata workflow theo
kế hoạch frontend; dùng types/query/mutations đã có, không mở rộng scope ở task 1.
Các task 3–7 còn hierarchy editing/reorder, atomic question/answer editor, media UI,
validation/lifecycle controls và preview theo kế hoạch được giao riêng. Không có
endpoint admin CRUD/reorder/lifecycle/upload nào bị thiếu; hạn chế cần phối hợp backend
là role trong authenticated user model nêu đầu tài liệu.

## Xác minh

Lệnh focused: `node --test tests/admin-jlpt-exams.test.mjs`, ESLint các file mới và
upload module, TypeScript noEmit với incremental=false (không sửa tsbuildinfo).
Application: `pnpm lint`, `pnpm build`.
Browser smoke: `node tests/admin-jlpt-exams.browser.mjs` với
`ADMIN_JLPT_TEST_ORIGIN` trỏ Next server local. Test dùng Chrome/CDP theo setup repo,
mock backend ở trình duyệt để kiểm tra access/list/detail/error/mobile/desktop;
không upload hoặc ghi dữ liệu thật. Playwright MCP không có trong session này.
Đã chạy: 7/7 test behavioral pass, focused ESLint pass, TypeScript noEmit pass và
`pnpm build` pass; 15/15 regression test category/course hiện có pass.
Chrome/CDP smoke pass: auth initialization/anonymous/401/403,
list/stats filter isolation, sửa page vượt giới hạn, detail/archive/empty/not-found,
retry 5xx và mobile 390px/desktop 1440px; đã xem ảnh chụp hai kích thước.
`pnpm lint` toàn app còn lỗi có sẵn `components/common/card/CardItem.tsx:42`
(`isPublished != null`, eqeqeq) cùng 6 warning ở file ngoài phạm vi. Không sửa ngoài task.
Không coi mock là live integration.

Backend local port 8080 đã phản hồi 401 đúng envelope cho GET list/stats/detail khi
không đăng nhập. Chưa có credential ADMIN được cung cấp để xác minh live authenticated
list/detail/403; không tự tạo tài khoản hoặc thay dữ liệu backend để kiểm tra.
