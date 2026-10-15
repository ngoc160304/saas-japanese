# Admin JLPT Exam Management — bàn giao frontend tasks 1–4

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
- Boundary vẫn kiểm tra GET stats không filter, được backend bảo vệ bằng ROLE_ADMIN.
  Task 2 sửa việc serialize list/detail sau stats: sau auth initialization, các GET
  được phép chạy song song, mỗi endpoint tự yêu cầu ADMIN. Stats loading/network/5xx
  không chặn catalog hoặc unmount editor; list phải thành công mới bật Add Exam.
  Stats/list/detail 401/403 ưu tiên hơn dữ liệu cache; 401 dùng refresh/redirect hiện có,
  403 hiển thị từ chối truy cập. Không cấp quyền từ JWT hoặc role giả trên frontend.
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
Task 2 có toolbar chỉnh search/level/status/size, debounce search 350ms; mọi thay đổi
filter/size reset page. Browser history native tích hợp Next giữ refresh/back/forward
và hash. URL malformed được replace bằng canonical URL. Reset xóa search/level/status,
đưa page/size về default, giữ sort và query params không thuộc feature.

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
| app/admin/exams/layout.tsx | AdminJlptAccessBoundary | Chờ session, ưu tiên 401/403 từ endpoints admin; reads chạy song song |
| app/admin/exams/page.tsx | Suspense → AdminJlptExamListPage | Thin route; list/statistics orchestration và metadata dialog |
| app/admin/exams/[id]/page.tsx | parseAdminJlptExamId → AdminJlptExamDetailPage | Await params theo Next.js cài local, validate ID, notFound |
| app/admin/exams/loading/error/not-found.tsx | AdminJlptState | Route loading, recovery (Next 16.3 retry), invalid ID state |
| features/admin-jlpt-exams/components | List/Detail/Status/AccessBoundary/State | Orchestration, error/access/empty states; detail là builder task 3 |
| features/admin-jlpt-exams/components | ExamFilters/ExamGrid/ExamStats | Toolbar, responsive cards, thống kê có loading/error/retry độc lập |
| features/admin-jlpt-exams/components | MetadataDialog | Create/edit RHF + Zod, fresh detail, pending/dirty-close, field errors, conflict |
| features/admin-jlpt-exams/hooks | useAdminJlptExamsUrlState | URL state, debounce, canonicalization, filter/reset/page |
| features/admin-jlpt-exams/admin-jlpt-metadata.ts | schema/payload/lock helper | Bounds backend, writable payload và lý do read-only cho metadata |
| features/admin-jlpt-exams/components | StructureTree/SafeText | Cây session → part → question, thu/mở theo ID, các action có accessible label, nội dung có định dạng an toàn |
| features/admin-jlpt-exams/components | StructureDialog/StructureDeleteDialog | Form session/part, fresh detail, dirty confirmation, cascade confirmation, giữ input khi lỗi |
| features/admin-jlpt-exams/hooks | useAdminJlptStructure | Kiểm tra lock/ownership, serialize mutation, batch reorder và phục hồi authoritative state |
| features/admin-jlpt-exams/admin-jlpt-structure.ts | schema/payload/order/lock | Contract session/part, UI position → API order, complete sibling lists |
| app/admin/exams/[id]/sessions/[sessionId]/parts/[partId]/questions/new/page.tsx | AdminJlptQuestionEditorPage | Tạo câu hỏi, validate cả ba ancestor IDs |
| app/admin/exams/[id]/sessions/[sessionId]/parts/[partId]/questions/[questionId]/page.tsx | AdminJlptQuestionEditorPage | Sửa/xem câu hỏi, validate bốn IDs và membership từ detail |
| features/admin-jlpt-exams/components | QuestionEditorPage/QuestionFields/QuestionAnswers | Snapshot form, settings/prompt/context/explanation, dynamic answer array, save/next/recovery |
| features/admin-jlpt-exams/admin-jlpt-question.ts | schema/payload/context/navigation | Single-choice, existing/new IDs, ảnh, vị trí, next sibling và nested field errors |
| features/admin-jlpt-exams/hooks | useAdminJlptQuestionSave/useAdminJlptQuestionExit | Atomic mutation guard, lock/ownership, dirty link/exit confirmation và beforeunload |
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
Task 2 hoàn thiện card gallery theo HTML (1 cột mobile, 2 tablet, 3 desktop), bốn
statistics thật, server search/level/status/size/page và form create/edit metadata.
Card dùng summary; không fetch detail mỗi card. Chỉ khi mở Edit mới GET detail với
freshOnMount để kiểm tra metadata/quyền mới nhất. Form chỉ có title (nonblank <=200),
level N1–N5 và description (<=500); create mặc định N3 và backend tạo DRAFT.
Để tránh chặn nhập tiếng Nhật, không transform dữ liệu đang gõ; trim khi validate/save.
Form có field/server errors, giữ input sau failure, chống submit lặp, không đóng khi
pending, xác nhận dirty qua AlertDialog, thông báo success qua Sonner. Snapshot mới
đổi quyền save nhưng không reset dirty fields. 409 refresh authority/lock và giữ input;
401/403/404 chặn save; archived/published/attempted không có ngoại lệ field-level PUT.
Create/update dùng hook task 1 và invalidate list/stats/detail/validation đúng phạm vi;
giữ filters URL. Nếu edit làm record không còn khớp filter, record rời gallery sau refetch.

