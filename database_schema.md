CREATE DATABASE IF NOT EXISTS `study_jlpt` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `study_jlpt`;

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema study_jlpt
-- -----------------------------------------------------

-- -----------------------------------------------------

-- -----------------------------------------------------
-- Table `jlpt_levels`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `jlpt_levels` (
  `id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` ENUM('N5', 'N4', 'N3', 'N2', 'N1') NOT NULL COMMENT 'Mã cấp độ JLPT',
  `name` VARCHAR(50) NOT NULL COMMENT 'Tên hiển thị cấp độ',
  `description` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Mô tả cấp độ',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_jlpt_levels_code` (`code` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Danh sách các cấp độ JLPT N5-N1';


-- -----------------------------------------------------
-- Table `users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(150) NOT NULL COMMENT 'Họ tên người dùng',
  `email` VARCHAR(150) NOT NULL COMMENT 'Email đăng nhập, duy nhất',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'Mật khẩu đã hash',
  `avatar_url` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Ảnh đại diện',
  `phone` VARCHAR(20) NULL DEFAULT NULL COMMENT 'Số điện thoại',
  `role` ENUM('admin', 'student') NOT NULL DEFAULT 'student' COMMENT 'Vai trò người dùng',
  `email_verified_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Thời điểm xác thực email',
  `is_active` TINYINT(1) NOT NULL DEFAULT '1' COMMENT 'Trạng thái hoạt động tài khoản',
  `last_login_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Lần đăng nhập cuối',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_users_email` (`email` ASC),
  INDEX `idx_users_role` (`role` ASC)
  )
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Người dùng hệ thống (admin/student)';


-- -----------------------------------------------------
-- Table `media`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `media` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `file_name` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) NULL DEFAULT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_type` ENUM('image', 'audio', 'video', 'document') NOT NULL,
  `mime_type` VARCHAR(100) NULL DEFAULT NULL,
  `file_size` BIGINT UNSIGNED NULL DEFAULT NULL,
  `uploaded_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_media_type` (`file_type` ASC),
  INDEX `idx_media_uploaded_by` (`uploaded_by` ASC),
  CONSTRAINT `fk_media_uploaded_by`
    FOREIGN KEY (`uploaded_by`)
    REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `carts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `carts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID giỏ hàng',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Người sở hữu giỏ hàng',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_carts_user` (`user_id` ASC),
  CONSTRAINT `fk_carts_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Giỏ hàng của người dùng';


-- -----------------------------------------------------
-- Table `courses`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `courses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `jlpt_level_id` TINYINT UNSIGNED NOT NULL COMMENT 'Cấp độ JLPT của khóa học',
  `title` VARCHAR(200) NOT NULL COMMENT 'Tên khóa học',
  `slug` VARCHAR(220) NOT NULL COMMENT 'Slug URL',
  `description` TEXT NULL DEFAULT NULL COMMENT 'Mô tả khóa học',
  `price` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `is_published` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Đã xuất bản hay chưa',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Thứ tự hiển thị',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete',
  `thumbnail_media_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_courses_slug` (`slug` ASC),
  INDEX `idx_courses_jlpt_level` (`jlpt_level_id` ASC),
  INDEX `idx_courses_published` (`is_published` ASC),
  INDEX `fk_courses_thumbnail_media` (`thumbnail_media_id` ASC),
  CONSTRAINT `fk_courses_jlpt_level`
    FOREIGN KEY (`jlpt_level_id`)
    REFERENCES `jlpt_levels` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_courses_thumbnail_media`
    FOREIGN KEY (`thumbnail_media_id`)
    REFERENCES `media` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Khóa học theo cấp độ JLPT';


-- -----------------------------------------------------
-- Table `cart_items`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cart_id` BIGINT UNSIGNED NOT NULL,
  `course_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_cart_course` (`cart_id`, `course_id`),
  INDEX `idx_cart_items_course` (`course_id`),

  CONSTRAINT `fk_cart_items_cart`
    FOREIGN KEY (`cart_id`)
    REFERENCES `carts` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT `fk_cart_items_course`
    FOREIGN KEY (`course_id`)
    REFERENCES `courses` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

