# AGENTS.md

## 1. Mục tiêu

File này là nguồn hướng dẫn chính cho AI coding agents trong repository saas-japanese.

Mục tiêu khi làm việc:

1. Hiểu code hiện có trước khi sửa.
2. Tạo thay đổi nhỏ nhất nhưng hoàn chỉnh.
3. Giữ đúng kiến trúc và convention của từng application.
4. Không làm hỏng API contract, dữ liệu, bảo mật hoặc phần việc đang có.
5. Kiểm tra thay đổi bằng lệnh phù hợp trước khi kết luận.

Nếu yêu cầu của người dùng xung đột với file này, ưu tiên yêu cầu trực tiếp của người dùng nhưng phải nêu rõ rủi ro.

## 2. Phạm vi bắt buộc

### Được làm mặc định

- backend/: Spring Boot application.
- fontend/: Next.js application. Tên thư mục fontend là tên hiện tại, không tự ý đổi.
- UI/: nguồn giao diện chuẩn để triển khai và chia component cho fontend/. Khi có file HTML tương ứng, phải đọc và bám theo file đó.
- database_schema.md: tài liệu tham khảo database.
- fe_design_guidline.md: quy chuẩn thiết kế frontend.

### Không được đụng tới mặc định

Bỏ qua hoàn toàn ai-service/ trừ khi người dùng yêu cầu rõ ràng.

Không đọc, sửa, format, test, build hoặc review:

- ai-service/
- ai-service/onsei
- .gitmodules liên quan đến submodule trên

Không đưa lỗi từ ai-service vào kết quả kiểm tra của backend hoặc frontend.

### Instruction theo thư mục

Khi làm trong fontend/, phải đọc thêm fontend/AGENTS.md. Rule gần file đang sửa hơn được ưu tiên nếu có xung đột. Không xóa hoặc sửa block Next.js tự sinh trong file đó.

## 3. Thứ tự làm việc bắt buộc

1. Đọc AGENTS.md áp dụng cho file mục tiêu.
2. Xác định phạm vi backend, frontend hoặc cross-stack.
3. Đọc implementation liên quan, file lân cận, type/DTO, test và config cần thiết.
4. Nếu task làm giao diện frontend, tìm và đọc file HTML tương ứng trong UI/ trước khi chia layout hoặc component.
5. Tìm pattern tương tự đã tồn tại để tái sử dụng.
6. Nêu assumption nếu yêu cầu chưa rõ nhưng vẫn có thể triển khai an toàn.
7. Sửa đúng phạm vi; không cleanup hoặc refactor ngoài yêu cầu.
8. Chạy kiểm tra hẹp trước, sau đó chạy kiểm tra cấp application nếu phù hợp.
9. Review diff để tìm secret, generated file, debug code và thay đổi ngoài phạm vi.
10. Báo cáo file đã đổi, kiểm tra đã chạy và phần chưa thể xác minh.

Không được tuyên bố test/build đã pass nếu chưa thực sự chạy.

## 4. Nguyên tắc thay đổi

### Bắt buộc

- Giữ nguyên code không liên quan và thay đổi đang có của người dùng.
- Ưu tiên convention trong code hiện tại hơn việc tạo pattern mới.
- Hoàn thành toàn bộ luồng của feature được yêu cầu, không để placeholder hoặc TODO vô nghĩa.
- Đồng bộ request/response contract giữa backend và frontend khi thay đổi cross-stack.
- Xử lý loading, empty, error và success state cho UI có gọi API.
- Viết tên biến, hàm, class và file bằng tiếng Anh, rõ nghĩa.

### Không tự ý

- Đổi tên thư mục top-level.
- Refactor diện rộng.
- Nâng major version hoặc đổi package manager.
- Thêm framework, state manager, mapper library hoặc dependency lớn.
- Thay đổi authentication/token strategy.
- Thay đổi public API ngoài feature đang làm.
- Thay đổi schema có khả năng mất dữ liệu.
- Sửa CI/CD, deployment hoặc submodule.

Nếu một việc trong danh sách trên là cần thiết, dừng và hỏi người dùng trước.

## 5. Bảo mật và cấu hình

