-- V26: Tạo bảng lưu lịch sử các chặng bàn giao ca giữa hai nhân viên (NCL-03-CN-013)
CREATE TABLE IF NOT EXISTS shift_handovers (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh lần bàn giao',
    shift_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại ca bán hàng được bàn giao',
    household_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại hộ kinh doanh để cô lập dữ liệu',
    sender_user_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại nhân viên bàn giao (người chốt chặng)',
    receiver_user_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại nhân viên tiếp nhận ca',
    handover_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm xác nhận bàn giao',
    stage_number INT NOT NULL DEFAULT 1 COMMENT 'Số thứ tự chặng bàn giao trong ca (Chặng 1, Chặng 2...)',
    opening_cash DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Tiền quỹ đầu chặng của người bàn giao',
    cash_revenue DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Doanh thu tiền mặt thu được trong chặng',
    expected_cash DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Tiền quỹ dự kiến tại thời điểm bàn giao = opening_cash + cash_revenue',
    actual_cash DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Số tiền mặt thực tế kiểm đếm và bàn giao hai bên xác nhận',
    difference_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Mức chênh lệch tiền = actual_cash - expected_cash (gán cho sender)',
    difference_reason TEXT NULL COMMENT 'Lý do chênh lệch tiền (bắt buộc khi difference_amount != 0)',
    completed_orders_count INT NOT NULL DEFAULT 0 COMMENT 'Số lượng đơn hàng hoàn thành trong chặng',
    pending_orders_count INT NOT NULL DEFAULT 0 COMMENT 'Số lượng đơn hàng đang treo chuyển giao sang người nhận',
    notes TEXT NULL COMMENT 'Ghi chú bàn giao thêm giữa hai nhân viên',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sh_shift FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
    CONSTRAINT fk_sh_household FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    CONSTRAINT fk_sh_sender FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sh_receiver FOREIGN KEY (receiver_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_sh_actual_cash CHECK (actual_cash >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu lịch sử các chặng bàn giao ca giữa hai nhân viên';

CREATE INDEX idx_sh_shift ON shift_handovers(shift_id);
CREATE INDEX idx_sh_household ON shift_handovers(household_id);
CREATE INDEX idx_sh_sender ON shift_handovers(sender_user_id);
CREATE INDEX idx_sh_receiver ON shift_handovers(receiver_user_id);
CREATE INDEX idx_sh_handover_time ON shift_handovers(handover_time);