-- -----------------------------------------------------
-- Table `orders`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Người đặt hàng',

  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Tổng tiền hàng',
  `final_amount` DECIMAL(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Số tiền cuối cùng',

  `status` ENUM('pending', 'confirmed', 'cancelled')
    NOT NULL DEFAULT 'pending' COMMENT 'Trạng thái đơn hàng',

  `payment_method` ENUM('banking', 'momo', 'vnpay')
    NOT NULL DEFAULT 'banking' COMMENT 'Phương thức thanh toán',

  `payment_status` ENUM('pending', 'paid', 'failed')
    NOT NULL DEFAULT 'pending' COMMENT 'Trạng thái thanh toán',

  `note` TEXT NULL DEFAULT NULL,

  `confirmed_at` TIMESTAMP NULL DEFAULT NULL,

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),

  INDEX `idx_orders_user` (`user_id`),

  CONSTRAINT `fk_orders_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;

-- -----------------------------------------------------
-- Table `order_items`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  `order_id` BIGINT UNSIGNED NOT NULL COMMENT 'Đơn hàng',
  `course_id` BIGINT UNSIGNED NOT NULL COMMENT 'Khóa học được mua',

  
  `unit_price` DECIMAL(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Giá khóa học tại thời điểm mua',
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Thành tiền',

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),

  UNIQUE INDEX `uq_order_course` (`order_id`, `course_id`),

  INDEX `idx_order_items_order` (`order_id`),
  INDEX `idx_order_items_course` (`course_id`),

  CONSTRAINT `fk_order_items_order`
    FOREIGN KEY (`order_id`)
    REFERENCES `orders` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT `fk_order_items_course`
    FOREIGN KEY (`course_id`)
    REFERENCES `courses` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;
-- -----------------------------------------------------
-- Table `flashcard_folders`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `flashcard_folders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Người sở hữu folder',
  `name` VARCHAR(150) NOT NULL COMMENT 'Tên folder',
  `description` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Mô tả folder',
  `is_public` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Công khai cho người khác xem',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete',
  PRIMARY KEY (`id`),
  INDEX `idx_flashcard_folders_user` (`user_id` ASC),
  CONSTRAINT `fk_flashcard_folders_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Folder flashcard của người dùng';


-- -----------------------------------------------------
-- Table `flashcard_titles`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `flashcard_titles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `folder_id` BIGINT UNSIGNED NOT NULL COMMENT 'Folder chứa title (bộ flashcard)',
  `name` VARCHAR(150) NOT NULL COMMENT 'Tên bộ flashcard',
  `description` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Mô tả bộ flashcard',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Thứ tự hiển thị',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete',
  PRIMARY KEY (`id`),
  INDEX `idx_flashcard_titles_folder` (`folder_id` ASC),
  CONSTRAINT `fk_flashcard_titles_folder`
    FOREIGN KEY (`folder_id`)
    REFERENCES `flashcard_folders` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Bộ flashcard (title) trong folder';


