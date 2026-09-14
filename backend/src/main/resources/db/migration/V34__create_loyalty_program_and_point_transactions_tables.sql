-- V34: Tạo bảng cấu hình chương trình tích điểm và sổ cái biến động điểm khách hàng thân thiết (NCL-10-CN-008)

-- 1. Tạo bảng loyalty_program_configs
CREATE TABLE IF NOT EXISTS loyalty_program_configs (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh cấu hình',
    household_id VARCHAR(36) NOT NULL UNIQUE COMMENT 'Khóa ngoại 1-1 với hộ kinh doanh',
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Cờ kích hoạt chương trình tích điểm',
    spend_amount_per_point DECIMAL(15, 2) NOT NULL DEFAULT 10000.00 COMMENT 'Số tiền thực trả để quy đổi thành 1 điểm thưởng (VNĐ)',
    point_value DECIMAL(15, 2) NOT NULL DEFAULT 1000.00 COMMENT 'Giá trị quy đổi thành tiền của 1 điểm khi tiêu (VNĐ)',
    min_points_to_redeem INT NOT NULL DEFAULT 50 COMMENT 'Số điểm tích lũy tối thiểu để bắt đầu được phép đổi điểm',
    max_redeem_rate_per_order DECIMAL(5, 2) NOT NULL DEFAULT 100.00 COMMENT 'Tỷ lệ % tối đa tiền đơn hàng được thanh toán bằng điểm',
    point_expiry_days INT NOT NULL DEFAULT 365 COMMENT 'Hạn sử dụng điểm (ngày), 0 nếu điểm có giá trị vô thời hạn',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_lpc_household FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    CONSTRAINT chk_lpc_spend CHECK (spend_amount_per_point > 0.00),
    CONSTRAINT chk_lpc_point_val CHECK (point_value > 0.00),
    CONSTRAINT chk_lpc_min_redeem CHECK (min_points_to_redeem >= 0),
    CONSTRAINT chk_lpc_max_rate CHECK (max_redeem_rate_per_order > 0.00 AND max_redeem_rate_per_order <= 100.00),
    CONSTRAINT chk_lpc_expiry CHECK (point_expiry_days >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu cấu hình chương trình tích điểm và đổi điểm của từng hộ kinh doanh';

CREATE INDEX idx_lpc_household ON loyalty_program_configs(household_id);

-- 2. Tạo bảng customer_point_transactions
CREATE TABLE IF NOT EXISTS customer_point_transactions (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh giao dịch điểm',
    household_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết hộ kinh doanh',
    customer_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết khách hàng thân thiết',
    order_id VARCHAR(36) NULL COMMENT 'Khóa ngoại đơn bán hàng phát sinh biến động (nếu có)',
    return_ticket_id VARCHAR(36) NULL COMMENT 'Khóa ngoại phiếu trả hàng thu hồi điểm (nếu có)',
    type VARCHAR(30) NOT NULL COMMENT 'Phân loại: EARN (Tích điểm), REDEEM (Tiêu điểm), RETURN_DEDUCTION (Thu hồi trả hàng), EXPIRED (Hết hạn), ADJUST (Điều chỉnh tay)',
    points_change INT NOT NULL COMMENT 'Số điểm biến động (+ tăng, - giảm)',
    balance_after INT NOT NULL COMMENT 'Số dư điểm tích lũy của khách ngay sau biến động',
    monetary_equivalent DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Giá trị quy đổi thành tiền tương đương tại thời điểm giao dịch',
    description VARCHAR(500) NULL COMMENT 'Mô tả chi tiết nguyên nhân biến động hoặc chứng từ tham chiếu',
    expiry_date DATE NULL COMMENT 'Ngày hết hạn của số điểm tích lũy (áp dụng cho giao dịch EARN)',
    created_by_user_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại nhân viên/chủ hộ thực hiện thao tác',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cpt_household FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    CONSTRAINT fk_cpt_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_cpt_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    CONSTRAINT fk_cpt_return FOREIGN KEY (return_ticket_id) REFERENCES return_tickets(id) ON DELETE SET NULL,
    CONSTRAINT fk_cpt_user FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_cpt_type CHECK (type IN ('EARN', 'REDEEM', 'RETURN_DEDUCTION', 'EXPIRED', 'ADJUST')),
    CONSTRAINT chk_cpt_points CHECK (points_change <> 0),
    CONSTRAINT chk_cpt_balance CHECK (balance_after >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng sổ cái lưu vết mọi biến động điểm thưởng của khách hàng';

CREATE INDEX idx_cpt_household_customer ON customer_point_transactions(household_id, customer_id);
CREATE INDEX idx_cpt_created_at ON customer_point_transactions(created_at);
CREATE INDEX idx_cpt_type ON customer_point_transactions(type);
CREATE INDEX idx_cpt_order ON customer_point_transactions(order_id);

-- 3. Cập nhật bảng customers
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS loyalty_points INT NOT NULL DEFAULT 0 COMMENT 'Số điểm tích lũy khả dụng hiện tại của khách hàng';

-- 4. Cập nhật bảng orders
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS point_discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Số tiền giảm trừ do đổi điểm tích lũy (QTN-26)',
    ADD COLUMN IF NOT EXISTS points_redeemed INT NOT NULL DEFAULT 0 COMMENT 'Số điểm khách hàng đã sử dụng để đổi giảm trừ trên đơn',
    ADD COLUMN IF NOT EXISTS points_earned INT NOT NULL DEFAULT 0 COMMENT 'Số điểm khách hàng được tích lũy từ đơn hàng này sau khi hoàn tất';

-- 5. Cập nhật bảng return_tickets
ALTER TABLE return_tickets
    ADD COLUMN IF NOT EXISTS points_deducted INT NOT NULL DEFAULT 0 COMMENT 'Số điểm thưởng đã bị thu hồi khi duyệt phiếu trả hàng';
