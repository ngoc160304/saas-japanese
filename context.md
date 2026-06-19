Dưới đây là bản phân tích chi tiết từ file SQL của hệ thống học tiếng Nhật và luyện thi JLPT (study_jlpt). Bản phân tích này bao gồm Danh sách màn hình, Sitemap, User Flow và Wireframe (phác thảo giao diện dạng văn bản) nhằm mô tả toàn diện hệ thống mà không chứa code lập trình.

BẢN PHÂN TÍCH THIẾT KẾ HỆ THỐNG (UI/UX SPECIFICATION)
I. DANH SÁCH MÀN HÌNH (SCREEN LIST)
Dựa trên cấu trúc cơ sở dữ liệu bao gồm các phân hệ: Người dùng, Khóa học & Bài học (E-learning), Thi thử JLPT (Testing), Thẻ ghi nhớ (Flashcard), Cửa hàng tài liệu (E-commerce), và Tiến độ & Gamification.

A. Phân hệ Học viên (Student Site)
Mã màn hình	Tên màn hình	Chức năng chính	Bảng dữ liệu liên quan
SCR_STU_001	Trang chủ khách (Landing Page)	Giới thiệu nền tảng, danh sách các cấp độ JLPT (N5-N1), tài liệu & khóa học tiêu biểu.	jlpt_levels, courses, documents
SCR_STU_002	Đăng nhập (Login)	Đăng nhập tài khoản bằng email & mật khẩu.	users
SCR_STU_003	Đăng ký (Register)	Đăng ký tài khoản học viên mới, chọn cấp độ JLPT hiện tại.	users, jlpt_levels
SCR_STU_004	Quên mật khẩu (Forgot Password)	Nhập email để hệ thống gửi liên kết khôi phục mật khẩu.	password_reset_tokens
SCR_STU_005	Đặt lại mật khẩu (Reset Password)	Nhập mật khẩu mới từ liên kết xác thực gửi qua email.	password_reset_tokens, users
SCR_STU_006	Xác thực email (Email Verification)	Thông báo xác nhận tài khoản thông qua đường dẫn kích hoạt.	users
SCR_STU_007	Dashboard học tập (Learning Dashboard)	Trung tâm học tập cá nhân: hiển thị Streak học tập, biểu đồ thời gian học hằng ngày, các khóa học đang tham gia dở dang.	learning_streaks, learning_logs, user_course_enrollments
SCR_STU_008	Danh sách khóa học (Course Catalog)	Duyệt danh sách các khóa học phân loại theo cấp độ từ N5 đến N1.	courses, jlpt_levels
SCR_STU_009	Chi tiết khóa học (Course Detail)	Xem mô tả khóa học, lộ trình bài học, phần trăm tiến độ cá nhân và nút đăng ký tham gia khóa học.	courses, lessons, user_course_enrollments
SCR_STU_010	Giao diện học bài (Lesson View)	Học bài học cụ thể tích hợp 4 Tab: Nội dung bài học (video/bài viết), Ngữ pháp, Từ vựng, Chữ Kanji liên quan.	lessons, grammars, vocabularies, kanjis, user_lesson_progress
SCR_STU_011	Làm bài kiểm tra bài học (Lesson Quiz)	Làm bài kiểm tra ngắn cuối bài học để đánh giá mức độ tiếp thu.	quizzes, quiz_questions, quiz_answers, user_quiz_attempts
SCR_STU_012	Kết quả bài kiểm tra (Quiz Result)	Hiển thị điểm số đạt được (%), trạng thái Đạt/Không đạt, thời gian làm và lời giải thích.	user_quiz_attempts, user_quiz_attempt_answers
SCR_STU_013	Thư mục thẻ ghi nhớ (Flashcard Folders)	Quản lý danh sách thư mục flashcard tự tạo hoặc công khai của người khác.	flashcard_folders
SCR_STU_014	Bộ thẻ ghi nhớ (Flashcard Decks)	Quản lý các bộ flashcard (chủ đề từ vựng) trong một thư mục cụ thể.	flashcard_titles
SCR_STU_015	Học Flashcard (Flashcard Practice)	Giao diện lật thẻ (Mặt trước/Mặt sau) kèm câu ví dụ, hình ảnh minh họa để học từ vựng.	flashcard_contents, media
SCR_STU_016	Danh sách đề thi thử (Exam Catalog)	Tổng hợp các đề thi thử JLPT chính thức theo cấu trúc chuẩn.	jlpt_exams, jlpt_levels
SCR_STU_017	Chi tiết đề thi & Hướng dẫn (Exam Info)	Hiển thị tổng thời gian làm bài, cấu trúc các phần thi (Từ vựng-Ngữ pháp, Đọc hiểu, Nghe) và lưu ý trước khi thi.	jlpt_exams, jlpt_exam_sessions
SCR_STU_018	Giao diện phòng thi (Exam Room)	Giao diện làm đề thi thử có đồng hồ đếm ngược, phần đọc hiểu dài, âm thanh bài nghe, và bảng chọn câu hỏi.	jlpt_exam_sessions, jlpt_exam_parts, jlpt_exam_questions, jlpt_exam_answers, media
SCR_STU_019	Kết quả thi JLPT (Exam Result)	Xem điểm tổng, kết quả từng phần thi, số câu đúng/sai, trạng thái Đạt/Trượt và xem lại đáp án đúng kèm giải thích.	user_jlpt_attempts, user_jlpt_attempt_answers
SCR_STU_020	Thư viện tài liệu (Document Store)	Nơi duyệt mua sách giấy hoặc tài liệu học dạng số (Ebook, PDF) theo chủ đề hoặc Combo.	documents, document_categories, document_sets
SCR_STU_021	Chi tiết tài liệu (Document Detail)	Xem mô tả tài liệu, định dạng (số/vật lý), giá cả, lượng tồn kho, lượt tải, và đánh giá phản hồi từ học viên khác.	documents, document_reviews, document_favorites
SCR_STU_022	Giỏ hàng (Cart)	Quản lý danh sách tài liệu dự định mua, tăng giảm số lượng, xem tổng giá tiền tạm tính.	carts, cart_items
SCR_STU_023	Thanh toán đơn hàng (Checkout)	Chọn địa chỉ nhận hàng, phương thức thanh toán (Banking, Momo, VNPAY, COD), áp mã giảm giá và xác nhận thanh toán.	orders, order_items, shipping_addresses, payments
SCR_STU_024	Lịch sử đơn hàng (Order History)	Theo dõi các đơn hàng đã đặt, trạng thái giao hàng, mã vận đơn và tình trạng thanh toán đơn.	orders, shipments, payments
SCR_STU_025	Kho tài liệu cá nhân (My Library)	Chứa các tài liệu số (PDF/Ebook) học viên đã thanh toán thành công để tải về học.	order_items, documents
SCR_STU_026	Trang cá nhân & Cài đặt (Profile Settings)	Thay đổi ảnh đại diện, thông tin cá nhân, cập nhật cấp độ JLPT mục tiêu, quản lý danh sách địa chỉ nhận hàng.	users, shipping_addresses
B. Phân hệ Quản trị viên (Admin Portal)
Mã màn hình	Tên màn hình	Chức năng chính	Bảng dữ liệu liên quan
SCR_ADM_001	Dashboard quản trị (Admin Dashboard)	Tổng quan số liệu: doanh thu bán tài liệu, số học viên đăng ký mới, thống kê các đề thi được làm nhiều nhất.	Toàn bộ cơ sở dữ liệu
SCR_ADM_002	Quản lý khóa học (Course & Lesson Admin)	Thêm, sửa, xóa, sắp xếp thứ tự khóa học và các bài học trong khóa học.	courses, lessons
SCR_ADM_003	Quản lý nội dung học liệu (Lesson Content Admin)	Soạn thảo ngữ pháp (WYSIWYG), nạp dữ liệu từ vựng (kanji/kana, nghĩa tiếng Việt), nạp chữ Kanji (âm on, âm kun, số nét).	grammars, vocabularies, kanjis
SCR_ADM_004	Quản lý Quiz học tập (Quiz Admin)	Tạo đề quiz cho bài học, nhập ngân hàng câu hỏi trắc nghiệm/điền từ/nghe và cấu hình điểm đạt.	quizzes, quiz_questions, quiz_answers
SCR_ADM_005	Quản lý đề thi JLPT (JLPT Exam Admin)	Xây dựng đề thi thử chính thức: phân chia các phần Mondai, tải file âm thanh bài nghe, nhập các đoạn văn dài và cấu hình đáp án đúng.	jlpt_exams, jlpt_exam_sessions, jlpt_exam_parts, jlpt_exam_questions, jlpt_exam_answers
SCR_ADM_006	Quản lý tài liệu & kho hàng (Document & Catalog Admin)	Quản lý kho sách, giá tiền, số lượng tồn kho sách vật lý, cập nhật file PDF tài liệu số, tạo các bộ tài liệu (Combo).	documents, document_sets, document_categories
SCR_ADM_007	Quản lý đơn hàng & Giao vận (Order & Shipping Admin)	Xác nhận đơn hàng, duyệt thanh toán qua ngân hàng/ví điện tử, chỉ định đơn vị vận chuyển và cập nhật mã tracking giao hàng.	orders, payments, shipments
SCR_ADM_008	Quản lý người dùng (User Accounts Admin)	Danh sách thành viên, khóa/mở khóa tài khoản, phân quyền (admin/student), gia hạn hoặc kích hoạt tài khoản VIP.	users
SCR_ADM_009	Thư viện Media (Media Asset Manager)	Quản lý tệp tin tải lên tập trung (hình ảnh, âm thanh nghe, video bài giảng).	media
II. SITEMAP (SƠ ĐỒ TRANG)
text
[HỆ THỐNG STUDY JLPT]
 │
 ├── TRANG CHỦ KHÁCH (SCR_STU_001)
 │    ├── Đăng nhập (SCR_STU_002)
 │    ├── Đăng ký (SCR_STU_003)
 │    └── Quên mật khẩu / Đặt lại mật khẩu (SCR_STU_004, SCR_STU_005)
 │
 ├── PHÂN HỆ HỌC VIÊN (Student Portal - Đã đăng nhập)
 │    │
 │    ├── DASHBOARD HỌC TẬP (SCR_STU_007)
 │    │    ├── Tiến độ học & Streak hàng ngày
 │    │    └── Lịch sử học tập gần đây
 │    │
 │    ├── KHÓA HỌC & BÀI HỌC
 │    │    └── Danh sách khóa học N5-N1 (SCR_STU_008)
 │    │         └── Chi tiết khóa học (SCR_STU_009)
 │    │              └── Giao diện học bài (SCR_STU_010)
 │    │                   ├── Tab 1: Bài giảng (Video/Text)
 │    │                   ├── Tab 2: Ngữ pháp
 │    │                   ├── Tab 3: Từ vựng
 │    │                   ├── Tab 4: Chữ Kanji
 │    │                   └── Làm bài kiểm tra cuối bài (SCR_STU_011) -> Kết quả Quiz (SCR_STU_012)
 │    │
 │    ├── HỌC VỚI FLASHCARDS
 │    │    └── Thư mục Flashcard cá nhân (SCR_STU_013)
 │    │         └── Bộ Flashcard từ vựng (SCR_STU_014)
 │    │              └── Học thẻ lật (SCR_STU_015)
 │    │
 │    ├── LUYỆN THI THỬ JLPT
 │    │    └── Danh sách đề thi thử N5-N1 (SCR_STU_016)
 │    │         └── Chi tiết đề thi & Hướng dẫn (SCR_STU_017)
 │    │              └── Phòng thi trực tuyến (SCR_STU_018) -> Nộp bài -> Kết quả thi & Giải thích (SCR_STU_019)
 │    │
 │    ├── CỬA HÀNG TÀI LIỆU
 │    │    └── Danh mục tài liệu (SCR_STU_020)
 │    │         └── Chi tiết tài liệu / Combo sách (SCR_STU_021)
 │    │              ├── Thêm vào Giỏ hàng (SCR_STU_022)
 │    │              └── Thanh toán hóa đơn (SCR_STU_023) -> Lịch sử đơn hàng (SCR_STU_024)
 │    │              └── Kho tài liệu cá nhân đã mua (SCR_STU_025)
 │    │
 │    └── THÔNG TIN CÁ NHÂN & THIẾT LẬP (SCR_STU_026)
 │         ├── Cập nhật hồ sơ & Cấp độ JLPT mục tiêu
 │         └── Quản lý danh sách địa chỉ giao hàng
 │
 └── PHÂN HỆ QUẢN TRỊ VIÊN (Admin Portal - Yêu cầu quyền admin)
      │
      ├── DASHBOARD THỐNG KÊ (SCR_ADM_001)
      │
      ├── QUẢN LÝ ĐÀO TẠO & HỌC LIỆU
      │    ├── Khóa học & Bài học (SCR_ADM_002)
      │    ├── Ngữ pháp, Từ vựng, Kanji (SCR_ADM_003)
      │    └── Ngân hàng Quiz bài học (SCR_ADM_004)
      │
      ├── QUẢN LÝ ĐỀ THI JLPT (SCR_ADM_005)
      │    └── Soạn đề thi (Chia session, Mondai, câu hỏi nghe/đọc, đáp án)
      │
      ├── QUẢN LÝ CỬA HÀNG & KHO HÀNG (SCR_ADM_006)
      │    └── Đăng tài liệu mới, cấu hình kho sách vật lý, cập nhật file PDF tài liệu số.
      │
      ├── QUẢN LÝ ĐƠN HÀNG & GIAO VẬN (SCR_ADM_007)
      │    └── Kiểm tra trạng thái thanh toán, xác nhận đơn hàng và cập nhật vận đơn giao nhận.
      │
      ├── QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG (SCR_ADM_008)
      │    └── Khóa tài khoản spam, nâng cấp VIP cho người dùng đóng phí.
      │
      └── THƯ VIỆN MEDIA TẬP TRUNG (SCR_ADM_009)