Contract gap: Summary/Detail chưa có maximum score; card chỉ hiện passingScore từ API,
không thêm `/180` hoặc tự tính maximum. Không dùng sample exams/mock statistics trong UI.
Default status cố ý ghi “Đang hoạt động (nháp và xuất bản)” vì API không gồm archive.
Không đưa status dropdown vào metadata hoặc editable duration/passingScore từ HTML.
Không có nút publish/unpublish/archive/preview giả ở task 2.

Task 3 đã hoàn thiện hierarchy editing/reorder (chi tiết bên dưới).
Các task 4–7 còn atomic question/answer editor, media UI,
validation/lifecycle controls và preview theo kế hoạch được giao riêng. Không có
endpoint admin CRUD/reorder/lifecycle/upload nào bị thiếu; hạn chế cần phối hợp backend
là role trong authenticated user model nêu đầu tài liệu.

## Builder task 3 và bàn giao task 4

Route giữ nguyên `/admin/exams/[id]`; page Server Component await/validate params như
task 1, không thêm raw API logic vào app/. Builder dùng chung admin shell, breadcrumb
về `/admin/exams`, overview title/level/status/description và năm metrics từ detail:
sessionCount/partCount/questionCount/totalTimeMinutes/passingScore. Nút Sửa thông tin
đề mở chính MetadataDialog task 2 khi contract cho phép.

Cây dùng một detail query, không GET riêng từng row. Session/part thu/mở bằng button
có aria-expanded/aria-controls; trạng thái theo resource ID giữ qua mutation/refetch.
Có mở/thu tất cả và empty state ở từng cấp. Question row hiển thị thứ tự, ID, excerpt,
số answers, points, ảnh đã gắn và answers đúng từ admin response. `SafeText` dựng React
nodes theo allowlist, bỏ attributes/URLs/script/style; giữ xuống dòng, chữ Nhật, ruby,
in đậm/nghiêng/gạch chân và định dạng cơ bản, không dùng dangerouslySetInnerHTML.

Session form: name <=150 nonblank, sessionType bắt buộc (ba enum lowercase),
timeLimitMinutes integer 1–180 và vị trí. Part form: name <=150 nonblank,
instructions <=10000, vị trí. Không có session description, part type hoặc part
default points trong DTO. Position trên UI bắt đầu 1, helper payload chuyển sang
sortOrder zero based. Create chèn 0..N; edit di chuyển 0..N-1; form giới hạn theo
sibling set mới nhất. Không hardcode giới hạn số sessions/parts từ HTML.