-- -----------------------------------------------------
-- Table `flashcard_contents`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `flashcard_contents` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title_id` BIGINT UNSIGNED NOT NULL COMMENT 'Bộ flashcard chứa nội dung',
  `front_text` VARCHAR(500) NOT NULL COMMENT 'Mặt trước flashcard',
  `back_text` VARCHAR(500) NOT NULL COMMENT 'Mặt sau flashcard',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Thứ tự hiển thị',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete',
  `image_media_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `audio_media_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Audio phát âm',
  PRIMARY KEY (`id`),
  INDEX `idx_flashcard_contents_title` (`title_id` ASC),
  INDEX `fk_flashcard_contents_image_media` (`image_media_id` ASC),
  INDEX `idx_flashcard_contents_audio_media` (`audio_media_id`),
  CONSTRAINT `fk_flashcard_contents_image_media`
    FOREIGN KEY (`image_media_id`)
    REFERENCES `media` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_flashcard_contents_audio_media`
    FOREIGN KEY (`audio_media_id`)
    REFERENCES `media` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_flashcard_contents_title`
    FOREIGN KEY (`title_id`)
    REFERENCES `flashcard_titles` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Nội dung từng thẻ flashcard';


-- -----------------------------------------------------
-- Table `lessons`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `lessons` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `course_id` BIGINT UNSIGNED NOT NULL COMMENT 'Khóa học chứa bài học',
  `title` VARCHAR(200) NOT NULL COMMENT 'Tên bài học',
  `slug` VARCHAR(220) NOT NULL COMMENT 'Slug URL',
  `content` LONGTEXT NULL DEFAULT NULL COMMENT 'Nội dung bài học (HTML/markdown)',
  `duration_minutes` SMALLINT UNSIGNED NULL DEFAULT NULL COMMENT 'Thời lượng ước tính (phút)',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Thứ tự bài học trong khóa học',
  `is_published` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Đã xuất bản hay chưa',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete',
  `video_media_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_lessons_course_slug` (`course_id` ASC, `slug` ASC),
  INDEX `idx_lessons_course` (`course_id` ASC),
  INDEX `fk_lessons_video_media` (`video_media_id` ASC),
  CONSTRAINT `fk_lessons_course`
    FOREIGN KEY (`course_id`)
    REFERENCES `courses` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_lessons_video_media`
    FOREIGN KEY (`video_media_id`)
    REFERENCES `media` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Bài học trong khóa học';

-- -----------------------------------------------------
-- Table `vocabularies`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `vocabularies` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `lesson_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Bài học liên quan (nếu có)',
  `word` VARCHAR(100) NOT NULL COMMENT 'Từ tiếng Nhật (kanji/kana)',
  `reading` VARCHAR(150) NOT NULL COMMENT 'Cách đọc (hiragana/katakana)',
  `meaning_vi` VARCHAR(500) NOT NULL COMMENT 'Nghĩa tiếng Việt',
  `example_sentence_jp` TEXT NULL DEFAULT NULL COMMENT 'Câu ví dụ tiếng Nhật',
  `example_sentence_vi` TEXT NULL DEFAULT NULL COMMENT 'Câu ví dụ tiếng Việt',
  `part_of_speech` VARCHAR(50) NULL DEFAULT NULL COMMENT 'Từ loại',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete',
  PRIMARY KEY (`id`),
  INDEX `idx_vocab_lesson` (`lesson_id` ASC),
  INDEX `idx_vocab_word` (`word` ASC),
  CONSTRAINT `fk_vocab_lesson`
    FOREIGN KEY (`lesson_id`)
    REFERENCES `lessons` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Từ vựng theo cấp độ JLPT';

-- -----------------------------------------------------
-- Table `kanjis`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `kanjis` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `lesson_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Bài học liên quan (nếu có)',
  `kanji` VARCHAR(10) NOT NULL COMMENT 'Chữ Kanji',
  `onyomi` VARCHAR(150) NULL DEFAULT NULL COMMENT 'Am Hán (Onyomi)',
  `kunyomi` VARCHAR(150) NULL DEFAULT NULL COMMENT 'Âm thuần Nhật (Kunyomi)',
  `meaning_vi` VARCHAR(255) NOT NULL COMMENT 'Nghĩa tiếng Việt',
  `stroke_count` TINYINT UNSIGNED NULL DEFAULT NULL COMMENT 'Số nét',
  `example_words` TEXT NULL DEFAULT NULL COMMENT 'Các từ ví dụ chứa kanji',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_kanjis_kanji` (`kanji` ASC),
  INDEX `idx_kanjis_lesson` (`lesson_id` ASC),
  CONSTRAINT `fk_kanjis_lesson`
    FOREIGN KEY (`lesson_id`)
    REFERENCES `lessons` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Bảng chữ Kanji theo cấp độ JLPT';
-- -----------------------------------------------------
-- Table `grammars`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `grammars` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `lesson_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Bài học liên quan (nếu có)',
  `title` VARCHAR(200) NOT NULL COMMENT 'Tên cấu trúc ngữ pháp',
  `content` LONGTEXT NOT NULL COMMENT 'Nội dung bài ngữ pháp (TinyMCE)',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete',
  PRIMARY KEY (`id`),
  INDEX `idx_grammars_lesson` (`lesson_id` ASC),
  CONSTRAINT `fk_grammars_lesson`
    FOREIGN KEY (`lesson_id`)
    REFERENCES `lessons` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Cấu trúc ngữ pháp theo cấp độ JLPT';