III. USER FLOW (LUỒNG NGƯỜI DÙNG CHÍNH)
Luồng 1: Học tập bài học và kiểm tra đánh giá
text
[Bắt đầu] 
   │
   ▼
[Đăng nhập thành công]
   │
   ▼
[Dashboard Học tập] ──(Nhấp vào Khóa học)──> [Danh sách khóa học]
                                                  │
                                                  ▼
                                            [Chi tiết khóa học]
                                                  │
                                            (Nhấp Đăng ký học)
                                                  │
                                                  ▼
                                            [Giao diện học bài]
                                                  │
             ┌────────────────────────────────────┼────────────────────────────────────┐
             ▼                                    ▼                                    ▼
       (Xem video/Bài giảng)               (Học Ngữ pháp/Kanji)                (Luyện từ vựng)
             │                                    │                                    │
             └────────────────────────────────────┼────────────────────────────────────┘
                                                  │
                                                  ▼
                                        [Làm Quiz cuối bài học]
                                                  │
                                         (Trả lời câu hỏi)
                                                  │
                                                  ▼
                                            [Nộp bài Quiz]
                                                  │
                                                  ▼
                                         [Kết quả học tập]
                                                  │
               ┌──────────────────────────────────┴──────────────────────────────────┐
               ▼ (Đạt điểm pass_score)                                               ▼ (Chưa đạt)
      [Ghi nhận hoàn thành bài học]                                            [Khuyến khích làm lại]
   [Cập nhật tiến độ khóa học học viên]                                              │
   [Tích lũy Streak / Tạo learning_log]                                               │
               │                                                                      ▼
               ▼                                                            [Làm lại Quiz học tập]
            [Kết thúc]
