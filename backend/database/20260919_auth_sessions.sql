-- Additive migration: run once before deploying the new authentication code.
-- Existing users/otps tables are not modified. Existing JWTs require a fresh login.
-- No raw refresh token or password is stored here.
CREATE TABLE IF NOT EXISTS auth_sessions (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    refresh_token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    revoked_at DATETIME(6) NULL,
    persistent BIT(1) NOT NULL,
    INDEX idx_auth_sessions_user (user_id),
    INDEX idx_auth_sessions_expiry (expires_at)
);
