-- V14: Add email column to users and password_reset_otps tables for Gmail reset password support (NCL-01-CN-005)

ALTER TABLE users 
    ADD COLUMN email VARCHAR(100) NULL;

ALTER TABLE users 
    ADD INDEX idx_users_email (email);

ALTER TABLE password_reset_otps 
    ADD COLUMN email VARCHAR(100) NULL;

ALTER TABLE password_reset_otps 
    ADD INDEX idx_pwd_reset_email_lookup (email, type, is_used, created_at);

-- Fix session timeout minutes for any households where default was initialized to 0
UPDATE business_households 
    SET session_timeout_minutes = 60 
    WHERE session_timeout_minutes IS NULL OR session_timeout_minutes < 5;