Luồng 2: Luyện thi thử JLPT trực tuyến
text
[Bắt đầu]
   │
   ▼
[Danh sách đề thi thử JLPT] ──(Chọn đề thi)──> [Thông tin hướng dẫn & cấu trúc thi]
                                                    │
                                             (Nhấn Bắt đầu thi)
                                                    │
                                                    ▼
                                            [Phòng thi JLPT]
                                                    │
                                            (Chạy đếm ngược)
                                                    │
    ┌───────────────────────────────────────────────┼───────────────────────────────────────────────┐
    ▼ (Session 1: Kiến thức ngôn ngữ)               ▼ (Session 2: Đọc hiểu)                         ▼ (Session 3: Nghe hiểu)
[Làm trắc nghiệm từ vựng & ngữ pháp]          [Đọc đoạn văn & trả lời câu hỏi]               [Nghe audio & chọn đáp án đúng]
    │                                               │                                               │
    └───────────────────────────────────────────────┼───────────────────────────────────────────────┘
                                                    │
                                                    ▼
                                          [Nộp bài thi JLPT]
                                                    │
                                                    ▼
                                          [Kết quả thi chi tiết]
                                                    │
                                         - Tính tổng điểm thi
                                         - Đánh giá Đạt / Không đạt (Pass/Fail)
                                         - Hiện chi tiết câu trả lời đúng/sai kèm giải thích
                                                    │
                                                    ▼
                                          [Lưu lịch sử thi thử]
                                                    │
                                                    ▼
                                                 [Kết thúc]