Form mở sẽ refetch detail lấy initial values mới nhất; background snapshot cập nhật
quyền/parent membership nhưng không reset dirty input. RHF/Zod map fieldErrors
(sortOrder → position), lỗi chung và focus lỗi; guard đồng bộ chống double submit,
pending chặn đóng, dirty close cần xác nhận. Nếu refresh sau lỗi mạng thất bại, có nút
`Tải lại trạng thái, giữ biểu mẫu` ngay trong dialog. Loading dialog không restore
focus đè lên form khi chuyển sang ready; đóng form trả focus về action mở nó.

PUT part **gửi lại audioMediaId từ part hiện tại trong detail cache**, kể cả khi chỉ
sửa name/instructions/order. Backend coi omitted hoặc null là detach, không có PATCH
metadata-only. Task 3 chỉ hiển thị originalName/ID của audio, không thêm URL input,
upload hoặc remove media. Với part mới không có media, payload gửi explicit null.
Backend không có version token; concurrent edits từ tab khác vẫn do server quyết định.

Deletion local đã đối chiếu service + cascade entity:

| Mục | Hiệu ứng DELETE thành công |
| --- | --- |
| Session | Xóa vĩnh viễn session, parts, questions, answers; recalculate total duration |
| Part | Xóa vĩnh viễn part, questions, answers |
| Question | Xóa vĩnh viễn question và answers |

Các delete đóng gap sortOrder ở sibling collection. Audio của part và image của
question bị tháo liên kết; backend khóa media và tính lại isUsed theo references còn
tồn tại, **không xóa tệp media**. Dialog nêu tên/ID, excerpt và số child/answers từ
detail hiện tại, giữ mở khi reject. Đây khác DELETE exam (archive mềm), không mô tả
delete cấu trúc là lưu trữ. Sau xóa focus về heading Cấu trúc đề thi.

Move-up/down gọi đúng ba batch endpoints đã có, mỗi lần gửi toàn bộ current sibling
IDs đúng một lần. Không dùng legacy sort-order hoặc cross-parent moves. Thứ tự chỉ
đổi sau server response + detail refetch, giữ focus button được di chuyển và boundary
aria-disabled vẫn focusable. Hook dùng gate đồng bộ cho cả exam để không chồng save,
delete và reorder trong builder; buttons và handlers đều kiểm tra quyền/pending.
Metadata dialog là modal và action bị khóa trong structural mutation.

Success dùng mutation hooks task 1, await invalidate list/stats/detail/validation,
không splice response con vào cây. Lỗi 400/404/409 được hooks cũ reconcile; lỗi auth,
network/5xx và local guard rejection cũng yêu cầu refresh. Không retry writes tự động.
401/403 ưu tiên access state; published/attempted/archived chỉ xem. Background detail
5xx giữ cây cũ với cảnh báo và chặn sửa, cho retry; không trình bày cây cũ là dữ liệu
vừa tải thành công. Chỉ toast success sau khi write đã được server chấp nhận.

Khác HTML có chủ đích: dùng app shell; thêm sessionType bắt buộc; duration min1;
bỏ unsupported fields, audio URL, status dropdown, max-score giả định và Save Structure.
Không có nút thêm/sửa câu hỏi vì chưa có editor route làm việc. Không thêm preview,
publish/unpublish/archive hoặc publish validation panel ở task 3.

Task 4 tái sử dụng detail/cache admin và SafeText, lock guard, cấu trúc nesting hiện
có. Mỗi question cần đủ `{examId, sessionId, partId, questionId}`; create cần đủ ba
ancestor IDs. Builder hiện có `data-session-id`, `data-part-id`, `data-question-id`
và stable React keys. Chưa ấn định/thêm URL editor mới; task 4 phải tạo route hoạt động
rồi mới gắn action vào part/question. Atomic save dùng complete answers set và union
new/existing answer IDs của task 1; không biến thành nhiều write lẻ. Answer reorder
và question create/edit chưa triển khai.