- Không commit password, token, API key, private key, cookie hoặc credential thật.
- Không ghi secret vào log, test fixture, ví dụ, commit message hoặc response.
- Configuration mới phải dùng environment variable hoặc local config đã được ignore.
- Không vô hiệu hóa authentication, authorization, validation, CORS, CSRF hoặc giới hạn upload để làm feature chạy.
- Không coi permitAll tạm thời là thiết kế authorization cuối cùng.
- Với auth, phải kiểm tra đầy đủ: login/register contract, password hashing, token validation, expiration, refresh/logout nếu có, role/permission, storage và error response.
- Frontend không được tự giải mã token để coi là bằng chứng authorization; backend là nguồn quyết định quyền truy cập.

## 6. Backend — backend/

### Stack và lệnh

- Java 17.
- Spring Boot 4.1.0.
- Gradle Kotlin DSL và Gradle Wrapper.
- Spring Web, Security, Data JPA, Validation, MySQL.
- Lombok, Checkstyle và SpotBugs.

Chạy từ backend/:

- Unix: ./gradlew test, ./gradlew check, ./gradlew build
- Windows: gradlew.bat test, gradlew.bat check, gradlew.bat build
- Development: ./gradlew bootRun hoặc gradlew.bat bootRun

Không tắt test, Checkstyle hoặc SpotBugs chỉ để build xanh.

### Kiến trúc

Giữ flow hiện có:

controller -> service interface -> service implementation -> repository -> entity

Vai trò package:

- controller: HTTP mapping, validation boundary, status/response.
- domain/request: input DTO.
- domain/response: output DTO.
- domain/query: pagination, filter và sort input.
- service: business contract.
- service/impl: business rule và transaction.
- service/mapper: mapping entity/DTO.
- repository: data access.
- specification: dynamic JPA filtering.
- provider: external integration.
- util/error: exception và error handling dùng chung.

Controller phải mỏng. Không đặt business logic hoặc repository call trực tiếp trong controller. Không trả JPA entity khi feature đã dùng response DTO.

### API và service rules

- WebConfiguration thêm prefix /api/v1 cho RestController; không lặp prefix trong RequestMapping.
- Request DTO phải dùng Bean Validation phù hợp và controller dùng Valid.
- Dùng exception/error response hiện có; không thêm try/catch tùy tiện trong controller.
- Write operation dùng Transactional. Query dùng Transactional readOnly khi phù hợp.
- Dùng Page, query DTO và specification cho list/filter/pagination theo pattern hiện tại.
- Sort field từ client phải qua allowlist.
- Tôn trọng soft delete và chỉ query record chưa bị xóa.
- Không biến soft delete thành hard delete nếu không được yêu cầu.
- Relationship mặc định LAZY; chỉ fetch thêm dữ liệu thật sự cần cho response.
- Tránh N+1 bằng query, projection, fetch strategy hoặc batch phù hợp.
- Khi gắn/thay/xóa media, giữ Media.isUsed nhất quán.
- Dùng Instant cho timestamp theo convention hiện có.
- Slug phải dùng utility/pattern hiện có và vẫn đảm bảo unique.
- So sánh boxed ID bằng Objects.equals hoặc equals, không dùng !=.
- External service như Cloudinary/Brevo phải nằm sau provider/service và được mock trong test.

### Backend Definition of Done

- Compile được với Java 17.
- Test business rule được thêm/cập nhật khi có thay đổi hành vi.
- Validation và error cases được xử lý.
- Không expose entity hoặc secret.
- Không tạo N+1 rõ ràng.
- ./gradlew test hoặc kiểm tra phù hợp đã chạy; nếu không chạy được phải nêu lý do.

## 7. Frontend — fontend/

### Stack và lệnh

- Next.js 16 App Router.
- React 19, TypeScript strict.
- Tailwind CSS 4, shadcn/base-ui.
- TanStack Query, Axios.
- React Hook Form và Zod.

Chạy từ fontend/:

- pnpm dev
- pnpm lint
- pnpm build

Repository có thể chứa nhiều lockfile. Mặc định dùng pnpm và chỉ sửa pnpm-lock.yaml. Không regenerate lockfile nếu không thay dependency.

