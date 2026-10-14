-- Additive migration. Run against the application's MySQL database before deployment.
-- The catalog starts empty; authenticated administrators populate it through
-- POST /api/v1/admin/speaking/topics with { "title": "...", "description": "..." }.
CREATE TABLE IF NOT EXISTS speaking_topics (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description VARCHAR(1000) NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(6) NOT NULL,
  INDEX idx_speaking_topics_visible (is_published, is_deleted, id)
);

