-- =========================================================================
-- MIGRATION V40: Tạo bảng quản lý phiếu trả hàng lại nhà cung cấp (NCL-13-CN-006)
-- =========================================================================

-- 1. Bảng Phiếu trả hàng cho nhà cung cấp
CREATE TABLE IF NOT EXISTS supplier_returns (
    id VARCHAR(36) NOT NULL,
    household_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết hộ kinh doanh',
    receipt_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết phiếu nhập kho gốc',
    supplier_id VARCHAR(36) NULL COMMENT 'Khóa ngoại nhà cung cấp (NULL nếu phiếu nhập không có NCC)',
    created_by_user_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại người lập phiếu trả hàng',
    return_number VARCHAR(50) NOT NULL COMMENT 'Mã số phiếu trả hàng (ví dụ: TH-NCC-20260914-XXXX)',
    return_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày giờ thực hiện trả hàng',
    total_return_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Tổng giá trị hàng trả lại cho NCC',
    reason VARCHAR(100) NOT NULL COMMENT 'Lý do chính: Hàng hỏng, Cận hạn, Sai quy cách, Giao thừa, Khác',
    notes TEXT NULL COMMENT 'Ghi chú bổ sung chi tiết',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Hỗ trợ Soft Delete',
    PRIMARY KEY (id),
    CONSTRAINT uq_supplier_return_number UNIQUE (return_number),
    CONSTRAINT chk_sr_total_amount CHECK (total_return_amount >= 0.00),
    CONSTRAINT fk_sr_household FOREIGN KEY (household_id) REFERENCES business_households(id) ON DELETE CASCADE,
    CONSTRAINT fk_sr_receipt FOREIGN KEY (receipt_id) REFERENCES goods_receipts(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sr_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    CONSTRAINT fk_sr_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu thông tin phiếu trả hàng lại nhà cung cấp (NCL-13-CN-006)';

CREATE INDEX idx_sr_household ON supplier_returns(household_id);
CREATE INDEX idx_sr_receipt ON supplier_returns(receipt_id);
CREATE INDEX idx_sr_supplier ON supplier_returns(supplier_id);
CREATE INDEX idx_sr_created_at ON supplier_returns(created_at);

-- 2. Bảng Chi tiết dòng mặt hàng trả lại nhà cung cấp
CREATE TABLE IF NOT EXISTS supplier_return_items (
    id VARCHAR(36) NOT NULL,
    supplier_return_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết phiếu trả hàng',
    receipt_detail_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại liên kết dòng chi tiết phiếu nhập gốc',
    product_id VARCHAR(36) NOT NULL COMMENT 'Khóa ngoại mặt hàng được trả lại',
    quantity DECIMAL(12, 3) NOT NULL COMMENT 'Số lượng trả theo đơn vị nhập',
    purchase_price DECIMAL(15, 2) NOT NULL COMMENT 'Đơn giá nhập trên dòng phiếu nhập gốc',
    unit_conversion_id VARCHAR(36) NULL COMMENT 'Khóa ngoại đơn vị quy đổi nếu có',
    unit_name VARCHAR(50) NULL COMMENT 'Tên đơn vị tính tại thời điểm trả',
    conversion_factor DECIMAL(12, 3) NULL DEFAULT 1.000 COMMENT 'Hệ số quy đổi sang đơn vị cơ sở',
    base_quantity DECIMAL(12, 3) NOT NULL COMMENT 'Số lượng quy đổi về đơn vị cơ sở',
    base_purchase_price DECIMAL(15, 2) NOT NULL COMMENT 'Đơn giá nhập theo đơn vị cơ sở',
    subtotal DECIMAL(15, 2) NOT NULL COMMENT 'Thành tiền = quantity * purchase_price',
    item_reason VARCHAR(255) NULL COMMENT 'Lý do chi tiết cho từng dòng hàng nếu có',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_sri_qty CHECK (quantity > 0.000),
    CONSTRAINT chk_sri_price CHECK (purchase_price >= 0.00),
    CONSTRAINT chk_sri_subtotal CHECK (subtotal >= 0.00),
    CONSTRAINT fk_sri_return FOREIGN KEY (supplier_return_id) REFERENCES supplier_returns(id) ON DELETE CASCADE,
    CONSTRAINT fk_sri_receipt_detail FOREIGN KEY (receipt_detail_id) REFERENCES goods_receipt_details(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sri_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sri_unit_conversion FOREIGN KEY (unit_conversion_id) REFERENCES product_unit_conversions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu chi tiết các mặt hàng trả lại nhà cung cấp (NCL-13-CN-006)';

CREATE INDEX idx_sri_return ON supplier_return_items(supplier_return_id);
CREATE INDEX idx_sri_receipt_detail ON supplier_return_items(receipt_detail_id);
CREATE INDEX idx_sri_product ON supplier_return_items(product_id);