CREATE TABLE IF NOT EXISTS `quizzes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `lesson_id` BIGINT UNSIGNED NOT NULL COMMENT 'Lesson chứa quiz',
  `title` VARCHAR(200) NOT NULL COMMENT 'Tên quiz',
  `description` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Mô tả quiz',
  `time_limit_seconds` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Giới hạn thời gian làm bài (giây)',
  `pass_score` DECIMAL(5,2) NOT NULL DEFAULT '60.00' COMMENT 'Điểm đạt (%)',
  `is_published` TINYINT(1) NOT NULL DEFAULT '0',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,

  PRIMARY KEY (`id`),

  INDEX `idx_quizzes_lesson` (`lesson_id`),

  CONSTRAINT `fk_quizzes_lesson`
    FOREIGN KEY (`lesson_id`)
    REFERENCES `lessons` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Quiz của bài học';

CREATE TABLE IF NOT EXISTS `quiz_questions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `quiz_id` BIGINT UNSIGNED NOT NULL,
  `question_text` TEXT NOT NULL COMMENT 'Nội dung câu hỏi',

  `question_type` ENUM(
    'single_choice',
    'multiple_choice',
    'fill_blank'
  ) NOT NULL DEFAULT 'single_choice',

  `points` DECIMAL(5,2) NOT NULL DEFAULT '1.00',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT '0',

  `image_media_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `audio_media_id` BIGINT UNSIGNED NULL DEFAULT NULL,

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,

  PRIMARY KEY (`id`),

  INDEX `idx_quiz_questions_quiz` (`quiz_id`),
  INDEX `idx_quiz_questions_image_media` (`image_media_id`),
  INDEX `idx_quiz_questions_audio_media` (`audio_media_id`),

  CONSTRAINT `fk_quiz_questions_quiz`
    FOREIGN KEY (`quiz_id`)
    REFERENCES `quizzes` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT `fk_quiz_questions_image_media`
    FOREIGN KEY (`image_media_id`)
    REFERENCES `media` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT `fk_quiz_questions_audio_media`
    FOREIGN KEY (`audio_media_id`)
    REFERENCES `media` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Câu hỏi trong quiz';

CREATE TABLE IF NOT EXISTS `quiz_options` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `question_id` BIGINT UNSIGNED NOT NULL,
  `option_text` VARCHAR(500) NOT NULL COMMENT 'Nội dung lựa chọn',
  `is_correct` TINYINT(1) NOT NULL DEFAULT '0',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT '0',

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),

  INDEX `idx_quiz_options_question` (`question_id`),

  CONSTRAINT `fk_quiz_options_question`
    FOREIGN KEY (`question_id`)
    REFERENCES `quiz_questions` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Các lựa chọn của câu hỏi quiz';


-- -----------------------------------------------------
-- Table `jlpt_exams`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `jlpt_exams` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `jlpt_level_id` TINYINT UNSIGNED NOT NULL COMMENT 'Cấp độ JLPT của đề thi',
  `title` VARCHAR(200) NOT NULL COMMENT 'Tên đề thi thử',
  `description` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Mô tả đề thi',
  `total_time_minutes` SMALLINT UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Tổng thời gian thi (phút)',
  `is_published` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Đã xuất bản hay chưa',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete',
  PRIMARY KEY (`id`),
  INDEX `idx_jlpt_exams_level` (`jlpt_level_id` ASC),
  CONSTRAINT `fk_jlpt_exams_level`
    FOREIGN KEY (`jlpt_level_id`)
    REFERENCES `jlpt_levels` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Đề thi thử JLPT';


-- -----------------------------------------------------
-- Table `jlpt_exam_sessions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `jlpt_exam_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `jlpt_exam_id` BIGINT UNSIGNED NOT NULL COMMENT 'Đề thi chứa session',
  `name` VARCHAR(150) NOT NULL COMMENT 'Tên session (VD: Vocabulary/Grammar, Reading, Listening)',
  `session_type` ENUM('language_knowledge', 'reading', 'listening') NOT NULL COMMENT 'Loại session thi',
  `time_limit_minutes` SMALLINT UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Thời gian làm session (phút)',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Thứ tự session',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_exam_sessions_exam` (`jlpt_exam_id` ASC),
  CONSTRAINT `fk_exam_sessions_exam`
    FOREIGN KEY (`jlpt_exam_id`)
    REFERENCES `jlpt_exams` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Phần thi (session) trong đề thi JLPT';