## Task 4 — Question Editor

### Routes và nguồn dữ liệu

- Create: `/admin/exams/[id]/sessions/[sessionId]/parts/[partId]/questions/new`.
- Edit/read-only: cùng prefix, thay `new` bằng `[questionId]`.
- Routes await params, reuse parser positive safe integer; malformed ID dùng boundary
  not-found hiện có. Chờ auth và fresh detail thành công rồi mới dựng form. Không
  dựng edit như create trong khi loading. Xác minh exam → session → part → question
  từ cây detail; ID đúng kiểu nhưng sai ownership hiển thị not-found riêng.
- Builder có Add Question theo part và Edit/View theo question. Khi structural write
  đang pending, không chuyển sang editor để bắt đầu mutation khác. Back/breadcrumbs
  trả `/admin/exams/{id}#part-{partId}`; builder mở đúng session/part theo hash.
- Một detail query cung cấp ngữ cảnh, question/answers và locks; không GET riêng mỗi
  answer/question hay tạo cache chứa đáp án đúng trong namespace student.

### Atomic contract đã kiểm tra lại từ implementation

- POST `P/questions/with-answers` trả QuestionResponse + answers, 201.
  PUT `Q/with-answers` trả cùng shape, 200; success envelope được unwrap bởi API task 1.
- Payload chỉ gồm `questionText`, `passageText`, `questionType: single_choice`,
  `explanation`, `points`, `sortOrder`, `imageMediaId`, complete `answers[]`.
- Question text <=20.000; passage <=50.000; explanation <=20.000 ký tự. Answer text
  nonblank <=500. Question/answer sau sanitize vẫn phải có text hiển thị. Points
  0,01–999,99, tối đa hai số lẻ; question position chuyển UI 1-based sang API 0-based
  tại payload helper, nằm trong sibling bounds hiện tại.
- Tối thiểu hai options, đúng một correct; backend không giới hạn số option tối đa.
  `answers[].id` chỉ gửi cho answer cũ thuộc đúng question; new answer bỏ hẳn ID;
  retained IDs phải unique. Answer cũ không còn trong complete array bị xóa.
  `sortOrder` mỗi answer bằng array index 0..N-1; không gọi batch reorder hay các
  write answer lẻ khi đang soạn. Một lần save tương ứng một atomic HTTP write.
- RHF `field.id` chỉ là client key; backend ID nằm trong `answerId`. Đổi thứ tự dùng
  useFieldArray.move; correctness là thuộc tính option nên theo đúng option. Xóa
  option đúng không tự chọn option khác. Form mặc định có hai option, chưa chọn đúng.
- PUT omission/null imageMediaId tháo ảnh: payload lấy association từ question trong
  cache detail mới nhất, gửi rõ ID hoặc null. Hiện tên/ID/ảnh đã có; không có upload,
  replacement/removal hoặc input URL. Media summary không expose raw ID khi media
  không còn tìm được, giữ hạn chế contract này cho task 5.
- Backend `GrammarHtmlSanitizer` dùng Jsoup relaxed allowlist bỏ img, thêm hr/s/code,
  lọc link protocols và chuẩn hóa HTML. Editor giữ textarea source như HTML reference,
  gửi nguyên text/HTML Unicode, nhận lại bản sanitize làm baseline. Không ép sang
  plain text hoặc tự render raw HTML. `<br>/<p>/<pre>` dùng khi cần line breaks được
  giữ theo formatting contract; whitespace/markup có thể được máy chủ chuẩn hóa.
  TinyMCE grammar hiện có gắn domain grammar và thiếu read-only contract phù hợp nên
  không tái cấu trúc nó trong task này. SafeText từ builder tiếp tục render an toàn.
