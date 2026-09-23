# Backend Agent Instructions

File này áp dụng cho toàn bộ backend/. Đọc cùng AGENTS.md ở repository root. Nếu có xung đột, file gần code đang sửa hơn được ưu tiên.

## 1. Phạm vi và stack

- Java 17.
- Spring Boot 4.1.0.
- Gradle Kotlin DSL và Gradle Wrapper.
- Spring Web, Security, OAuth2 Resource Server, Data JPA, Validation và MySQL.
- Lombok, Checkstyle và SpotBugs.
- External integrations hiện có gồm Cloudinary và Brevo.

Không sửa fontend/, UI/ hoặc ai-service/ trong một backend-only task. Với thay đổi API ảnh hưởng frontend, phải xác minh contract và báo rõ phần frontend cần đồng bộ.

## 2. Đọc trước khi sửa

Trước khi triển khai:

1. Đọc controller, service interface, service implementation, repository, entity, DTO, mapper và specification liên quan.
2. Đọc SecurityConfiguration, SecurityJwtConfiguration và WebConfiguration nếu task liên quan auth, authorization, CORS hoặc route.
3. Đọc GlobalException, RestResponse, ErrorResponse và exception hiện có trước khi thêm error handling.
4. Đọc database_schema.md ở root khi thay đổi entity hoặc relationship; runtime entity/repository vẫn là nguồn sự thật.
5. Tìm module tương tự đã hoạt động để giữ cùng convention.
6. Đọc test liên quan trước khi thay đổi hành vi.

Không suy đoán API chỉ từ tên method. Phải kiểm tra path, method, DTO, validation, status và response thực tế.

## 3. Kiến trúc bắt buộc

Giữ flow:

controller -> service interface -> service implementation -> repository -> entity

Vai trò:

- controller/: HTTP mapping, Valid boundary, status và response.
- service/: business contract.
- service/impl/: business rule, transaction và orchestration.
- repository/: data access.
- domain/: JPA entity.
- domain/request/: input DTO.
- domain/response/: output DTO.
- domain/query/: pagination, filter và sort input.
- service/mapper/: mapping entity/DTO.
- Specification/: dynamic JPA filtering; giữ nguyên cách viết hoa tên thư mục hiện tại.
- provider/: external integration.
- util/error/: domain exception và centralized error handling.
- util/: utility dùng chung như SecurityUtil và SlugUtil.

Không gọi repository trực tiếp từ controller. Không đặt business logic trong controller, mapper hoặc entity. Không trả entity trực tiếp nếu API có response DTO.

## 4. Controller và API contract

- WebConfiguration tự thêm /api/v1 cho RestController; không lặp prefix trong RequestMapping.
- Dùng request DTO với Bean Validation và Valid tại controller boundary.
- Giữ controller mỏng: nhận input, ủy quyền cho service, trả response.
- Dùng RestResponse, ApiMessage và error mechanism hiện có thay vì tạo response format khác.
- Không dùng catch Exception trong controller để che lỗi.
- Chọn status code đúng semantics.
- Khi đổi contract, kiểm tra method, path, query params, request body, response shape, validation và error response.
- Không phá vỡ contract đang được frontend dùng nếu người dùng không yêu cầu.

## 5. Service và transaction

- Create/update/delete phải có Transactional ở service layer.
- Query dùng Transactional readOnly khi phù hợp.
- Một business operation phải hoàn thành atomically; không để trạng thái media hoặc relation nửa vời.
- Validate sự tồn tại và trạng thái soft-delete của entity liên quan trước khi gắn relationship.
- Dùng exception hiện có: BadRequestException, NotFoundException hoặc ForbiddenException theo đúng nguyên nhân.
- Không trả null để biểu diễn business error.
- Không gọi external provider trong unit test; mock provider.
- Không thêm service abstraction mới nếu service hiện có đã đúng trách nhiệm.

## 6. Entity, JPA và database