-- -----------------------------------------------------
-- Table `jlpt_exam_parts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `jlpt_exam_parts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `jlpt_exam_session_id` BIGINT UNSIGNED NOT NULL COMMENT 'Session chứa part',
  `name` VARCHAR(150) NOT NULL COMMENT 'Tên part (VD: Mondai 1)',
  `instructions` TEXT NULL DEFAULT NULL COMMENT 'Hướng dẫn làm bài cho part',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Thứ tự part',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `audio_media_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_exam_parts_session` (`jlpt_exam_session_id` ASC),
  INDEX `fk_jlpt_exam_parts_audio_media` (`audio_media_id` ASC),
  CONSTRAINT `fk_exam_parts_session`
    FOREIGN KEY (`jlpt_exam_session_id`)
    REFERENCES `jlpt_exam_sessions` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_jlpt_exam_parts_audio_media`
    FOREIGN KEY (`audio_media_id`)
    REFERENCES `media` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Phần nhỏ (part/mondai) trong session thi';


-- -----------------------------------------------------
-- Table `jlpt_exam_questions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `jlpt_exam_questions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `jlpt_exam_part_id` BIGINT UNSIGNED NOT NULL COMMENT 'Part chứa câu hỏi',
  `question_text` TEXT NOT NULL COMMENT 'Nội dung câu hỏi',
  `passage_text` TEXT NULL DEFAULT NULL COMMENT 'Đoạn văn đọc hiểu (nếu có)',
  `question_type` ENUM('single_choice') NOT NULL DEFAULT 'single_choice' COMMENT 'Loại câu hỏi JLPT',
  `explanation` TEXT NULL DEFAULT NULL COMMENT 'Giải thích đáp án sau khi nộp bài',
  `points` DECIMAL(5,2) NOT NULL DEFAULT '1.00' COMMENT 'Điểm số câu hỏi',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Thứ tự câu hỏi',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `image_media_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_exam_questions_part` (`jlpt_exam_part_id` ASC),
  INDEX `fk_jlpt_exam_questions_image_media` (`image_media_id` ASC),
  CONSTRAINT `fk_exam_questions_part`
    FOREIGN KEY (`jlpt_exam_part_id`)
    REFERENCES `jlpt_exam_parts` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_jlpt_exam_questions_image_media`
    FOREIGN KEY (`image_media_id`)
    REFERENCES `media` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Câu hỏi trong đề thi JLPT';


-- -----------------------------------------------------
-- Table `jlpt_exam_answers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `jlpt_exam_answers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `jlpt_exam_question_id` BIGINT UNSIGNED NOT NULL COMMENT 'Câu hỏi chứa đáp án',
  `answer_text` VARCHAR(500) NOT NULL COMMENT 'Nội dung đáp án',
  `is_correct` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Đáp án đúng hay sai',
  `sort_order` INT UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Thứ tự đáp án',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_exam_answers_question` (`jlpt_exam_question_id` ASC),
  CONSTRAINT `fk_exam_answers_question`
    FOREIGN KEY (`jlpt_exam_question_id`)
    REFERENCES `jlpt_exam_questions` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Đáp án của câu hỏi đề thi JLPT';



