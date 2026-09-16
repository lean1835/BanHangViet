-- Migration V48: Bổ sung cấu hình Onboarding thiết lập lần đầu và các mốc thời hạn nghiệp vụ của hộ kinh doanh
-- Tasks: NCL-09-CN-007, NCL-09-CN-008, NCL-09-CN-009

-- 1. Bổ sung các cột vào bảng business_household_settings
ALTER TABLE business_household_settings
    ADD COLUMN is_onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN is_onboarding_skipped BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN return_days_limit INT NOT NULL DEFAULT 7,
    ADD COLUMN max_offline_sync_hours INT NOT NULL DEFAULT 24,
    ADD COLUMN debt_reminder_days_before INT NOT NULL DEFAULT 3;

-- 2. Đảm bảo bảng suppliers tồn tại (phục vụ NCL-09-CN-009 & NCL-13-CN-001)
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    household_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    tax_code VARCHAR(20) NULL,
    email VARCHAR(100) NULL,
    address VARCHAR(255) NULL,
    note TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    current_debt DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    INDEX idx_supplier_household (household_id),
    INDEX idx_supplier_phone (household_id, phone_number),
    INDEX idx_supplier_tax_code (household_id, tax_code),
    FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Đảm bảo bảng supplier_debts tồn tại (phục vụ NCL-09-CN-009 & NCL-13-CN-001)
CREATE TABLE IF NOT EXISTS supplier_debts (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    household_id VARCHAR(36) NOT NULL,
    supplier_id VARCHAR(36) NOT NULL,
    goods_receipt_id VARCHAR(36) NULL,
    amount DECIMAL(15,2) NOT NULL,
    remaining_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    due_date TIMESTAMP NULL,
    payment_method VARCHAR(20) NULL,
    notes TEXT NULL,
    created_by_user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_supplier_debt_household (household_id),
    INDEX idx_supplier_debt_supplier (supplier_id),
    FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (goods_receipt_id) REFERENCES goods_receipts(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