Luồng 3: Mua tài liệu học tập (Sách giấy & Tài liệu điện tử PDF)
text
[Bắt đầu]
   │
   ▼
[Thư viện tài liệu] ──(Tìm kiếm/Lọc)──> [Xem chi tiết tài liệu/Combo sách]
                                             │
                                      (Thêm vào giỏ hàng)
                                             │
                                             ▼
                                     [Chi tiết Giỏ hàng]
                                             │
                                       (Nhấn Thanh toán)
                                             │
                                             ▼
                                    [Trang điền thông tin]
                               - Địa chỉ nhận hàng (Tài liệu vật lý)
                               - Chọn hình thức thanh toán (Banking/Ví/COD)
                               - Nhập mã giảm giá (nếu có)
                                             │
                                             ▼
                                     [Xác nhận đặt hàng]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼ (Nếu chọn Online: Banking/Ví)             ▼ (Nếu chọn COD)
                [Hiện cổng/mã QR thanh toán]                [Tạo đơn hàng chờ xác nhận]
                       │                                           │
                       ▼                                           ▼
             [Thanh toán thành công]                        [Admin xác nhận gọi điện]
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                                    [Xử lý đơn hàng]
                                             │
                   ┌─────────────────────────┴─────────────────────────┐
                   ▼ (Tài liệu số: Ebook/PDF)                          ▼ (Sách giấy vật lý)
         [Kích hoạt liên kết tải xuống]                        [Admin giao đơn vị vận chuyển]
         [Mở quyền truy cập Kho tài liệu]                     [Học viên theo dõi mã vận đơn]
                   │                                                   │
                   └─────────────────────────┬─────────────────────────┘
                                             │
                                             ▼
                                   [Học viên nhận tài liệu]
                                             │
                                             ▼
                                    [Đánh giá phản hồi]
                                             │
                                             ▼
                                         [Kết thúc]