-- -----------------------------------------------------
-- Table `learning_streaks`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `learning_streaks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `current_streak` INT UNSIGNED NULL DEFAULT '0',
  `longest_streak` INT UNSIGNED NULL DEFAULT '0',
  `last_study_date` DATE NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_streak_user` (`user_id` ASC),
  CONSTRAINT `fk_streak_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;




-- -----------------------------------------------------
-- Table `password_reset_tokens`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Người dùng yêu cầu reset',
  `token` VARCHAR(255) NOT NULL COMMENT 'Token reset password',
  `expires_at` TIMESTAMP NOT NULL COMMENT 'Thời điểm hết hạn token',
  `used_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Thời điểm token được sử dụng',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_password_reset_token` (`token` ASC),
  INDEX `idx_password_reset_user` (`user_id` ASC),
  CONSTRAINT `fk_password_reset_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Token đặt lại mật khẩu';

-- -----------------------------------------------------
-- Table `payments`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  `order_id` BIGINT UNSIGNED NOT NULL
    COMMENT 'Đơn hàng được thanh toán',

  `payment_method` ENUM(
    'BANK_TRANSFER',
    'VNPAY',
    'MOMO',
    'PAYPAL'
  ) NOT NULL
    COMMENT 'Phương thức thanh toán',

  `transaction_code` VARCHAR(255) NULL DEFAULT NULL
    COMMENT 'Mã giao dịch từ cổng thanh toán',

  `amount` DECIMAL(12,2) NOT NULL
    COMMENT 'Số tiền thanh toán',

  `status` ENUM(
    'PENDING',
    'SUCCESS',
    'FAILED',
    'REFUNDED'
  ) NOT NULL DEFAULT 'PENDING'
    COMMENT 'Trạng thái giao dịch',

  `paid_at` TIMESTAMP NULL DEFAULT NULL,

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),

  INDEX `idx_payments_order` (`order_id`),

  INDEX `idx_payments_transaction`
    (`transaction_code`),

  CONSTRAINT `fk_payments_order`
    FOREIGN KEY (`order_id`)
    REFERENCES `orders` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Giao dịch thanh toán đơn hàng';




-- -----------------------------------------------------
-- Table `user_course_enrollments`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_course_enrollments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Người dùng đăng ký',
  `course_id` BIGINT UNSIGNED NOT NULL COMMENT 'Khóa học được đăng ký',
  `enrolled_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm đăng ký',
  `status` ENUM('active', 'completed', 'dropped') NOT NULL DEFAULT 'active' COMMENT 'Trạng thái đăng ký',
  `progress_percent` DECIMAL(5,2) NOT NULL DEFAULT '0.00' COMMENT 'Tiến độ hoàn thành (%)',
  `completed_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Thời điểm hoàn thành khóa học',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_enrollment_user_course` (`user_id` ASC, `course_id` ASC),
  INDEX `idx_enrollment_course` (`course_id` ASC),
  CONSTRAINT `fk_enrollment_course`
    FOREIGN KEY (`course_id`)
    REFERENCES `courses` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_enrollment_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Đăng ký khóa học của người dùng';


-- -----------------------------------------------------
-- Table `user_jlpt_attempts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_jlpt_attempts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Người dùng làm bài',
  `jlpt_exam_id` BIGINT UNSIGNED NOT NULL COMMENT 'Đề thi được làm',
  `status` ENUM(
    'in_progress',
    'completed',
    'abandoned'
  ) NOT NULL DEFAULT 'in_progress' COMMENT 'Trạng thái lượt làm',
  `total_score` DECIMAL(6,2) NOT NULL DEFAULT '0.00' COMMENT 'Tổng điểm đạt được',
  `is_passed` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Đạt hay không',
  `started_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm bắt đầu',
  `finished_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Thời điểm hoàn thành',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `duration_seconds` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_jlpt_attempts_user` (`user_id` ASC),
  INDEX `idx_jlpt_attempts_exam` (`jlpt_exam_id` ASC),
  CONSTRAINT `fk_jlpt_attempts_exam`
    FOREIGN KEY (`jlpt_exam_id`)
    REFERENCES `jlpt_exams` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_jlpt_attempts_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Lượt làm đề thi thử JLPT của người dùng';