### Trách nhiệm thư mục

- app/: route, layout, loading/error boundary và page composition.
- features/: component và orchestration riêng của domain.
- components/ui/: UI primitive tái sử dụng.
- components/common hoặc components/: component dùng chung nhiều feature.
- components/provider/: application provider.
- apis/: endpoint function và API request/response type.
- hooks/: hook generic dùng chung.
- services/: configured client và cross-feature service.
- types/: type thực sự dùng chung toàn app.
- utils/ và lib/: utility thuần, constant và infrastructure helper.

Page phải mỏng: compose feature, không chứa raw Axios call hoặc toàn bộ CRUD logic.

### UI-first workflow và chia component

UI/ là nguồn thiết kế đầu vào cho fontend/, không phải production code và không được copy nguyên file HTML vào Next.js.

Khi tạo hoặc sửa một trang có thiết kế trong UI/:

1. Tìm file HTML khớp nhất theo domain và vai trò trang. Ví dụ trang quản lý course category phải ưu tiên UI/admin/admin_category.html.
2. Đọc toàn bộ cấu trúc trang liên quan: layout, section, toolbar, filter, table, action, dialog/form, trạng thái và responsive behavior.
3. Đối chiếu fe_design_guidline.md để lấy màu sắc, typography, spacing và visual convention.
4. Đối chiếu component/hook hiện có trong fontend/ trước khi tạo component mới.
5. Lập component map rồi mới code. Phân tách theo trách nhiệm và khả năng tái sử dụng, không theo từng div nhỏ.
6. Chuyển HTML tĩnh thành component React/Next.js có type rõ ràng và dữ liệu thật từ API.
7. Giữ thiết kế gần file HTML nhưng phải thích nghi với kiến trúc, accessibility, responsive và state thực tế của ứng dụng.

Quy tắc phân loại component:

- app/: chỉ compose page, đọc route/search params và đặt boundary cần thiết.
- features/<domain>/: section, table, action, dialog/form và logic UI riêng domain.
- components/common/: component dùng lại được ở nhiều domain như toolbar, pagination, stat card hoặc upload input.
- components/ui/: primitive tổng quát theo shadcn/base-ui, không chứa business rule.
- hooks/: logic generic thật sự dùng được cho nhiều domain.
- apis/: API call và contract; không đặt API call trực tiếp trong component trình bày.

Ưu tiên componentization cấp senior:

- Mỗi component có một trách nhiệm rõ.
- Tách data/orchestration khỏi presentational UI khi việc đó làm code dễ test và tái sử dụng hơn.
- Dùng composition và typed props thay vì copy/paste markup.
- Không over-engineer component chỉ được dùng một lần nếu việc tách không tăng độ rõ ràng.
- Không tạo abstraction generic khi mới chỉ có một use case hoặc các domain có contract khác nhau.
- Component dùng chung không được phụ thuộc vào type hoặc API của một domain cụ thể.
- Dialog create/update có thể dùng chung khi schema và hành vi đủ giống nhau; mode và initial data phải được type an toàn.
- Table phải tách column/action/state hợp lý, nhưng không chia mỗi cell thành component nếu không có logic hoặc reuse.
- Không hy sinh giao diện gốc trong UI/ chỉ để ép dùng component cũ; mở rộng component cũ nếu thay đổi vẫn giữ contract rõ ràng.

Nếu không có file HTML tương ứng trong UI/, dùng component và design convention gần nhất trong fontend/ cùng fe_design_guidline.md. Không tự tạo một visual language khác.

### Data, API và state

- Dùng Axios instance đã cấu hình; không tạo client trùng lặp.
- Dùng NEXT_PUBLIC_API_URL và API_VERSION theo convention hiện có.
- TanStack Query quản lý server state.
- Không thêm Redux để lưu lại cùng server state.
- Query key phải ổn định, gồm filter/page/sort ảnh hưởng tới response.
- Mutation success phải invalidate hoặc update đúng query liên quan.
- TanStack mutation nhận một variables object. Update nên có dạng { id, data }.
- Type endpoint-specific đặt cạnh API module; chỉ đưa type dùng rộng rãi vào types/.
- Không dùng any hoặc cast để che lỗi contract.
- Tránh useEffect khi có thể dùng derived state, event handler hoặc TanStack Query.
- Search/filter/page trên trang danh sách nên đồng bộ URL khi pattern hiện tại đã làm như vậy.