- Bean Validation errors có index `answers[1].answerText/isCorrect/id/sortOrder`:
  map đúng option hoặc form; `sortOrder` question → input position. Khác với publish
  validation paths (resource IDs). Business 400 có thể chỉ có message. 409 published/
  attempts/media conflict, archived write 404; refresh state và giữ input.

### Save, navigation và recovery

- Synchronous submission gate + pending fieldset chặn double save và add/remove/
  reorder lúc đang gửi. Trước write kiểm tra cache success/idle, locks, ownership,
  position bounds và answer membership. Server vẫn quyết định cuối cùng.
- Reuse mutation hooks task 1, retry=false: invalidate admin detail/validation và mọi
  list/stats; lỗi 400/404/409 cũng reconcile. Auth/network/5xx yêu cầu refresh thêm.
  Không optimistic tree/answer changes, không thêm Redux/server-state copy.
- Chỉ báo saved sau atomic response; reset form từ response có server IDs/sanitize.
  Create + Save dùng replace sang URL edit; local saved ID/pending chặn POST lần hai
  trong lúc chuyển route. Background detail refetch không reset dirty snapshot.
- Save & Next edit: dùng authoritative tree đã refetch bởi mutation invalidation
  (không GET trùng lần hai), sort order ASC rồi ID ASC,
  mở sibling kế trong cùng part; hết sibling mở create. Create + Save & Next reset
  form mới cùng part, append position, không mang IDs/correctness/explanation cũ.
  Save fail không advance. Write thành công nhưng refetch fail: vẫn báo đã lưu,
  khóa form với action tải thứ tự và tiếp tục, không bắt save lại.
- Create network/5xx không rõ kết quả: giữ input và chặn gửi lại tự động. Action
  kiểm tra detail liệt kê IDs mới so với trước request, mở tab mới để tự đối chiếu.
  Không suy ra persisted bằng so text hoặc tự nhận một ID. Chỉ sau fresh read và
  xác nhận rõ rủi ro trùng mới mở khóa nút Save; việc mở khóa chưa gửi request.
  Backend chưa có idempotency key/version token; request cũ có thể vẫn hoàn tất.
- Dirty editor: confirmation bằng AlertDialog cho Back/breadcrumb và same-tab links
  (kể cả sidebar); beforeunload cho tab close/reload. Không patch history/router,
  không cam kết chặn SPA browser Back/Forward, programmatic auth/logout hoặc session
  expiration. Các trường hợp mất quyền ưu tiên access boundary và không persist dữ
  liệu câu hỏi vào localStorage. Tab mới không làm mất form hiện tại.
- Published/attempted/archived vẫn xem được question, mọi save/option mutation bị
  chặn ở controls và handlers; 401/403 ưu tiên trạng thái từ chối truy cập.

### Khác UI reference và bàn giao task 5

- Giữ context/header → settings → prompt/context → answers → explanation, dùng app
  shell hiện có; Save & Next vẫn hiện trên mobile. Context luôn mở để dễ xem nội
  dung/validation; không giữ giới hạn mock 200 câu hoặc đúng bốn đáp án.
- Bỏ question status, audio question, editable media URLs và preview. Exam status
  chỉ đọc. Points/position/string bounds dùng DTO, không dùng mẫu HTML 0,5–10.
- Task 5 tái sử dụng question target đủ bốn IDs (create ba IDs), current image summary,
  question payload helper và atomic save baseline. Audio thuộc part; upload module/
  validators task 1 đã có. Cần thiết kế rõ staged upload vs attach và explicit remove,
  tránh null/omitted làm mất association khi lưu unrelated fields.
- Chưa làm lifecycle/publish-validation UI, preview (task 6), hoặc media controls.

## Xác minh task 4

- `node --test tests/admin-jlpt-exams.test.mjs`: **16/16 pass**; thêm single-choice,
  score/text/order bounds, không giới hạn option giả, identity/complete answer payload,
  image preservation, ownership, next order và nested field paths.