-- -----------------------------------------------------
-- Table `user_jlpt_attempt_sessions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_jlpt_attempt_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `attempt_id` BIGINT UNSIGNED NOT NULL COMMENT 'Lượt làm bài thi',
  `status` ENUM(
    'in_progress',
    'completed',
    'abandoned'
  ) NOT NULL DEFAULT 'in_progress' COMMENT 'Trạng thái lượt làm',
  `jlpt_exam_session_id` BIGINT UNSIGNED NOT NULL COMMENT 'Session được thực hiện trong lượt thi',
  `score` DECIMAL(6,2) NOT NULL DEFAULT '0.00' COMMENT 'Điểm đạt được của session',
   `is_passed` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Đạt hay không',
  `max_score` DECIMAL(6,2) NOT NULL DEFAULT '0.00' COMMENT 'Tổng điểm tối đa của session',
  `correct_count` INT UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Số câu trả lời đúng',
  `total_questions` INT UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Tổng số câu hỏi',
  
  `started_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Thời điểm bắt đầu session',
  `finished_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Thời điểm hoàn thành session',
  `duration_seconds` INT UNSIGNED NULL DEFAULT NULL COMMENT 'Thời gian thực tế làm session (giây)',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_jlpt_attempt_session` (`attempt_id` ASC, `jlpt_exam_session_id` ASC),
  INDEX `idx_jlpt_attempt_sessions_attempt` (`attempt_id` ASC),
  INDEX `idx_jlpt_attempt_sessions_session` (`jlpt_exam_session_id` ASC),
  CONSTRAINT `fk_jlpt_attempt_sessions_attempt`
    FOREIGN KEY (`attempt_id`)
    REFERENCES `user_jlpt_attempts` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_jlpt_attempt_sessions_session`
    FOREIGN KEY (`jlpt_exam_session_id`)
    REFERENCES `jlpt_exam_sessions` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Kết quả từng session trong lượt làm đề thi JLPT';


-- -----------------------------------------------------
-- Table `user_jlpt_attempt_parts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_jlpt_attempt_parts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `attempt_session_id` BIGINT UNSIGNED NOT NULL COMMENT 'Session của lượt làm bài',
  `jlpt_exam_part_id` BIGINT UNSIGNED NOT NULL COMMENT 'Part được thực hiện trong session',
  `score` DECIMAL(6,2) NOT NULL DEFAULT '0.00' COMMENT 'Điểm đạt được của part',
  `max_score` DECIMAL(6,2) NOT NULL DEFAULT '0.00' COMMENT 'Tổng điểm tối đa của part',
  `correct_count` INT UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Số câu trả lời đúng',
  `total_questions` INT UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Tổng số câu hỏi',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_jlpt_attempt_part` (`attempt_session_id` ASC, `jlpt_exam_part_id` ASC),
  INDEX `idx_jlpt_attempt_parts_session` (`attempt_session_id` ASC),
  INDEX `idx_jlpt_attempt_parts_part` (`jlpt_exam_part_id` ASC),
  CONSTRAINT `fk_jlpt_attempt_parts_session`
    FOREIGN KEY (`attempt_session_id`)
    REFERENCES `user_jlpt_attempt_sessions` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_jlpt_attempt_parts_part`
    FOREIGN KEY (`jlpt_exam_part_id`)
    REFERENCES `jlpt_exam_parts` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Kết quả từng part/mondai trong session thi JLPT';


-- -----------------------------------------------------
-- Table `user_jlpt_attempt_answers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_jlpt_attempt_answers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  `session_attempt_id` BIGINT UNSIGNED NOT NULL COMMENT 'Session của lượt làm bài',
  `jlpt_exam_question_id` BIGINT UNSIGNED NOT NULL COMMENT 'Câu hỏi được trả lời',
  `jlpt_exam_answer_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT 'Đáp án người dùng chọn',
   `is_correct` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Trả lời đúng hay sai',
   `answered_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm trả lời',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_jlpt_session_attempt_question`
    (`session_attempt_id`, `jlpt_exam_question_id`),
  INDEX `idx_jlpt_attempt_answers_question`
    (`jlpt_exam_question_id`),
  INDEX `idx_jlpt_attempt_answers_answer`
    (`jlpt_exam_answer_id`),
  CONSTRAINT `fk_jlpt_attempt_answers_answer`
    FOREIGN KEY (`jlpt_exam_answer_id`)
    REFERENCES `jlpt_exam_answers` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_jlpt_attempt_answers_question`
    FOREIGN KEY (`jlpt_exam_question_id`)
    REFERENCES `jlpt_exam_questions` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_jlpt_attempt_answers_session`
    FOREIGN KEY (`session_attempt_id`)
    REFERENCES `user_jlpt_attempt_sessions` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Đáp án đã chọn trong session thi JLPT';