### Form, upload và UI

- Form không đơn giản dùng React Hook Form + Zod.
- Hiển thị validation message rõ ràng cho người dùng.
- Upload phải kiểm tra MIME type và size trước khi gọi API.
- Preview bằng object URL phải được revoke khi thay hoặc unmount.
- Có trạng thái uploading, error và khả năng retry/remove phù hợp.
- Ưu tiên reuse component/hook hiện có trước khi tạo mới.
- Domain component nằm trong feature; component generic không được chứa business rule riêng domain.
- Dùng Server Component mặc định; chỉ thêm use client khi thực sự cần state, effect, handler, browser API hoặc client library.
- Khi UI/ có file HTML tương ứng, phải bám giao diện đó; không chờ người dùng nhắc lại. Dùng fe_design_guidline.md để chuẩn hóa chi tiết thiết kế.
- Giữ accessibility: label, semantic element, keyboard, focus, alt và ARIA phù hợp.
- Kiểm tra responsive ít nhất ở mobile và desktop.
- Không sửa .next/, next-env.d.ts, tsconfig.tsbuildinfo hoặc generated output.
- Xóa console.log, debugger, unused import và commented-out code trước khi hoàn thành.

### Frontend Definition of Done

- Type không dùng any để né lỗi.
- Loading, empty, error và success state đầy đủ.
- Form validation và API error hiển thị hợp lý.
- Query invalidation/cache behavior đúng.
- Không duplicate API client, hook hoặc component đã có.
- Trang khớp file HTML tương ứng trong UI/ về hierarchy, section chính và hành vi; mọi khác biệt có chủ đích phải được báo cáo.
- Component được chia đúng phạm vi domain/shared, không copy/paste và không over-engineer.
- pnpm lint và pnpm build đã chạy khi phù hợp; nếu không chạy được phải nêu lý do.

## 8. Database và cross-stack

- Runtime JPA entities/repositories là nguồn sự thật; database_schema.md là tài liệu đối chiếu.
- Trước khi đổi column, relation, nullability hoặc delete behavior, phải đánh giá migration và backward compatibility.
- Không dùng ddl-auto update như một migration plan cho thay đổi phá vỡ dữ liệu.
- Khi đổi API, kiểm tra đồng thời method, path, request body, query params, response shape, validation, status code và frontend type.
- Với CRUD, kiểm tra create, list/filter/pagination, detail, update, delete, permission, loading/error và cache invalidation.
- Với authentication, kiểm tra flow từ Security config/controller/service tới Axios client, form, token/cookie storage và protected route.

## 9. Quy tắc kiểm thử theo loại task

### Backend-only

Ưu tiên:

1. Focused unit/integration test.
2. ./gradlew test.
3. ./gradlew check hoặc ./gradlew build khi phạm vi đủ lớn.

### Frontend-only

Ưu tiên:

1. ESLint trên file/phạm vi thay đổi nếu khả dụng.
2. pnpm lint.
3. pnpm build.
4. Manual check cho responsive và interaction nếu không có UI test runner.

### Cross-stack

Ngoài check từng app, xác minh:

- request URL và method;
- request/query type;
- response type;
- validation và error mapping;
- auth/permission;
- loading/empty/error/success UI;
- query invalidation sau mutation.

Không gọi production service hoặc dịch vụ trả phí trong test.

## 10. Output khi hoàn thành

Kết quả cuối phải ngắn gọn và gồm:

- Đã thay đổi gì.
- File chính đã sửa.
- Test/lint/build đã chạy và kết quả.
- Phần nào chưa kiểm tra được cùng lý do.
- Rủi ro hoặc bước tiếp theo chỉ khi thật sự cần.

Không liệt kê file đã đọc nhưng không sửa. Không mô tả task hoàn tất nếu implementation còn thiếu.