- Focused ESLint feature/routes/tests và TypeScript noEmit incremental=false: **pass**.
- `pnpm build`: **pass**, hai route editor dynamic. `pnpm lint`: **fail** vì eqeqeq
  có sẵn ở `components/common/card/CardItem.tsx:42`, cùng 6 warnings ngoài phạm vi.
- Playwright script `tests/admin-jlpt-question.playwright.mjs` chạy callback với page,
  origin và optional artifact directory. API/media đều intercept, exam 701 synthetic;
  không sửa nội dung backend thật. **Pass**, 12 atomic requests; không page exception.
  Gồm builder links, create→edit replace và PUT tiếp theo, double submit, correctness/
  focus qua reorder/removal, retained/new/deleted IDs, image ID, nested 400, 500 +
  failed detail và retry giữ input, reconnect refetch giữ dirty form, Save & Next
  failed/success/last/create reset, write success + failed reconciliation (GET-only
  retry), không GET detail trùng khi create + next, ambiguous create sau commit không
  tự retry, dirty cancel/discard, beforeunload,
  published/attempted/archived, invalid/mismatched IDs, 403/anonymous, 1440px/390px.
- Đã xem ảnh editor desktop/mobile, không horizontal overflow, options và dialog dễ
  đọc, controls wrap. Giữ nguyên hạn chế sidebar mobile của app shell. Đã xem console/
  network: các 400/409/500/401 là error paths chủ động, không có exception từ editor;
  shell còn prefetch `/admin/users` 404 và cảnh báo CSS preload khi qua builder.
- Chạy lại Playwright builder task 3: **pass**, 16 structural requests mock, không
  page exception; thêm regression collapse sau khi nhận hash context từ editor vẫn
  được giữ qua structural refetch. Chrome/CDP `node tests/admin-jlpt-exams.browser.mjs`: **pass**.
- Backend local 8080 và dev server 3000 vẫn chạy. Route editor thật trên origin 3000 chưa đăng nhập
  chuyển về `/login?next=%2Fadmin%2Fexams%2F1%2Fsessions%2F1%2Fparts%2F1%2Fquestions%2Fnew`.
  **Blocked live authenticated CRUD**: chưa có credential/session ADMIN được cung
  cấp. Không tự tạo account hoặc sửa đề thi thật. Browser persistence ở trên là mock,
  không phải xác nhận backend integration. Không thiếu endpoint cho phạm vi task 4.
- Origin test production 3001 gọi backend thật bị chặn ở CSRF bởi CORS; đã kiểm tra
  redirect thật bằng dev origin 3000 được phép. Không sửa CORS/auth để phục vụ test.

## Xác minh task 3

- `node --test tests/admin-jlpt-exams.test.mjs`: **13/13 pass**, gồm thêm schema/bounds
  session/part, chuyển position sang sortOrder, giữ audioMediaId, full sibling lists,
  reorder boundaries và lock theo status/attempts kể cả flag không nhất quán.
- Focused ESLint trên feature và ba scripts liên quan: **pass**; TypeScript
  `pnpm exec tsc --noEmit --incremental false`: **pass**.
- `pnpm build`: **pass**, route `/admin/exams/[id]` vẫn dynamic. `pnpm lint`: **fail**
  bởi lỗi eqeqeq có sẵn `components/common/card/CardItem.tsx:42` và 6 warnings ngoài
  phạm vi. Không sửa file đó hoặc thêm dependency để làm xanh kiểm tra.
- `tests/admin-jlpt-builder.playwright.mjs` chạy bằng Playwright MCP trên production
  build localhost:3001: **pass**, 16 intercepted write requests, không page exception.
  Kiểm tra session/part create/edit; metadata form reuse; audio ID; zero-based order
  và full sibling sets ở ba cấp; persistence sau reload; cascade confirmations/delete;
  count/duration refresh; double submit; validation 400 giữ input; reorder reject;
  409 đổi lock giữ input/chặn save; 500 + detail refetch failure và retry trong form;
  readonly published/attempted/archived; 403/anonymous; Japanese markup/script safety;
  collapse state qua refetch; focus move, initial focus, Escape và mobile/desktop.
  Đã xem console/network: các API 400/409/500/403/401 là test error paths chủ động;
  shell còn prefetch `/admin/users` trả 404 và cảnh báo CSS preload của Next. Không có
  exception từ builder, không sửa route/sidebar ngoài phạm vi để che các log này.
