-- V28: Tạo bảng danh mục thu chi và bảng phiếu thu chi tiền mặt ngoài bán hàng trong ca (NCL-03-CN-014)

-- 1. Bảng danh mục loại thu chi tiền mặt
CREATE TABLE IF NOT EXISTS cash_transaction_categories (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh loại thu chi',
    household_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết hộ kinh doanh để cô lập dữ liệu',
    name VARCHAR(100) NOT NULL COMMENT 'Tên loại thu chi (ví dụ: Nạp tiền lẻ, Mua túi gói hàng, Trả ship ngoài...)',
    type VARCHAR(20) NOT NULL COMMENT 'Phân loại: INCOME (Thu) hoặc EXPENSE (Chi)',
    description TEXT NULL COMMENT 'Mô tả chi tiết mục đích sử dụng',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái hiệu lực',
    is_system_default BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Đánh dấu danh mục mẫu mặc định do hệ thống tạo sẵn',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Hỗ trợ Soft Delete',
    CONSTRAINT fk_ctc_household FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    CONSTRAINT chk_ctc_type CHECK (type IN ('INCOME', 'EXPENSE')),
    CONSTRAINT uq_ctc_household_name_type UNIQUE (household_id, name, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng danh mục loại thu chi tiền mặt ngoài bán hàng';

CREATE INDEX idx_ctc_household ON cash_transaction_categories(household_id);
CREATE INDEX idx_ctc_household_type ON cash_transaction_categories(household_id, type);
CREATE INDEX idx_ctc_household_active ON cash_transaction_categories(household_id, is_active);

-- 2. Bảng lưu phiếu thu chi tiền mặt ngoài bán hàng trong ca
CREATE TABLE IF NOT EXISTS cash_transactions (
    id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID định danh phiếu thu chi',
    code VARCHAR(50) NOT NULL COMMENT 'Mã phiếu hiển thị duy nhất (ví dụ: PT-260909-0001, PC-260909-0001)',
    household_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại hộ kinh doanh',
    shift_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại ca bán hàng gắn liền phiếu',
    category_id VARCHAR(36) NULL COMMENT 'Khóa ngoại loại thu chi',
    category_name VARCHAR(100) NOT NULL COMMENT 'Tên loại thu chi snapshot tại thời điểm lập phiếu',
    type VARCHAR(20) NOT NULL COMMENT 'Loại giao dịch: INCOME hoặc EXPENSE',
    amount DECIMAL(15, 2) NOT NULL COMMENT 'Số tiền mặt thu vào hoặc chi ra (VND)',
    person_name VARCHAR(255) NULL COMMENT 'Họ tên người nộp tiền (với Thu) hoặc người nhận tiền (với Chi)',
    notes TEXT NULL COMMENT 'Lý do, ghi chú chi tiết về khoản thu chi',
    status VARCHAR(30) NOT NULL DEFAULT 'APPROVED' COMMENT 'Trạng thái: APPROVED, PENDING_APPROVAL, REJECTED, CANCELLED',
    created_by_user_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại nhân viên tạo phiếu',
    approved_by_user_id VARCHAR(36) NULL COMMENT 'Khóa ngoại chủ hộ đã duyệt (nếu là khoản chi cần duyệt)',
    approved_at TIMESTAMP NULL COMMENT 'Thời điểm phê duyệt',
    rejection_reason TEXT NULL COMMENT 'Lý do từ chối nếu phiếu chi bị từ chối',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ct_household FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    CONSTRAINT fk_ct_shift FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
    CONSTRAINT fk_ct_category FOREIGN KEY (category_id) REFERENCES cash_transaction_categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_ct_creator FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ct_approver FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_ct_type CHECK (type IN ('INCOME', 'EXPENSE')),
    CONSTRAINT chk_ct_amount CHECK (amount > 0.00),
    CONSTRAINT chk_ct_status CHECK (status IN ('APPROVED', 'PENDING_APPROVAL', 'REJECTED', 'CANCELLED')),
    CONSTRAINT uq_cash_transaction_code UNIQUE (household_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu phiếu thu chi tiền mặt ngoài bán hàng trong ca';

CREATE INDEX idx_ct_household ON cash_transactions(household_id);
CREATE INDEX idx_ct_shift ON cash_transactions(shift_id);
CREATE INDEX idx_ct_shift_status ON cash_transactions(shift_id, status);
CREATE INDEX idx_ct_shift_type_status ON cash_transactions(shift_id, type, status);
CREATE INDEX idx_ct_created_by ON cash_transactions(created_by_user_id);
CREATE INDEX idx_ct_created_at ON cash_transactions(created_at);

-- 3. Cập nhật bảng cài đặt hộ kinh doanh bổ sung hạn mức duyệt chi tiền mặt
ALTER TABLE business_household_settings 
    ADD COLUMN expense_approval_threshold DECIMAL(15, 2) NOT NULL DEFAULT 500000.00 COMMENT 'Hạn mức chi tiền mặt tối đa nhân viên được tự duyệt (VND)';