IV. WIREFRAME (BỐ CỤC GIAO DIỆN TEXT-BASED)
1. SCR_STU_007: Dashboard Học Tập (Learning Dashboard)
text
+---------------------------------------------------------------------------------------------------+
|  [LOGO STUDY JLPT]   Trang chủ  Khóa học  Thi thử  Tài liệu  Flashcard          [Ảnh đại diện (VIP)]|
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  Chào mừng trở lại, Nguyễn Văn A!                                                                  |
|                                                                                                   |
|  +--------------------------------------------+  +---------------------------------------------+  |
|  |  TIẾN ĐỘ HỌC TẬP HÔM NAY                   |  |  THỐNG KÊ CHI TIẾT                          |  |
|  |  +--------------------------------------+  |  |                                             |  |
|  |  | Streak học tập hiện tại:  [ 7 Ngày ]  |  |  |  - Cấp độ hiện tại: N3                      |  |
|  |  | Kỷ lục streak dài nhất:  [ 21 Ngày ] |  |  |  - Tổng thời gian học tuần này: 350 phút    |  |
|  |  +--------------------------------------+  |  |  - Bài thi thử gần nhất: N3 Mock Exam #1    |  |
|  |  Thời gian học hôm nay: [|||||||||| ] 45m  |  |    (Kết quả: 125/180 - Đạt)                 |  |
|  |  (Mục tiêu hằng ngày: 60 phút)             |  |                                             |  |
|  +--------------------------------------------+  +---------------------------------------------+  |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | KHÓA HỌC ĐANG HỌC DỞ DANG                                                                    |  |
|  |                                                                                             |  |
|  | [Ảnh Thumbnail]  Khóa học: Tiếng Nhật trung cấp N3 giao tiếp                                  |  |
|  |                  Tiến độ: [====================..........] 65% hoàn thành                   |  |
|  |                  Bài học tiếp theo: Bài 12 - Cách sử dụng cấu trúc ngữ pháp "~わけがない"    |  |
|  |                                                                                             |  |
|  |                  [ Tiếp tục bài học ]      [ Xem chi tiết lộ trình khóa học ]               |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
|  +--------------------------------------------+  +---------------------------------------------+  |
|  | BỘ FLASHCARD CẦN ÔN TẬP HÔM NAY            |  | TÀI LIỆU KHUYÊN DÙNG CHO CẤP ĐỘ CỦA BẠN     |  |
|  |                                            |  |                                             |  |
|  | - Từ vựng Mimikara Oboeru N3 (Còn 15 từ)   |  | [Ảnh bìa] Sách Đột Phá Đọc Hiểu N3          |  |
|  | - Kanji Soumatome N3 (Còn 8 chữ)           |  |           Giá: 120.000đ  [ Mua ngay ]       |  |
|  |                                            |  |                                             |  |
|  | [ Ôn tập ngay ]                            |  | [Ảnh bìa] 100 Đề thi Kanji N3 có giải thích |  |
|  |                                            |  |           Giá: Miễn phí  [ Tải xuống ]      |  |
|  +--------------------------------------------+  +---------------------------------------------+  |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
|  © 2026 Study JLPT Platform. Hỗ trợ học viên chinh phục chứng chỉ tiếng Nhật.                     |
+---------------------------------------------------------------------------------------------------+
2. SCR_STU_010: Giao diện học bài (Lesson View - Tabbed Layout)
text
+---------------------------------------------------------------------------------------------------+
|  <-- Quay lại khóa học: Khóa N3 Soumatome   |   Bài học: Bài 5 - Chữ Kanji chỉ hành động ở cơ quan |
+---------------------------------------------------------------------------------------------------+
|  [ DANH SÁCH BÀI HỌC ]       |  [ KHU VỰC NỘI DUNG CHÍNH CỦA BÀI HỌC ]                            |
|                              |                                                                    |
|  - Bài 1: Kanji phương hướng |  +--------------------------------------------------------------+  |
|    [v] Hoàn thành            |  |  [ TAB 1: BÀI GIẢNG ] [ TAB 2: NGỮ PHÁP ] [ TAB 3: TỪ VỰNG ]   |  |
|                              |  |  [ TAB 4: CHỮ KANJI ] [ TAB 5: BÀI KIỂM TRA QUIZ ]           |  |
|  - Bài 2: Kanji đồ dùng gia  |  +--------------------------------------------------------------+  |
|    đình [v] Hoàn thành       |  |                                                              |  |
|                              |  |  * Bạn đang xem nội dung Tab 4: Chữ Kanji liên quan bài học  |  |
|  - Bài 3: Từ vựng văn phòng  |  |                                                              |  |
|    [v] Hoàn thành            |  |  1. Chữ: 働 (ĐỘNG)                                           |  |
|                              |  |     - Âm On: ドウ | Âm Kun: はたら.く                         |  |
|  - Bài 4: Ngữ pháp thời gian |  |     - Ý nghĩa: Làm việc, lao động                            |  |
|    [v] Hoàn thành            |  |     - Số nét vẽ: 13 nét                                      |  |
|                              |  |     - Ví dụ: 会社で働く (Làm việc tại công ty)                |  |
|  > Bài 5: Kanji cơ quan      |  |                                                              |  |
|    [ ] Đang học              |  |  2. Chữ: 議 (NGHỊ)                                           |  |
|                              |  |     - Âm On: ギ   | Âm Kun: (Không có)                       |  |
|  - Bài 6: Ngữ pháp phỏng đoán|  |     - Ý nghĩa: Hội nghị, thảo luận                           |  |
|    [ ] Chưa học              |  |     - Số nét vẽ: 20 nét                                      |  |
|                              |  |     - Ví dụ: 会議に出席する (Tham dự cuộc họp)                 |  |
|  - Bài 7: Quiz tổng hợp      |  |                                                              |  |
|    [ ] Chưa học              |  |  +--------------------------------------------------------+  |  |
|                              |  |  | [ Đánh dấu đã học xong mục Kanji này ]                  |  |  |
|                              |  |  +--------------------------------------------------------+  |  |
|                              |  +--------------------------------------------------------------+  |
|                              |  |   [ <-- Bài trước ]                          [ Bài sau --> ] |  |
|                              |  +--------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
3. SCR_STU_018: Giao diện phòng thi thử JLPT (Mock Exam Interface)
text
+---------------------------------------------------------------------------------------------------+
| ĐỀ THI: ĐỀ THI THỬ JLPT N3 - MÃ ĐỀ #102                 | Thời gian còn lại: [ 45 : 20 ]  [NỘP BÀI]|
+---------------------------------------------------------------------------------------------------+
| PHẦN THI HIỆN TẠI: ĐỌC HIỂU (READING SESSION)                                                     |
+---------------------------------------------------------------------------------------------------+
|  [ĐOẠN VĂN ĐỌC HIỂU]                    |  [CÂU HỎI VÀ ĐÁP ÁN]            | [BẢN ĐỒ CÂU HỎI]      |
|  Hãy đọc kỹ đoạn văn dưới đây và trả    |                                 |                       |
|  lời các câu hỏi liên quan:             |  Câu hỏi số 14:                 | Phần 1: Từ vựng       |
|                                         |  Theo nội dung đoạn văn, tại    | [01] [02] [03] [04]   |
|  「最近、パソコンやスマートフォンの     |  sao người trẻ lại thích đọc    | [05] [06] [07] [08]   |
|  使いすぎで, 目が疲れている人が増えて   |  sách điện tử hơn?              | [09] [10]             |
|  います。特に夜遅くまで画面を見ている   |                                 |                       |
|  と, 睡眠の質が悪くなる恐れがありま     |  ( ) A. Vì giá thành rẻ hơn.    | Phần 2: Ngữ pháp      |
|  す。したがって, 使用時間を決めて使う   |  (x) B. Vì có thể phóng to chữ  | [11] [12] [13]        |
|  ことが推奨されています...」            |         và mang đi dễ dàng.     |                       |
|                                         |  ( ) C. Vì có nhiều hình ảnh.   | Phần 3: Đọc hiểu      |
|                                         |  ( ) D. Vì được tặng kèm quà.   | [14*] [15] [16]       |
|                                         |                                 |                       |
|                                         |  +---------------------------+  | Phần 4: Nghe hiểu     |
|                                         |  |  [ Lưu câu trả lời ]      |  | [17] [18] [19] [20]   |
|                                         |  +---------------------------+  |                       |
|                                         |                                 | Ký hiệu:              |
|                                         |  [ Câu trước ]  [ Câu sau ]     | [xx] : Đã trả lời     |
|                                         |                                 | [xx*]: Đang chọn xem  |
|                                         |                                 | [ ]  : Chưa trả lời   |
+---------------------------------------------------------------------------------------------------+
4. SCR_STU_021: Giao diện Chi tiết tài liệu & Mua sắm (Document Store Detail)
text
+---------------------------------------------------------------------------------------------------+
|  [LOGO STUDY JLPT]   Trang chủ  Khóa học  Thi thử  Tài liệu  Flashcard          [ Giỏ hàng (2) ]  |
+---------------------------------------------------------------------------------------------------+
|  Đường dẫn: Thư viện tài liệu > Giáo trình N2 > Shinkanzen Masuta Ngữ pháp N2                      |
|                                                                                                   |
|  +-----------------------+   THÔNG TIN TÀI LIỆU CHỦ CHỐT                                          |
|  |                       |   Tên tài liệu: Shinkanzen Masuta Ngữ pháp N2 (Bản dịch Việt)           |
|  |                       |   Đánh giá: [*****] 4.8/5 (128 nhận xét) | Đã bán: 450 cuốn             |
|  |                       |   -------------------------------------------------------------------  |
|  |                       |   Giá bán:  145.000 đ    [ Giá gốc: 180.000 đ ] (-20%)                 |
|  |     [ẢNH BÌA SÁCH]    |   Loại tài liệu: Sách giấy vật lý (Bìa mềm)                            |
|  |                       |   Số lượng trong kho: Còn 45 cuốn trong kho                            |
|  |                       |   -------------------------------------------------------------------  |
|  |                       |   Số lượng mua: [ - ] [ 1 ] [ + ]                                      |
|  |                       |                                                                        |
|  +-----------------------+   [ Thêm vào giỏ hàng ]      [ MUA NGAY ]      [ Thêm vào yêu thích ]  |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | THÔNG TIN CHI TIẾT SÁCH                                                                     |  |
|  | - Tác giả: Nhóm tác giả 3A Network      - Nhà xuất bản: NXB Trẻ                               |  |
|  | - Số trang: 220 trang                   - Trọng lượng: 350g                                   |  |
|  | - Mô tả: Giáo trình cung cấp đầy đủ các cấu trúc ngữ pháp có thể xuất hiện trong kỳ thi N2.  |  |
|  |   Các bài học phân chia theo nhóm ý nghĩa tương đồng giúp học viên phân biệt dễ dàng.         |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | ĐÁNH GIÁ TỪ HỌC VIÊN (128)                                                                    |  |
|  |                                                                                             |  |
|  | [*****] Nguyễn Văn B: Sách đóng gói cẩn thận, nội dung dịch rõ ràng, dễ hiểu lắm.           |  |
|  | [****. ] Trần Thị C: Giao hàng nhanh, sách in đẹp nhưng bìa hơi bị nhăn nhẹ ở góc.          |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
V. TỔNG KẾT
Toàn bộ sơ đồ màn hình, cấu trúc liên kết và luồng hoạt động trên được xây dựng bám sát 100% các bảng và mối quan hệ khóa ngoại (Foreign Key) trong file SQL cung cấp:

Hệ thống mua sắm liên kết từ documents -> carts/cart_items -> orders/order_items -> payments -> shipping_addresses -> shipments.
Hệ thống học tập liên kết từ courses -> lessons -> grammars/kanjis/vocabularies/quizzes -> user_lesson_progress.
Hệ thống thi thử liên kết từ jlpt_exams -> jlpt_exam_sessions -> jlpt_exam_parts -> jlpt_exam_questions -> user_jlpt_attempts -> user_jlpt_attempt_answers.