-- -----------------------------------------------------
-- Table `user_lesson_progress`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_lesson_progress` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Người dùng',
  `lesson_id` BIGINT UNSIGNED NOT NULL COMMENT 'Bài học',
  `status` ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started' COMMENT 'Trạng thái hoàn thành',
  `progress_seconds` INT UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Thời gian học (giây)',
  `last_accessed_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Lần truy cập cuối',
  `completed_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Thời điểm hoàn thành',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uq_lesson_progress_user_lesson` (`user_id` ASC, `lesson_id` ASC),
  INDEX `idx_lesson_progress_lesson` (`lesson_id` ASC),
  CONSTRAINT `fk_lesson_progress_lesson`
    FOREIGN KEY (`lesson_id`)
    REFERENCES `lessons` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_lesson_progress_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Tiến độ học bài học của người dùng';


-- -----------------------------------------------------
-- Table `user_quiz_attempts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_quiz_attempts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Người dùng làm bài',
  `quiz_id` BIGINT UNSIGNED NOT NULL COMMENT 'Quiz được làm',
  `status` ENUM(
    'in_progress',
    'completed',
    'abandoned'
  ) NOT NULL DEFAULT 'in_progress' COMMENT 'Trạng thái lượt làm',
  `score` DECIMAL(5,2) NOT NULL DEFAULT '0.00' COMMENT 'Điểm số đạt được (%)',
  `is_passed` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'Đạt hay không',
  `started_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm bắt đầu',
  `finished_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Thời điểm hoàn thành',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `duration_seconds` INT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_quiz_attempts_user` (`user_id` ASC),
  INDEX `idx_quiz_attempts_quiz` (`quiz_id` ASC),
  CONSTRAINT `fk_quiz_attempts_quiz`
    FOREIGN KEY (`quiz_id`)
    REFERENCES `quizzes` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_quiz_attempts_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci
COMMENT = 'Lượt làm quiz của người dùng';


-- -----------------------------------------------------
-- Table `user_quiz_attempt_answers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_quiz_attempt_answers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  `attempt_id` BIGINT UNSIGNED NOT NULL
    COMMENT 'Lượt làm bài',

  `quiz_question_id` BIGINT UNSIGNED NOT NULL
    COMMENT 'Câu hỏi được trả lời',
  `user_answer_text` VARCHAR(500) NULL DEFAULT NULL
    COMMENT 'Câu trả lời dạng text của người dùng',
  `quiz_option_id` BIGINT UNSIGNED NULL DEFAULT NULL
    COMMENT 'Đáp án người dùng chọn',

  `is_correct` TINYINT(1) NOT NULL DEFAULT '0'
    COMMENT 'Trả lời đúng hay sai',

  `answered_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),

  UNIQUE INDEX `uq_attempt_question`
    (`attempt_id`, `quiz_question_id`),

  INDEX `idx_attempt_answers_question`
    (`quiz_question_id`),

  INDEX `idx_attempt_answers_option`
    (`quiz_option_id`),

  CONSTRAINT `fk_attempt_answers_option`
    FOREIGN KEY (`quiz_option_id`)
    REFERENCES `quiz_options` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT `fk_attempt_answers_attempt`
    FOREIGN KEY (`attempt_id`)
    REFERENCES `user_quiz_attempts` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT `fk_attempt_answers_question`
    FOREIGN KEY (`quiz_question_id`)
    REFERENCES `quiz_questions` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE

) ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_general_ci;





SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
