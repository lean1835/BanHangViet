-- V35: Tạo bảng app_notifications và bổ sung tỷ lệ cảnh báo ngưỡng doanh thu năm (NCL-12-CN-005 & NCL-19-CN-002)

-- 1. Bổ sung trường revenue_warning_threshold_percentage vào bảng business_household_settings
ALTER TABLE business_household_settings
    ADD COLUMN IF NOT EXISTS revenue_warning_threshold_percentage DECIMAL(5, 2) NOT NULL DEFAULT 80.00
    COMMENT 'Tỷ lệ phần trăm cảnh báo trước khi chạm ngưỡng 1 tỷ đồng (mặc định 80.00%)';

-- 2. Tạo bảng app_notifications
CREATE TABLE IF NOT EXISTS app_notifications (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh thông báo',
    household_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết hộ kinh doanh',
    user_id VARCHAR(36) NULL COMMENT 'Người nhận đích (NULL nếu thông báo chung toàn hộ)',
    notification_type VARCHAR(50) NOT NULL COMMENT 'Loại thông báo: REVENUE_THRESHOLD_WARNING, REVENUE_THRESHOLD_EXCEEDED...',
    severity VARCHAR(20) NOT NULL DEFAULT 'WARNING' COMMENT 'Mức độ: INFO, WARNING, DANGER',
    title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề thông báo ngắn gọn',
    message TEXT NOT NULL COMMENT 'Nội dung chi tiết thông báo và hướng dẫn nghĩa vụ',
    action_url VARCHAR(255) NULL COMMENT 'Đường dẫn liên kết mở thẳng màn hình xử lý',
    metadata JSON NULL COMMENT 'Dữ liệu ngữ cảnh bổ sung (năm, doanh thu, tỷ lệ %)',
    is_read BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Trạng thái đã đọc hay chưa',
    read_at TIMESTAMP NULL COMMENT 'Thời điểm người dùng đọc thông báo',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo thông báo',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_household FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_notif_severity CHECK (severity IN ('INFO', 'WARNING', 'DANGER'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Trung tâm lưu trữ thông báo và cảnh báo hệ thống';

CREATE INDEX idx_notif_household_created ON app_notifications(household_id, created_at DESC);
CREATE INDEX idx_notif_household_type ON app_notifications(household_id, notification_type);
CREATE INDEX idx_notif_household_unread ON app_notifications(household_id, is_read);
