-- V33: Tạo bảng biên bản đối chiếu công nợ và cập nhật khóa nợ chống sửa lùi (NCL-10-CN-007)

-- 1. Tạo bảng customer_debt_reconciliations
CREATE TABLE IF NOT EXISTS customer_debt_reconciliations (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh biên bản đối chiếu công nợ',
    code VARCHAR(50) NOT NULL COMMENT 'Mã biên bản hiển thị duy nhất trong hộ (ví dụ: DREC-260913-0001)',
    household_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết hộ kinh doanh',
    customer_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại khách hàng được đối chiếu',
    start_date DATE NOT NULL COMMENT 'Ngày bắt đầu kỳ đối chiếu',
    end_date DATE NOT NULL COMMENT 'Ngày kết thúc kỳ đối chiếu',
    opening_debt_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Số dư nợ đầu kỳ (tính trước 00:00:00 ngày startDate)',
    total_debt_incurred DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Tổng phát sinh nợ tăng trong kỳ (DEBT_CREATED)',
    total_debt_paid DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Tổng phát sinh nợ giảm trong kỳ (DEBT_PAID)',
    closing_debt_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Số dư nợ cuối kỳ = Opening + Incurred - Paid',
    closing_debt_in_words VARCHAR(255) NOT NULL COMMENT 'Số dư nợ cuối kỳ bằng chữ tiếng Việt',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT 'Trạng thái: DRAFT (Bản nháp), CONFIRMED (Đã xác nhận & khóa sổ), CANCELLED (Đã hủy)',
    notes TEXT NULL COMMENT 'Ghi chú, điều khoản thỏa thuận chốt nợ giữa hai bên',
    confirmed_at TIMESTAMP NULL COMMENT 'Thời điểm chủ hộ bấm xác nhận chốt sổ sau khi khách ký',
    confirmed_by_user_id VARCHAR(36) NULL COMMENT 'Khóa ngoại chủ hộ đã xác nhận chốt sổ',
    reconciled_to_date DATE NULL COMMENT 'Mốc ngày chốt đối chiếu ghi nhận vào hệ thống (= end_date)',
    created_by_user_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại người tạo biên bản',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Hỗ trợ Soft Delete',
    CONSTRAINT fk_cdr_household FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    CONSTRAINT fk_cdr_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_cdr_confirmed_by FOREIGN KEY (confirmed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_cdr_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_cdr_date_range CHECK (start_date <= end_date),
    CONSTRAINT chk_cdr_status CHECK (status IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
    CONSTRAINT uq_cdr_household_code UNIQUE (household_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu biên bản đối chiếu công nợ khách hàng';

CREATE INDEX idx_cdr_household ON customer_debt_reconciliations(household_id);
CREATE INDEX idx_cdr_customer ON customer_debt_reconciliations(customer_id);
CREATE INDEX idx_cdr_status ON customer_debt_reconciliations(status);
CREATE INDEX idx_cdr_dates ON customer_debt_reconciliations(start_date, end_date);
CREATE INDEX idx_cdr_reconciled_to_date ON customer_debt_reconciliations(customer_id, reconciled_to_date);

-- 2. Tạo bảng customer_debt_reconciliation_items (Snapshot bất biến)
CREATE TABLE IF NOT EXISTS customer_debt_reconciliation_items (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh dòng chi tiết snapshot đối chiếu',
    reconciliation_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết biên bản đối chiếu',
    customer_debt_id VARCHAR(36) NULL COMMENT 'Khóa ngoại liên kết khoản nợ gốc',
    transaction_date TIMESTAMP NOT NULL COMMENT 'Thời điểm phát sinh giao dịch nợ/trả nợ',
    type VARCHAR(20) NOT NULL COMMENT 'Phân loại: DEBT_CREATED (Mua nợ), DEBT_PAID (Trả nợ/Cấn trừ)',
    reference_code VARCHAR(100) NULL COMMENT 'Mã tham chiếu (Số hóa đơn, số đơn hàng, số phiếu thu)',
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Số tiền phát sinh của giao dịch',
    running_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Số dư nợ lũy kế sau giao dịch này',
    notes TEXT NULL COMMENT 'Ghi chú chi tiết giao dịch',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cdri_reconciliation FOREIGN KEY (reconciliation_id) REFERENCES customer_debt_reconciliations(id) ON DELETE CASCADE,
    CONSTRAINT fk_cdri_customer_debt FOREIGN KEY (customer_debt_id) REFERENCES customer_debts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng chi tiết snapshot giao dịch đối chiếu công nợ';

CREATE INDEX idx_cdri_reconciliation ON customer_debt_reconciliation_items(reconciliation_id);
CREATE INDEX idx_cdri_customer_debt ON customer_debt_reconciliation_items(customer_debt_id);

-- 3. Cập nhật bảng customer_debts để hỗ trợ Khóa sổ chống sửa lùi
ALTER TABLE customer_debts
    ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Đánh dấu khoản nợ đã bị khóa sổ đối chiếu',
    ADD COLUMN IF NOT EXISTS reconciliation_id VARCHAR(36) NULL COMMENT 'Khóa ngoại biên bản đối chiếu đã chốt khoản nợ này';

ALTER TABLE customer_debts
    ADD CONSTRAINT fk_cd_reconciliation FOREIGN KEY (reconciliation_id) REFERENCES customer_debt_reconciliations(id) ON DELETE SET NULL;

CREATE INDEX idx_cd_is_locked ON customer_debts(is_locked);
CREATE INDEX idx_cd_reconciliation_id ON customer_debts(reconciliation_id);

-- 4. Cập nhật bảng customers để lưu vết mốc đối chiếu gần nhất
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS last_reconciled_date DATE NULL COMMENT 'Ngày chốt đối chiếu nợ gần nhất',
    ADD COLUMN IF NOT EXISTS last_reconciliation_id VARCHAR(36) NULL COMMENT 'Khóa ngoại biên bản đối chiếu gần nhất';

ALTER TABLE customers
    ADD CONSTRAINT fk_cust_last_reconciliation FOREIGN KEY (last_reconciliation_id) REFERENCES customer_debt_reconciliations(id) ON DELETE SET NULL;