- Relationship mặc định LAZY trừ khi có lý do được chứng minh.
- Tôn trọng isDeleted/deletedAt và query record chưa bị xóa.
- Delete mặc định là soft delete nếu domain đang theo pattern đó.
- Dùng Instant cho timestamp theo convention hiện tại.
- Dùng lifecycle callback hoặc pattern timestamp hiện có; không tạo cách thứ hai.
- Dùng SlugUtil và đảm bảo slug unique theo pattern của module.
- So sánh boxed ID bằng Objects.equals hoặc equals, không dùng !=.
- Tránh CascadeType.ALL và orphanRemoval nếu chưa phân tích ownership.
- Không sửa nullability, column type, foreign key hoặc deletion behavior mà không đánh giá migration/backward compatibility.
- Không dùng ddl-auto update làm migration plan cho thay đổi phá vỡ dữ liệu.

## 7. Query, pagination và hiệu năng

- List endpoint dùng query DTO, Page/Pageable và specification theo pattern hiện có.
- Whitelist sort field nhận từ client.
- Filter phải bỏ qua giá trị null/blank đúng cách.
- Không load toàn bộ bảng để filter hoặc paginate trong memory.
- Tránh N+1 khi mapper truy cập relation/count.
- Ưu tiên repository query, projection, entity graph, fetch join hoặc batch phù hợp với use case.
- Không đổi EAGER toàn cục chỉ để sửa một N+1 cục bộ.
- Course count, lesson count hoặc derived data nên được tính hiệu quả ở query layer khi danh sách lớn.

## 8. Media và external integrations

- Upload đi qua UploadService/provider hiện có.
- Validate multipart file, MIME type, size và empty content.
- Không tin filename hoặc content type từ client như bằng chứng duy nhất.
- Khi thay media, cập nhật Media.isUsed nhất quán và xử lý media cũ an toàn.
- Không trả Cloudinary credential hoặc provider metadata nhạy cảm.
- Brevo/Cloudinary config phải lấy từ environment hoặc local ignored config.
- Không gọi production/paid service khi test.

## 9. Authentication và security

Khi sửa login/register/OTP/password/profile:

1. Trace toàn bộ flow từ controller -> service -> repository -> security config -> response.
2. Kiểm tra password hashing; không lưu hoặc log plain password.
3. Kiểm tra duplicate email/username và race/error case.
4. Kiểm tra token issuer, subject, claim, expiration, validation và role/authority mapping.
5. Không đặt secret cứng trong source hoặc application.properties.
6. Không nới permitAll, CORS hoặc authorization chỉ để request chạy.
7. Backend là nguồn quyết định authorization; không tin role gửi từ frontend.
8. Error auth không được làm lộ password, token, OTP hoặc thông tin nội bộ.
9. OTP phải có expiration, giới hạn sử dụng và không được dùng lại nếu flow hiện tại hỗ trợ.
10. Thay đổi token/cookie strategy phải hỏi người dùng trước.

## 10. Mapping và naming

- Mapper chỉ map dữ liệu; business validation ở service.
- Response DTO chỉ chứa dữ liệu API cần.
- Request create và update được tách khi validation/semantics khác nhau.
- Giữ naming hiện tại trừ khi task yêu cầu refactor.
- Không đổi CourseQuerry hoặc package Specification chỉ như cleanup ngoài phạm vi.
- Không thêm MapStruct hoặc mapping framework mới nếu chưa được chấp thuận.
- Xóa unused import, debug log và commented-out implementation.

## 11. Testing và lệnh

Chạy từ backend/ bằng Gradle Wrapper:

- Unix: ./gradlew test
- Windows: gradlew.bat test
- Static checks: ./gradlew check
- Build: ./gradlew build
- Development: ./gradlew bootRun

Thứ tự kiểm tra:

1. Focused test cho service/controller/repository đã đổi.
2. ./gradlew test.
3. ./gradlew check hoặc ./gradlew build với thay đổi rộng.

Behavior change hoặc bug fix phải có regression test khi test infrastructure cho phép. Auth/security change phải có success, invalid input, unauthorized/forbidden và expiration/error case phù hợp.

Không tắt test, Checkstyle hoặc SpotBugs để lấy kết quả xanh. Nếu MySQL hoặc environment thiếu, báo rõ check nào không chạy được.

## 12. Backend Definition of Done

- Đúng layered architecture.
- API contract rõ và đồng bộ.
- Validation và exception đúng.
- Transaction và soft delete nhất quán.
- Không expose entity, credential hoặc dữ liệu nhạy cảm.
- Không có N+1 rõ ràng.
- Test phù hợp được thêm/cập nhật.
- Gradle checks phù hợp đã chạy và được báo cáo trung thực.
