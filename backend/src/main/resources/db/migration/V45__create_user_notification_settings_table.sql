-- =========================================================================
-- Migration Script: Create User Notification Settings Table (NCL-19-CN-002)
-- =========================================================================

CREATE TABLE IF NOT EXISTS user_notification_settings (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh cài đặt thông báo',
    user_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết bảng users',
    notification_type VARCHAR(50) NOT NULL COMMENT 'Mã loại thông báo (INVOICE_ERROR, DEBT_DUE, LOW_STOCK_WARNING...)',
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái bật (TRUE) hoặc tắt (FALSE) loại thông báo này',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo cài đặt',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật gần nhất',
    CONSTRAINT uq_user_notif_type UNIQUE (user_id, notification_type),
    CONSTRAINT fk_uns_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu cấu hình bật/tắt nhận từng loại thông báo của người dùng';

CREATE INDEX idx_uns_user ON user_notification_settings(user_id);
