-- V37: Bổ sung cấu hình nhắc nộp tờ khai theo kỳ, cờ xuất tờ khai và hỗ trợ tự đóng thông báo (NCL-12-CN-007)

-- 1. Bổ sung cấu hình kỳ kê khai thuế và nhắc nộp vào bảng business_household_settings
ALTER TABLE business_household_settings
    ADD COLUMN IF NOT EXISTS tax_period_type VARCHAR(20) NOT NULL DEFAULT 'QUARTERLY' 
        COMMENT 'Kỳ kê khai áp dụng của hộ: MONTHLY hoặc QUARTERLY (mặc định QUARTERLY)',
    ADD COLUMN IF NOT EXISTS tax_reminder_days_before INT NOT NULL DEFAULT 5 
        COMMENT 'Số ngày hệ thống nhắc trước hạn nộp tờ khai (mặc định 5 ngày, hợp lệ 1-30)',
    ADD COLUMN IF NOT EXISTS tax_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE 
        COMMENT 'Bật/tắt tính năng nhắc nộp tờ khai theo kỳ (mặc định TRUE)';

-- 2. Bổ sung cờ theo dõi trạng thái xuất tờ khai vào bảng tax_declaration_periods
ALTER TABLE tax_declaration_periods
    ADD COLUMN IF NOT EXISTS declaration_exported BOOLEAN NOT NULL DEFAULT FALSE 
        COMMENT 'Đánh dấu đã xuất tờ khai thuế mẫu 01/CNKD hay chưa',
    ADD COLUMN IF NOT EXISTS declaration_exported_at TIMESTAMP NULL 
        COMMENT 'Thời điểm xuất tờ khai thuế gần nhất';

-- 3. Bổ sung liên kết đối tượng nghiệp vụ và cơ chế tự đóng vào bảng app_notifications
ALTER TABLE app_notifications
    ADD COLUMN IF NOT EXISTS target_type VARCHAR(50) NULL 
        COMMENT 'Loại đối tượng nghiệp vụ liên kết: TAX_PERIOD, REVENUE_WARNING...',
    ADD COLUMN IF NOT EXISTS target_id VARCHAR(36) NULL 
        COMMENT 'ID của đối tượng nghiệp vụ liên kết (ví dụ: period_id)',
    ADD COLUMN IF NOT EXISTS is_closed BOOLEAN NOT NULL DEFAULT FALSE 
        COMMENT 'Trạng thái thông báo đã được tự động đóng hay chưa (mặc định FALSE)',
    ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP NULL 
        COMMENT 'Thời điểm thông báo được hệ thống tự động đóng khi hoàn thành việc';

-- 4. Tạo các chỉ mục tối ưu hóa truy vấn nhắc việc
CREATE INDEX idx_notif_target ON app_notifications(household_id, target_type, target_id);
CREATE INDEX idx_notif_closed ON app_notifications(household_id, is_closed);
CREATE INDEX idx_tax_period_exported ON tax_declaration_periods(household_id, declaration_exported);
