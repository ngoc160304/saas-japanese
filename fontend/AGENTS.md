<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Frontend Agent Instructions

Phần dưới áp dụng cho toàn bộ fontend/. Đọc cùng AGENTS.md ở repository root. Không xóa hoặc chỉnh sửa block Next.js tự sinh phía trên.

## 1. Phạm vi và stack

- Next.js 16.3.2 App Router.
- React 19.2.8 và TypeScript strict.
- Tailwind CSS 4, shadcn/base-ui.
- TanStack Query và Axios.
- React Hook Form và Zod.
- pnpm là package manager mặc định.

Tên thư mục fontend là tên hiện tại của dự án; không tự ý đổi thành frontend.

Không sửa backend/, UI/ hoặc ai-service/ trong frontend-only task. Được đọc UI/ và backend API contract cần thiết để triển khai chính xác.

## 2. Nguồn sự thật trước khi code

Ưu tiên theo thứ tự:

1. Yêu cầu trực tiếp của người dùng.
2. File HTML tương ứng trong ../UI/ cho hierarchy, section và giao diện.
3. ../fe_design_guidline.md cho token, typography, spacing và visual convention.
4. Component, hook, API module và pattern đang tồn tại trong fontend/.
5. Backend controller/request/response DTO cho API contract.
6. Tài liệu Next.js trong node_modules/next/dist/docs/ cho API Next.js 16.

Không suy đoán contract từ mock HTML. UI/ định nghĩa giao diện; backend định nghĩa dữ liệu/API; fontend/ hiện tại định nghĩa code convention.

## 3. UI-first workflow bắt buộc

Khi tạo hoặc sửa trang:

1. Tìm file HTML phù hợp nhất trong ../UI/.
2. Đọc toàn bộ page structure, không chỉ đoạn nhìn thấy: header, stats, toolbar, filter, table/list, actions, form/dialog, empty/loading/error và responsive behavior.
3. Đối chiếu ../fe_design_guidline.md.
4. Inventory component/hook hiện có để tránh duplicate.
5. Viết component map trước khi triển khai.
6. Chuyển HTML tĩnh thành component typed, semantic và có dữ liệu thật.
7. So sánh kết quả với HTML gốc ở mobile và desktop.

Ví dụ: trang admin course category phải ưu tiên ../UI/admin/admin_category.html.

Không copy nguyên HTML hoặc JavaScript inline sang Next.js. Không bỏ mất section quan trọng chỉ để giảm số component. Nếu chủ động khác thiết kế gốc vì API, accessibility hoặc responsive, phải báo rõ.

Nếu UI/ không có file tương ứng, dùng trang gần nhất, component hiện có và design guideline. Không tự tạo visual language mới.

## 4. Kiến trúc thư mục

- app/: route, layout, loading/error boundary và page composition.
- features/<domain>/: UI, orchestration, schema và logic riêng domain.
- components/ui/: primitive tổng quát theo shadcn/base-ui.
- components/common/: component dùng lại nhiều domain.
- components/layout/: application layout.
- components/providers/: global providers.
- apis/<domain>/: endpoint functions và API request/response types.
- hooks/: hook generic dùng chung nhiều domain.
- lib/: configured client và infrastructure helpers.
- services/: cross-feature services/integrations.
- types/: type thực sự dùng chung.
- utils/: pure utility và constants.

Page phải mỏng. Không đặt raw Axios call, toàn bộ form, table hoặc CRUD orchestration trong page.tsx.

Giữ convention thư mục đang có như features/category-course/component trừ khi task yêu cầu chuẩn hóa; không đổi hàng loạt component thành components chỉ để cleanup.

## 5. Quy tắc chia component cấp senior

- Mỗi component có một trách nhiệm rõ.
- Tách orchestration/container khỏi presentational component khi giúp code dễ hiểu, test và tái sử dụng.
- Dùng composition và typed props thay vì copy/paste.
- Component dùng chung không phụ thuộc API hoặc type riêng của một domain.
- Domain component nằm trong features/<domain>/.
- Primitive không chứa business rule.
- Không tách mỗi div/cell thành component nếu không có logic, reuse hoặc boundary có ý nghĩa.
- Không tạo generic abstraction chỉ từ một use case.
- Khi use case thứ hai xuất hiện, chỉ generic hóa phần contract thực sự giống nhau.
- Dialog create/update có thể dùng chung nếu schema và behavior tương thích; mode, initialData và submit payload phải type-safe.
- Table nên tách toolbar, pagination, actions và complex columns hợp lý.
- Ưu tiên mở rộng component common hiện có nếu contract vẫn rõ; không ép component cũ nếu làm API props rối.

Trước khi tạo component mới, tìm trong components/common, components/ui, components/layout và feature gần nhất.

## 6. Server và Client Components

- Server Component là mặc định.
- Chỉ thêm use client khi cần state, effect, event handler, browser API hoặc client-only library.
- Đặt client boundary nhỏ nhất hợp lý.
- Không biến cả page/layout thành Client Component chỉ vì một phần tử tương tác.
- Không dùng useEffect để đồng bộ derived state nếu có thể tính trực tiếp.
- Không fetch cùng dữ liệu ở nhiều client component.
- Với API hiện tại cần client auth hoặc TanStack Query, đặt query/orchestration ở feature boundary phù hợp.

## 7. API, TanStack Query và type

