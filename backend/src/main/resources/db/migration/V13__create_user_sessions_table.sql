-- ====================================================================
-- Migration: V13__create_user_sessions_table.sql
-- Mô tả: Bảng quản lý phiên đăng nhập (user_sessions) và cấu hình thời gian tự hết hạn phiên (session_timeout_minutes)
-- ====================================================================

CREATE TABLE IF NOT EXISTS `user_sessions` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `household_id` VARCHAR(36) NULL,
    `device_type` VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN',
    `device_name` VARCHAR(255) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `login_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_active_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` DATETIME NOT NULL,
    `is_revoked` TINYINT(1) NOT NULL DEFAULT 0,
    `revoked_at` DATETIME NULL,
    `revoked_by_user_id` VARCHAR(36) NULL,
    `revoke_reason` VARCHAR(255) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_sessions_user_id` (`user_id`),
    KEY `idx_user_sessions_household_id` (`household_id`),
    KEY `idx_user_sessions_active` (`household_id`, `is_revoked`, `last_active_at`),
    CONSTRAINT `fk_user_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_sessions_household` FOREIGN KEY (`household_id`) REFERENCES `business_households` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_sessions_revoked_by` FOREIGN KEY (`revoked_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `business_households` ADD COLUMN IF NOT EXISTS `session_timeout_minutes` INT NOT NULL DEFAULT 60;
