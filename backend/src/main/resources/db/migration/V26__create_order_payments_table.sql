-- V24: Tạo bảng order_payments hỗ trợ thanh toán kết hợp nhiều hình thức (NCL-03-CN-011)

CREATE TABLE IF NOT EXISTS order_payments (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh giao dịch thanh toán',
    order_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết đơn hàng',
    household_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết hộ kinh doanh để cô lập dữ liệu multi-tenant',
    payment_method VARCHAR(20) NOT NULL COMMENT 'Hình thức thanh toán: CASH, BANK_TRANSFER, DEBT',
    amount DECIMAL(15, 2) NOT NULL COMMENT 'Số tiền thanh toán theo hình thức này',
    amount_given DECIMAL(15, 2) NULL COMMENT 'Số tiền khách đưa (áp dụng cho CASH)',
    change_amount DECIMAL(15, 2) NULL DEFAULT 0.00 COMMENT 'Số tiền thối lại khách (áp dụng cho CASH)',
    transaction_code VARCHAR(100) NULL COMMENT 'Mã giao dịch / mã tham chiếu ngân hàng (áp dụng cho BANK_TRANSFER)',
    is_confirmed BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái xác nhận nhận tiền (mặc định TRUE cho CASH và DEBT, kiểm soát riêng cho BANK_TRANSFER)',
    confirmed_at TIMESTAMP NULL COMMENT 'Thời điểm xác nhận nhận tiền',
    confirmed_by_user_id VARCHAR(36) NULL COMMENT 'Người dùng xác nhận nhận tiền',
    notes VARCHAR(500) NULL COMMENT 'Ghi chú cho khoản thanh toán này',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_payments_household FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_payments_confirmed_by FOREIGN KEY (confirmed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_order_payments_method CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'DEBT')),
    CONSTRAINT chk_order_payments_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng chi tiết các hình thức thanh toán của đơn hàng (hỗ trợ thanh toán kết hợp)';

-- Các chỉ mục tối ưu tìm kiếm, tổng hợp doanh thu và đối soát ca
CREATE INDEX idx_order_payments_order ON order_payments(order_id);
CREATE INDEX idx_order_payments_household ON order_payments(household_id);
CREATE INDEX idx_order_payments_household_method ON order_payments(household_id, payment_method);
CREATE INDEX idx_order_payments_created_at ON order_payments(household_id, created_at);