- Dùng configured Axios instance trong lib/; không tạo client trùng.
- Base URL lấy từ NEXT_PUBLIC_API_URL và API_VERSION theo convention hiện có.
- API call chỉ nằm trong apis/ hoặc service integration phù hợp.
- Type request/response riêng endpoint đặt cùng API module.
- Chỉ đưa type sang types/ khi nhiều domain thật sự dùng chung.
- TanStack Query quản lý server state.
- Không dùng Redux để duplicate query cache. Nếu task yêu cầu Redux, chỉ dùng cho shared client state có ownership rõ.
- Query key phải ổn định và chứa page, filter, search, sort ảnh hưởng response.
- Mutation success phải invalidate/update đúng query liên quan.
- Mutation nhận một variables object; update dùng shape như { id, data }.
- Không dùng any, double cast hoặc optional chain để che contract sai.
- Normalize response ở API layer nếu backend wrapper khác shape UI cần.
- Không gọi API trong presentational component.

## 8. Authentication và Axios interceptor

Nếu task liên quan login/register/auth:

- Trace backend contract trước khi code.
- Tách auth API, auth type, auth state và form UI.
- Không lưu password, OTP hoặc sensitive form data trong persistent Redux state.
- Không log token hoặc credential.
- Một Axios client chịu trách nhiệm attach credential và normalize error.
- Interceptor phải tránh refresh loop và duplicate retry.
- Không redirect trực tiếp từ low-level interceptor nếu tạo coupling; dùng strategy hiện có hoặc auth boundary rõ ràng.
- Backend vẫn là nguồn quyết định authorization.
- Protected UI không thay thế backend authorization.
- Hiển thị auth error thân thiện nhưng không làm lộ internal message.
- Token/cookie storage phải theo backend strategy; không tự đổi localStorage sang cookie hoặc ngược lại nếu chưa được yêu cầu.

## 9. Form, validation và notification

- Form không đơn giản dùng React Hook Form + Zod.
- Schema nằm trong feature và là nguồn validation phía client.
- API vẫn là nguồn validation cuối cùng.
- Mapping field error và form-level error rõ ràng.
- Disable submit hoặc thể hiện pending state để tránh double submit.
- Reset form đúng lúc sau success; không làm mất input khi request fail.
- Notification dùng component/toast shadcn hiện có hoặc pattern thống nhất; không dùng alert().
- Message phải ngắn, rõ và không hiển thị raw stack/internal error.

## 10. CRUD, table và URL state

CRUD page phải xử lý:

- list;
- search/filter/sort;
- pagination;
- create;
- detail nếu thiết kế có;
- update;
- delete/confirm;
- loading;
- empty;
- error;
- success notification;
- cache invalidation.

Tái sử dụng hooks/crud khi contract phù hợp. Không ép generic hook cho mutation có semantics khác.

Search/filter/page nên đồng bộ query string để refresh, back/forward và share URL hoạt động. Reset filter phải đưa page về giá trị hợp lệ. Không tạo request race bằng effect thủ công nếu TanStack Query xử lý được.

## 11. Upload và media

- Validate file tồn tại, MIME type và size trước request.
- Có preview, uploading, error, retry/remove state.
- Revoke object URL khi thay file hoặc unmount.
- Không đặt upload side effect trong pure utility.
- Logic stateful nên nằm trong custom hook; pure validator/constant nằm trong utils/.
- Form chỉ gửi media ID/contract backend yêu cầu, không đoán response.
- Không expose Cloudinary credential trong client.

## 12. Styling, responsive và accessibility

- Bám UI HTML tương ứng và ../fe_design_guidline.md.
- Ưu tiên Tailwind utility và component variants hiện có.
- Không tạo màu, shadow, radius hoặc spacing ngẫu nhiên khi đã có convention.
- Giữ layout hoạt động ở mobile và desktop.
- Dùng semantic HTML, label, alt, keyboard interaction, visible focus và ARIA phù hợp.
- Icon-only button phải có accessible name.
- Dialog phải quản lý focus và đóng bằng bàn phím theo primitive.
- Table rộng cần responsive strategy, không chỉ overflow vô điều kiện nếu mobile design có layout khác.

## 13. Package và generated files

- Mặc định dùng pnpm.
- Chỉ sửa pnpm-lock.yaml khi dependency thay đổi.
- Không sửa đồng thời package-lock.json và pnpm-lock.yaml.
- Không thêm/nâng major dependency nếu chưa được chấp thuận.
- Không sửa .next/, next-env.d.ts hoặc tsconfig.tsbuildinfo.
- Không chỉnh block Next.js tự sinh đầu file này.
- Xóa console.log, debugger, unused import và commented-out code.

## 14. Testing và lệnh

Chạy từ fontend/:

- pnpm lint
- pnpm build
- pnpm dev để manual check khi cần

Thứ tự:

1. Lint file/phạm vi thay đổi nếu khả dụng.
2. pnpm lint.
3. pnpm build.
4. Manual check interaction và responsive nếu không có UI test runner.

Không tuyên bố pass nếu chưa chạy. Nếu build phụ thuộc backend/env/network không có, báo rõ nguyên nhân và phần vẫn xác minh được.

## 15. Frontend Definition of Done

- Bám file HTML trong UI/ về hierarchy, section chính và behavior.
- Component map hợp lý, không duplicate và không over-engineer.
- Page mỏng; API và business orchestration đúng layer.
- Type-safe, không dùng any để né lỗi.
- Loading, empty, error và success state đầy đủ.
- Form validation, notification và API error hợp lý.
- Query key/cache invalidation đúng.
- Responsive và accessibility được kiểm tra.
- pnpm lint/build phù hợp đã chạy và được báo cáo trung thực.
