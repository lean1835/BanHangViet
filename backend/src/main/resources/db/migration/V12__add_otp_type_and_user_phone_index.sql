-- V12: Add type column to password_reset_otps and add index for users.phone_number (NCL-01-CN-006)

ALTER TABLE password_reset_otps 
    ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'PASSWORD_RESET';

ALTER TABLE password_reset_otps 
    DROP INDEX IF EXISTS idx_pwd_reset_lookup;

ALTER TABLE password_reset_otps 
    ADD INDEX idx_pwd_reset_lookup (phone_number, type, is_used, created_at);

ALTER TABLE users 
    ADD INDEX IF NOT EXISTS idx_users_phone_number (phone_number);
