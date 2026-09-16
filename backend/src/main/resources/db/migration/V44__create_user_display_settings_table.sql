-- =========================================================================
-- Migration Script: Create User Display Settings Table (NCL-19-CN-001)
-- Target table: user_display_settings
-- =========================================================================

CREATE TABLE IF NOT EXISTS user_display_settings (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh cài đặt hiển thị',
    user_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại trỏ đến tài khoản người dùng (quan hệ 1-1)',
    simple_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Trạng thái bật/tắt chế độ đơn giản & chữ lớn',
    font_size_level VARCHAR(20) NOT NULL DEFAULT 'STANDARD' COMMENT 'Mức cỡ chữ: STANDARD (100%), LARGE (125%), EXTRA_LARGE (150%)',
    button_size_level VARCHAR(20) NOT NULL DEFAULT 'STANDARD' COMMENT 'Mức kích thước nút: STANDARD, LARGE, EXTRA_LARGE',
    show_text_labels BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Hiển thị nhãn chữ kèm biểu tượng trên các nút hành động',
    require_confirmation_dialog BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Bắt buộc hiện hộp thoại cảnh báo hậu quả đối với thao tác một chiều',
    high_contrast_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Bật chế độ màu sắc tương phản cao hỗ trợ người mắt kém',
    simplified_pos_layout BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Thu gọn màn hình POS chỉ giữ tìm hàng, thêm hàng, thanh toán và xuất hóa đơn',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo cấu hình',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật cấu hình gần nhất',
    CONSTRAINT uq_uds_user_id UNIQUE (user_id),
    CONSTRAINT fk_uds_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_uds_font_size CHECK (font_size_level IN ('STANDARD', 'LARGE', 'EXTRA_LARGE')),
    CONSTRAINT chk_uds_button_size CHECK (button_size_level IN ('STANDARD', 'LARGE', 'EXTRA_LARGE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu cấu hình chế độ hiển thị chữ lớn và thao tác đơn giản theo tài khoản (NCL-19-CN-001)';