- Chrome/CDP regression `node tests/admin-jlpt-exams.browser.mjs`: **pass**. Cập nhật
  assertion cũ cho builder DRAFT được chỉnh sửa, archived vẫn khóa. Bao gồm bootstrap,
  401/403, invalid ID/404/empty, list/statistics/URL/retry và responsive.
- Đã xem screenshots builder + dialog ở 1440px/390px; không horizontal overflow,
  tên Nhật dài xuống dòng và controls/dialog có thể sử dụng. Xác minh focus quay về
  nút mở dialog sau Escape. Sidebar mobile dùng nguyên shell hiện tại.
- Backend local 8080 đang chạy. Route thật `/admin/exams/1` khi chưa có phiên ADMIN
  chuyển đúng `/login?next=%2Fadmin%2Fexams%2F1`. **Live authenticated CRUD bị chặn**
  vì chưa có credential/session ADMIN được cung cấp. Mọi write ở browser test đều
  intercept, không sửa đề thi thật; không coi mock persistence là live integration.
- Không sửa backend/UI/auth/dependencies. Hạn chế contract còn lại: user model chưa
  có role, không có maximum score hoặc version token; không thiếu endpoint task 3.

## Xác minh task 2

- `node --test tests/admin-jlpt-exams.test.mjs`: 10/10 pass, gồm URL roundtrip/reset/
  bounds, stats query independence, payload whitelist/schema và các trạng thái lock.
- Focused ESLint trên feature/tests pass; TypeScript noEmit incremental=false pass.
- `pnpm build`: pass. `pnpm lint`: còn lỗi eqeqeq có sẵn CardItem.tsx:42 cùng 6 warning
  ngoài phạm vi, không chỉnh sửa để làm xanh lint.
- Playwright MCP có trong session task 2. Đã chạy browser kiểm tra create/edit success,
  cache/gallery cập nhật, duplicate submit, validation 400 giữ input, dirty confirmation,
  409 giữ input và khóa save, debounce/reset race, URL/back/forward/reload/page correction,
  stats loading/error độc lập, stale cards khi filter fail, archived read-only,
  403/anonymous, focus/Escape và mobile/desktop không overflow. API được intercept bằng
  dữ liệu test; không coi đây là authenticated live integration.
- Reusable Playwright script: `tests/admin-jlpt-metadata.playwright.mjs` export callback
  nhận `(page, origin)`. Runner Playwright có thể import trực tiếp. Với Playwright MCP
  không hỗ trợ dynamic import, đọc file và bỏ `export default ` rồi truyền source vào
  `browser_run_code_unsafe` (default origin localhost:3001). Không thêm dependency.
- Script Playwright đã chạy pass trên production build tại localhost:3001; không có
  page exception. Console/network 400/409/500/403/401 được chủ động tạo ở test error paths.
  Đã xem ảnh desktop 1440px/mobile 390px; đo các mẫu title/input/textarea/submit dialog
  có contrast >4.5:1. Không có horizontal overflow sau responsive layout settle.
- Smoke Chrome/CDP task 1 được cập nhật cho empty state và stats failure độc lập,
  đã chạy lại pass cùng 10 unit/contract tests.
- Backend 8080 vẫn chạy; browser thật không có phiên ADMIN và chuyển về login đúng
  `next` URL. Không có credential test được cung cấp, nên create/edit/search live với
  tài khoản ADMIN chưa xác minh; không tự tạo tài khoản hoặc thay dữ liệu backend.

## Xác minh task 1 (lịch sử)

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
